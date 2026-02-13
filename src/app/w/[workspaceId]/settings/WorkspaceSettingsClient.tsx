"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PencilSimple,
  Check,
  X,
  Trash,
  DownloadSimple,
  Archive,
  Calendar,
} from "@phosphor-icons/react";
import {
  CARD_CLASSES,
  BUTTON,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
  LABEL_CLASSES,
} from "@/lib/design-system";
import { SectionHeader } from "@/components/shared/Badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

type Props = { workspaceId: string };

export function WorkspaceSettingsClient({ workspaceId }: Props) {
  const router = useRouter();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const stages = useWorkspaceStore((s) => s.stages);
  const roles = useWorkspaceStore((s) => s.roles);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityCategories = useWorkspaceStore((s) => s.categories);
  const handoffs = useWorkspaceStore((s) => s.handoffs);
  const progressions = useWorkspaceStore((s) => s.progressions);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workspace?.name ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(workspace?.description ?? "");
  const [deleting, setDeleting] = useState(false);

  async function handleNameSave() {
    if (!nameValue.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingName(false);
      toast.success("Workspace name updated");
      router.refresh();
    } catch {
      toast.error("Failed to update workspace name");
    }
  }

  async function handleDescSave() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descValue.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingDesc(false);
      toast.success("Description updated");
      router.refresh();
    } catch {
      toast.error("Failed to update description");
    }
  }

  function handleExportJSON() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      workspace: {
        name: workspace?.name,
        description: workspace?.description,
      },
      stages: stages.map((s) => ({
        name: s.name,
        sortOrder: s.sortOrder,
        systemsOwned: s.systemsOwned,
      })),
      roles: roles.map((r) => ({
        jobTitle: r.jobTitle,
        corePurpose: r.corePurpose,
        colorIndex: r.colorIndex,
        cyclePosition: r.cyclePosition,
        belbinPrimary: r.belbinPrimary,
        belbinSecondary: r.belbinSecondary,
        budgetLevel: r.budgetLevel,
      })),
      activityCategories: activityCategories.map((c) => ({
        name: c.name,
        sortOrder: c.sortOrder,
      })),
      activities: activities.map((a) => ({
        name: a.name,
        notes: a.notes,
      })),
      handoffs: handoffs.map((h) => ({
        sla: h.sla,
        tensions: h.tensions,
        dataHandoff: h.dataHandoff,
      })),
      progressions: progressions.map((p) => ({
        tier: p.tier,
        growthTrack: p.growthTrack,
        autonomy: p.autonomy,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace?.name?.replace(/\s+/g, "-").toLowerCase() ?? "workspace"}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workspace exported as JSON");
  }

  async function handleDelete() {
    const confirmText = workspace?.name ?? "this workspace";
    const input = prompt(
      `Type "${confirmText}" to permanently delete this workspace:`
    );
    if (input !== confirmText) {
      if (input !== null) toast.error("Workspace name didn't match");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete workspace");
      setDeleting(false);
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Loading workspace settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Workspace Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure and manage this workspace
        </p>
      </div>

      {/* ═══ General ═══ */}
      <section>
        <SectionHeader title="General" subtitle="Workspace details" />
        <div className={`${CARD_CLASSES} p-6 space-y-5`}>
          {/* Name */}
          <div>
            <label className={LABEL_CLASSES}>Workspace Name</label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  className={`${INPUT_CLASSES} flex-1`}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                >
                  <Check size={18} weight="bold" />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(workspace.name);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  {workspace.name}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <PencilSimple size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={LABEL_CLASSES}>Description</label>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  className={TEXTAREA_CLASSES}
                  rows={3}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  placeholder="What is this workspace for?"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleDescSave} className={BUTTON.primary}>
                    <Check size={14} weight="bold" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingDesc(false);
                      setDescValue(workspace.description ?? "");
                    }}
                    className={BUTTON.secondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-slate-600 flex-1">
                  {workspace.description || (
                    <span className="text-slate-400 italic">
                      No description
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setEditingDesc(true)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
                >
                  <PencilSimple size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} weight="bold" />
                Created{" "}
                {new Date(workspace.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>·</span>
              <span>
                {stages.length} stage{stages.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>
                {roles.length} role{roles.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>
                {activities.length} activit
                {activities.length !== 1 ? "ies" : "y"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Export ═══ */}
      <section>
        <SectionHeader title="Export" subtitle="Download workspace data" />
        <div className={`${CARD_CLASSES} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Export as JSON
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download all workspace data — stages, roles, activities,
                handoffs, and progressions — as a JSON file.
              </p>
            </div>
            <button onClick={handleExportJSON} className={BUTTON.secondary}>
              <DownloadSimple size={16} weight="bold" />
              Export JSON
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Danger Zone ═══ */}
      <section>
        <SectionHeader title="Danger Zone" subtitle="Irreversible actions" />
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-800">
                Archive Workspace
              </h3>
              <p className="text-xs text-red-600 mt-0.5">
                Hide this workspace from the dashboard. Can be unarchived later.
              </p>
            </div>
            <button
              onClick={() => toast.info("Archive functionality coming soon")}
              className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Archive size={14} weight="bold" />
              Archive
            </button>
          </div>

          <div className="border-t border-red-200 pt-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-800">
                Delete Workspace
              </h3>
              <p className="text-xs text-red-600 mt-0.5">
                Permanently delete this workspace and all its data. This cannot
                be undone.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`rounded-xl border-2 border-red-500 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 ${
                deleting ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Trash size={14} weight="bold" />
              {deleting ? "Deleting..." : "Delete Workspace"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
