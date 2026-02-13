"use client";

import { useState, useMemo, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  INPUT_CLASSES,
  SELECT_CLASSES,
  TEXTAREA_CLASSES,
  BUTTON,
  ROLE_COLORS,
} from "@/lib/design-system";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import {
  CaretDown,
  CaretRight,
  Check,
  Users,
  Question,
  Trash,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import { ActivityChangeTracker } from "./ActivityChangeTracker";
import type { Activity, ActivityCategory, TeamRole } from "@/lib/types";

type ActivityRowProps = {
  activity: Activity;
  category: ActivityCategory;
  isExpanded: boolean;
  onToggle: () => void;
};

export function ActivityRow({
  activity,
  category,
  isExpanded,
  onToggle,
}: ActivityRowProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);
  const categories = useWorkspaceStore((s) => s.categories);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const progressions = useWorkspaceStore((s) => s.progressions);
  const updateActivity = useWorkspaceStore((s) => s.updateActivity);
  const removeActivity = useWorkspaceStore((s) => s.removeActivity);
  const addActivityAssignment = useWorkspaceStore((s) => s.addActivityAssignment);
  const removeActivityAssignment = useWorkspaceStore((s) => s.removeActivityAssignment);

  const [editName, setEditName] = useState(activity.name);
  const [editNotes, setEditNotes] = useState(activity.notes ?? "");
  const [editCategoryId, setEditCategoryId] = useState(activity.categoryId);
  const [editStageId, setEditStageId] = useState(activity.stageId ?? "");

  // Assigned role IDs
  const assignedRoleIds = useMemo(
    () =>
      activityAssignments
        .filter((aa) => aa.activityId === activity.id)
        .map((aa) => aa.roleId),
    [activityAssignments, activity.id]
  );

  // Create a snapshot when first expanded (if one doesn't exist)
  useEffect(() => {
    if (isExpanded && !activity.preChangeSnapshot) {
      const snapshot = {
        name: activity.name,
        categoryId: activity.categoryId,
        stageId: activity.stageId,
        notes: activity.notes,
        roleIds: assignedRoleIds,
      };
      updateActivity(activity.id, { preChangeSnapshot: snapshot });
      fetch(`/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preChangeSnapshot: snapshot }),
      });
    }
  }, [isExpanded, activity, assignedRoleIds, updateActivity]);

  // Stretch goal context: find roles that have this activity as a growth target
  const stretchForRoles = useMemo(() => {
    const roleIds: string[] = [];
    progressions.forEach((prog) => {
      const growthActivityIds = (prog.growthActivityIds as string[]) ?? [];
      if (growthActivityIds.includes(activity.id)) {
        roleIds.push(prog.roleId);
      }
    });
    return roleIds.map((rid) => roles.find((r) => r.id === rid)).filter(Boolean) as TeamRole[];
  }, [progressions, activity.id, roles]);

  const assignmentCount = assignedRoleIds.length;
  const status: "owned" | "shared" | "unowned" =
    assignmentCount === 0
      ? "unowned"
      : assignmentCount === 1
      ? "owned"
      : "shared";

  // Belbin fit info
  const belbinIdeal = (category.belbinIdeal as string[]) ?? [];
  const hasBelbinFit = belbinIdeal.length > 0;

  // Stage name
  const stage = activity.stageId
    ? stages.find((s) => s.id === activity.stageId)
    : null;

  // ═══ Handlers ═══
  function handleCommitChanges() {
    const updates: Record<string, unknown> = {};
    if (editName !== activity.name) updates.name = editName;
    if (editNotes !== (activity.notes ?? "")) updates.notes = editNotes || null;
    if (editCategoryId !== activity.categoryId) updates.categoryId = editCategoryId;
    if (editStageId !== (activity.stageId ?? "")) updates.stageId = editStageId || null;

    // Clear the snapshot after committing
    updates.preChangeSnapshot = null;

    if (Object.keys(updates).length > 0) {
      updateActivity(activity.id, updates);
      fetch(`/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }
  }

  function handleDiscardChanges() {
    if (!activity.preChangeSnapshot) return;

    const snapshot = activity.preChangeSnapshot as {
      name: string;
      categoryId: string | null;
      stageId: string | null;
      notes: string | null;
      roleIds: string[];
    };

    // Revert local state
    setEditName(snapshot.name);
    setEditNotes(snapshot.notes ?? "");
    setEditCategoryId(snapshot.categoryId ?? "");
    setEditStageId(snapshot.stageId ?? "");

    // Revert role assignments
    const currentRoleIds = assignedRoleIds;
    const snapshotRoleIds = snapshot.roleIds;

    // Remove role assignments not in snapshot
    currentRoleIds.forEach((roleId) => {
      if (!snapshotRoleIds.includes(roleId)) {
        const assignment = activityAssignments.find(
          (aa) => aa.activityId === activity.id && aa.roleId === roleId
        );
        if (assignment) {
          removeActivityAssignment(assignment.id);
        }
      }
    });

    // Add role assignments from snapshot that are missing
    snapshotRoleIds.forEach((roleId) => {
      if (!currentRoleIds.includes(roleId)) {
        const newAssignment = {
          id: crypto.randomUUID(),
          activityId: activity.id,
          roleId,
        };
        addActivityAssignment(newAssignment);
      }
    });

    // Clear snapshot
    updateActivity(activity.id, { preChangeSnapshot: null });
    fetch(`/api/activities/${activity.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preChangeSnapshot: null,
        assignmentRoleIds: snapshotRoleIds,
      }),
    });
  }

  function toggleRoleAssignment(roleId: string) {
    const isAssigned = assignedRoleIds.includes(roleId);
    if (isAssigned) {
      // Check if this activity is a stretch goal for this role
      const isStretchGoal = stretchForRoles.some((r) => r.id === roleId);
      if (isStretchGoal) {
        const role = roles.find((r) => r.id === roleId);
        const confirmed = confirm(
          `⚠️ This activity is a stretch goal for ${role?.jobTitle}.\n\nUnassigning it will remove a development opportunity from their career progression.\n\nContinue?`
        );
        if (!confirmed) return;
      }

      // Find the assignment and remove
      const assignment = activityAssignments.find(
        (aa) => aa.activityId === activity.id && aa.roleId === roleId
      );
      if (assignment) {
        removeActivityAssignment(assignment.id);
        fetch(`/api/activities/${activity.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentRoleIds: assignedRoleIds.filter((id) => id !== roleId),
          }),
        });
      }
    } else {
      const newAssignment = {
        id: crypto.randomUUID(),
        activityId: activity.id,
        roleId,
      };
      addActivityAssignment(newAssignment);
      fetch(`/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentRoleIds: [...assignedRoleIds, roleId],
        }),
      });
    }
  }

  function handleMetadataSave() {
    // No longer auto-save, changes are tracked until commit
    return;
  }

  function handleDelete() {
    if (!confirm(`Delete "${activity.name}"?`)) return;
    removeActivity(activity.id);
    fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
  }

  // ═══ Role Belbin fit check ═══
  function isBelbinFit(role: TeamRole): boolean {
    if (!hasBelbinFit) return false;
    return (
      belbinIdeal.includes(role.belbinPrimary ?? "") ||
      belbinIdeal.includes(role.belbinSecondary ?? "")
    );
  }

  return (
    <div className="group border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Collapsed Row */}
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-2.5 text-left"
      >
        {/* Status indicator */}
        <div className="flex items-center justify-center w-3">
          {status === "owned" && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
          {status === "shared" && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          )}
          {status === "unowned" && (
            <span className="h-1.5 w-1.5 rounded-full border-[1.5px] border-red-400 bg-white" />
          )}
        </div>

        {/* Activity name */}
        <span
          className={`font-medium text-[13px] truncate ${
            status === "unowned" ? "text-gray-900" : "text-gray-700"
          }`}
        >
          {activity.name}
        </span>

        {/* Stage & Roles */}
        <div className="flex items-center gap-6">
           {stage && (
             <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
               {stage.name}
             </span>
           )}

           {/* Assigned roles summary */}
           <div className="flex items-center gap-1 min-w-[60px] justify-end">
             {assignmentCount === 0 ? (
               <span className="text-[11px] text-gray-300 italic">--</span>
             ) : (
               <div className="flex items-center -space-x-1.5 hover:space-x-0 transition-all">
                 {assignedRoleIds.slice(0, 4).map((rid) => {
                   const role = roles.find((r) => r.id === rid);
                   if (!role) return null;
                   return (
                     <div key={rid} className="ring-2 ring-white rounded-full z-0 hover:z-10 relative">
                        <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                     </div>
                   );
                 })}
                 {assignmentCount > 4 && (
                   <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 font-medium ring-2 ring-white z-0">
                     +{assignmentCount - 4}
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>

        {/* Chevron */}
        <div className="pl-1 text-gray-300 group-hover:text-gray-500 transition-colors">
          {isExpanded ? (
            <CaretDown size={14} weight="bold" />
          ) : (
            <CaretRight size={14} weight="bold" />
          )}
        </div>
      </button>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 px-5 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Role assignment */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Role Assignment
              </h4>

              {hasBelbinFit && (
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[12px] text-blue-700 flex items-center gap-2">
                  <span className="font-semibold shrink-0">Belbin best fit: </span>
                  <div className="flex flex-wrap gap-2">
                    {belbinIdeal.map((key) => {
                      const b = BELBIN_ROLES[key];
                      if (!b) return key;
                      return (
                        <span key={key} className="inline-flex items-center gap-1">
                          <BelbinIcon roleKey={key} className="w-3.5 h-3.5" />
                          {b.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const isAssigned = assignedRoleIds.includes(role.id);
                  const fit = hasBelbinFit && isBelbinFit(role);
                  const color = ROLE_COLORS[role.colorIndex ?? 0];

                  return (
                    <button
                      key={role.id}
                      onClick={() => toggleRoleAssignment(role.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium border transition-all ${
                        isAssigned
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {isAssigned && (
                        <Check size={12} weight="bold" className="text-emerald-600" />
                      )}
                      <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                      <span className="text-gray-700">{role.jobTitle}</span>
                      {fit && (
                        <span className="text-emerald-600 text-[10px]">
                          ✓ FIT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Belbin mismatch warning */}
              {hasBelbinFit && assignmentCount > 0 && (
                (() => {
                  const anyFit = assignedRoleIds.some((rid) => {
                    const role = roles.find((r) => r.id === rid);
                    return role && isBelbinFit(role);
                  });
                  if (!anyFit) {
                    return (
                      <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
                        <Warning size={14} weight="bold" />
                        <span>
                          <span className="font-bold">Belbin mismatch</span> —
                          ideal:{" "}
                          {belbinIdeal
                            .map((key) => BELBIN_ROLES[key]?.label ?? key)
                            .join(", ")}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>

            {/* Right: Metadata */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Details
              </h4>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={INPUT_CLASSES + " text-[13px]"}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Category
                  </label>
                  <select
                    value={editCategoryId ?? ""}
                    onChange={(e) => {
                      setEditCategoryId(e.target.value);
                    }}
                    className={SELECT_CLASSES + " text-[13px]"}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Stage
                  </label>
                  <select
                    value={editStageId}
                    onChange={(e) => {
                      setEditStageId(e.target.value);
                    }}
                    className={SELECT_CLASSES + " text-[13px]"}
                  >
                    <option value="">No stage</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Context, tensions, questions..."
                  className={TEXTAREA_CLASSES + " text-[13px]"}
                  rows={2}
                />
              </div>

              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 text-[12px] font-semibold flex items-center gap-1"
              >
                <Trash size={12} weight="bold" />
                Delete Activity
              </button>
            </div>
          </div>

          {/* Change Tracker */}
          <ActivityChangeTracker
            activity={activity}
            editName={editName}
            editNotes={editNotes}
            editCategoryId={editCategoryId}
            editStageId={editStageId}
            assignedRoleIds={assignedRoleIds}
            onCommitChanges={handleCommitChanges}
            onDiscardChanges={handleDiscardChanges}
          />
        </div>
      )}
    </div>
  );
}
