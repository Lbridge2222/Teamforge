"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/lib/types";
import { BUTTON, CARD_CLASSES, CARD_CLASSES_HOVER, INPUT_CLASSES, TEXTAREA_CLASSES, SELECT_CLASSES, LABEL_CLASSES } from "@/lib/design-system";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/Badge";
import { MiniOrgChart, type OrgChartSummary } from "@/components/shared/MiniOrgChart";
import { toast } from "@/components/shared/Toast";
import {
  Plus,
  Folders,
  ArrowRight,
  CalendarBlank,
  Trash,
  Users,
  TreeStructure,
} from "@phosphor-icons/react/dist/ssr";

const TEMPLATES = [
  { id: "blank", name: "Blank", description: "Start from scratch" },
  { id: "saas-sales", name: "SaaS Sales", description: "Lead Gen → Close → CS Handoff" },
  { id: "customer-success", name: "Customer Success", description: "Onboarding → Renewal → Advocacy" },
  { id: "product-engineering", name: "Product & Engineering", description: "Discovery → Ship → Operate" },
  { id: "higher-ed-admissions", name: "Higher Ed Admissions", description: "Outreach → Enrolment" },
  { id: "recruitment", name: "Recruitment Agency", description: "Sourcing → Placement → Aftercare" },
];

type DashboardClientProps = {
  orgName: string;
  orgId: string;
  workspaces: Workspace[];
  userRole: string;
  summaries: Record<string, OrgChartSummary>;
};

export function DashboardClient({
  orgName,
  orgId,
  workspaces: initialWorkspaces,
  userRole,
  summaries,
}: DashboardClientProps) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTemplate, setNewTemplate] = useState("blank");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          name: newName.trim(),
          description: newDescription.trim() || null,
          template: newTemplate,
        }),
      });

      if (!res.ok) throw new Error("Failed to create workspace");

      const { workspace } = await res.json();
      setWorkspaces((prev) => [workspace, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewTemplate("blank");
      toast.success("Workspace created!");
      router.push(`/w/${workspace.id}/pipeline`);
    } catch {
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this workspace? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      toast.success("Workspace deleted");
    } catch {
      toast.error("Failed to delete workspace");
    }
  }

  const canCreate = userRole === "owner" || userRole === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{orgName}</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className={BUTTON.primary}>
            <Plus size={18} weight="bold" />
            New Workspace
          </button>
        )}
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<Folders size={48} weight="bold" />}
          title="No workspaces yet"
          description="Create your first workspace to start designing your team structure."
          action={
            canCreate ? (
              <button onClick={() => setShowCreate(true)} className={BUTTON.primary}>
                <Plus size={18} weight="bold" />
                Create Workspace
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => {
            const summary = summaries[ws.id];
            return (
            <div
              key={ws.id}
              className={`${CARD_CLASSES_HOVER} p-5 cursor-pointer group relative`}
              onClick={() => router.push(`/w/${ws.id}/pipeline`)}
            >
              <div className="flex items-start justify-between pr-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-gray-900 truncate">{ws.name}</h3>
                  {ws.description && (
                    <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {ws.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Mini org chart thumbnail */}
              {summary && summary.totalRoles > 0 && (
                <div className="mt-3">
                  <MiniOrgChart summary={summary} width={260} height={80} />
                </div>
              )}

              <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
                {summary && summary.totalRoles > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={13} weight="bold" />
                    {summary.totalRoles} role{summary.totalRoles !== 1 ? "s" : ""}
                  </span>
                )}
                {summary && summary.stages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <TreeStructure size={13} weight="bold" />
                    {summary.stages.length} stage{summary.stages.length !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarBlank size={13} weight="bold" />
                  {new Date(ws.updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {ws.industryTemplate && ws.industryTemplate !== "blank" && (
                  <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-blue-600 font-medium">
                    {ws.industryTemplate}
                  </span>
                )}
              </div>

              {canCreate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ws.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all z-10"
                  title="Delete Workspace"
                >
                  <Trash size={18} weight="bold" />
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className={LABEL_CLASSES}>Workspace Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Sales Team Q1 2026"
              className={INPUT_CLASSES}
              autoFocus
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What team or structure is this workspace for?"
              className={TEXTAREA_CLASSES}
              rows={3}
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Start From Template</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewTemplate(t.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    newTemplate === t.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-gray-900">{t.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={BUTTON.ghost}>
              Cancel
            </button>
            <button type="submit" disabled={creating || !newName.trim()} className={BUTTON.primary}>
              {creating ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
