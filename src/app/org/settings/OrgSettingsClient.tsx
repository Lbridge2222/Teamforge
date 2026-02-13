"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Buildings,
  Users,
  CreditCard,
  PencilSimple,
  Check,
  X,
  UserPlus,
  Trash,
  CaretDown,
  Crown,
  ShieldCheck,
  Pencil,
  Eye,
  ArrowLeft,
} from "@phosphor-icons/react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  CARD_CLASSES,
  BUTTON,
  INPUT_CLASSES,
  LABEL_CLASSES,
  SELECT_CLASSES,
} from "@/lib/design-system";
import { PLAN_LIMITS } from "@/lib/types";
import type { Organisation, OrgMember, Plan } from "@/lib/types";
import { SectionHeader, Badge } from "@/components/shared/Badge";

type EnrichedMember = OrgMember & { email: string; name: string | null };

const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  editor: Pencil,
  viewer: Eye,
} as const;

const ROLE_COLORS = {
  owner: "text-amber-600 bg-amber-50",
  admin: "text-blue-600 bg-blue-50",
  editor: "text-emerald-600 bg-emerald-50",
  viewer: "text-slate-500 bg-slate-100",
} as const;

const PLAN_BADGES: Record<Plan, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-slate-100 text-slate-700" },
  starter: { label: "Starter", color: "bg-blue-100 text-blue-700" },
  pro: { label: "Pro", color: "bg-emerald-100 text-emerald-700" },
  enterprise: {
    label: "Enterprise",
    color: "bg-violet-100 text-violet-700",
  },
};

export function OrgSettingsClient() {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [myRole, setMyRole] = useState<string>("viewer");
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Org name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("editor");
  const [inviting, setInviting] = useState(false);

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/org");
      if (!res.ok) throw new Error("Failed to fetch org");
      const data = await res.json();
      setOrg(data.org);
      setMyRole(data.membership.role);
      setNameValue(data.org.name);
    } catch {
      toast.error("Failed to load organisation");
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/org/members");
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      toast.error("Failed to load members");
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchOrg(), fetchMembers()]).finally(() => setLoading(false));
  }, [fetchOrg, fetchMembers]);

  async function handleNameSave() {
    if (!nameValue.trim()) return;
    try {
      const res = await fetch("/api/org", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setOrg(data.org);
      setEditingName(false);
      toast.success("Organisation name updated");
    } catch {
      toast.error("Failed to update name");
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to invite");
      }
      toast.success(`Invited ${inviteEmail.trim()}`);
      setInviteEmail("");
      setShowInvite(false);
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to invite member";
      toast.error(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      toast.success("Role updated");
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      toast.error(message);
    }
  }

  async function handleRemoveMember(memberId: string, email: string) {
    if (!confirm(`Remove ${email} from the organisation?`)) return;
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove");
      }
      toast.success("Member removed");
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Loading organisation settings...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500">No organisation found.</p>
        <Link href="/dashboard" className={BUTTON.primary}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const plan = org.plan as Plan;
  const limits = PLAN_LIMITS[plan];
  const planBadge = PLAN_BADGES[plan];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={20} weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Organisation Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your organisation, members, and plan
          </p>
        </div>
      </div>

      {/* ═══ Organisation Details ═══ */}
      <section>
        <SectionHeader title="Organisation" subtitle="Name and plan" />
        <div className={`${CARD_CLASSES} p-6 space-y-4`}>
          {/* Org name */}
          <div>
            <label className={LABEL_CLASSES}>Organisation Name</label>
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
                    setNameValue(org.name);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Buildings
                      size={16}
                      weight="bold"
                      className="text-blue-600"
                    />
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {org.name}
                  </span>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <PencilSimple size={16} weight="bold" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className={LABEL_CLASSES}>Current Plan</label>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 ${planBadge.color}`}
              >
                <CreditCard size={14} weight="bold" />
                {planBadge.label}
              </span>
              <span className="text-xs text-slate-500">
                {limits.workspaces === Infinity
                  ? "Unlimited"
                  : limits.workspaces}{" "}
                workspace{limits.workspaces !== 1 ? "s" : ""} ·{" "}
                {limits.orgMembers === Infinity
                  ? "Unlimited"
                  : limits.orgMembers}{" "}
                member{limits.orgMembers !== 1 ? "s" : ""}
              </span>
              {myRole === "owner" && (
                <Link
                  href="/org/billing"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Manage billing →
                </Link>
              )}
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className={LABEL_CLASSES}>Organisation Slug</label>
            <p className="text-sm text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
              {org.slug}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Members ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader
            title="Members"
            subtitle={`${members.length} of ${
              limits.orgMembers === Infinity ? "∞" : limits.orgMembers
            } seats used`}
          />
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className={BUTTON.primary}
            >
              <UserPlus size={16} weight="bold" />
              Invite Member
            </button>
          )}
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className={`${CARD_CLASSES} p-4 mb-4 flex items-end gap-3`}>
            <div className="flex-1">
              <label className={LABEL_CLASSES}>Email Address</label>
              <input
                className={INPUT_CLASSES}
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="w-36">
              <label className={LABEL_CLASSES}>Role</label>
              <select
                className={SELECT_CLASSES}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className={`${BUTTON.primary} ${
                inviting ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {inviting ? "Inviting..." : "Send Invite"}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className={BUTTON.secondary}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Members list */}
        <div className={`${CARD_CLASSES} overflow-hidden`}>
          {members.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No members yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  {isOwnerOrAdmin && (
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const RoleIcon =
                    ROLE_ICONS[m.role as keyof typeof ROLE_ICONS] ?? Eye;
                  const roleColor =
                    ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] ??
                    ROLE_COLORS.viewer;
                  const isPending = !m.acceptedAt;

                  return (
                    <tr
                      key={m.id}
                      className={i > 0 ? "border-t border-slate-100" : ""}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                            <Users
                              size={14}
                              weight="bold"
                              className="text-slate-400"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {m.name || m.email}
                            </p>
                            {m.name && (
                              <p className="text-xs text-slate-400">
                                {m.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isOwnerOrAdmin && m.role !== "owner" ? (
                          <Menu as="div" className="relative inline-block">
                            <MenuButton
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${roleColor}`}
                            >
                              <RoleIcon size={12} weight="bold" />
                              {m.role.charAt(0).toUpperCase() +
                                m.role.slice(1)}
                              <CaretDown size={10} weight="bold" />
                            </MenuButton>
                            <MenuItems className="absolute left-0 mt-1 w-32 origin-top-left rounded-xl border border-gray-200 bg-white py-1 shadow-lg focus:outline-none z-50">
                              {(
                                ["admin", "editor", "viewer"] as const
                              ).map((r) => (
                                <MenuItem key={r}>
                                  <button
                                    onClick={() => handleRoleChange(m.id, r)}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 data-[focus]:bg-slate-50 ${
                                      r === m.role
                                        ? "text-blue-600"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </button>
                                </MenuItem>
                              ))}
                            </MenuItems>
                          </Menu>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${roleColor}`}
                          >
                            <RoleIcon size={12} weight="bold" />
                            {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <Badge variant="warning">Pending</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      {isOwnerOrAdmin && (
                        <td className="py-3 px-4 text-right">
                          {m.role !== "owner" && (
                            <button
                              onClick={() =>
                                handleRemoveMember(m.id, m.email)
                              }
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove member"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ═══ Plan Limits Summary ═══ */}
      <section>
        <SectionHeader
          title="Plan Limits"
          subtitle={`Current plan: ${planBadge.label}`}
        />
        <div className={`${CARD_CLASSES} p-6`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <LimitCard
              label="Workspaces"
              limit={limits.workspaces}
            />
            <LimitCard
              label="Roles / Workspace"
              limit={limits.rolesPerWorkspace}
            />
            <LimitCard
              label="Activities / Workspace"
              limit={limits.activitiesPerWorkspace}
            />
            <LimitCard label="Members" limit={limits.orgMembers} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <FeatureCard label="AI Features" enabled={limits.aiFeatures} />
            <FeatureCard label="PDF Export" enabled={limits.exportPdf} />
            <FeatureCard label="API Access" enabled={limits.apiAccess} />
          </div>

          {plan !== "enterprise" && myRole === "owner" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/org/billing"
                className={BUTTON.primary}
              >
                <CreditCard size={16} weight="bold" />
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Danger Zone ═══ */}
      {myRole === "owner" && (
        <section>
          <SectionHeader title="Danger Zone" subtitle="Irreversible actions" />
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-800">
                  Delete Organisation
                </h3>
                <p className="text-xs text-red-600 mt-0.5">
                  Permanently deletes all workspaces, roles, activities, and
                  member data. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() =>
                  toast.error(
                    "Contact support to delete your organisation"
                  )
                }
                className="rounded-xl border-2 border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete Organisation
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function LimitCard({ label, limit }: { label: string; limit: number }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
      <p className="text-2xl font-bold text-slate-900">
        {limit === Infinity ? "∞" : limit}
      </p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function FeatureCard({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`text-center p-3 rounded-xl border ${
        enabled
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-400"
      }`}
    >
      <p className="text-lg font-bold">{enabled ? "✓" : "✗"}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  );
}
