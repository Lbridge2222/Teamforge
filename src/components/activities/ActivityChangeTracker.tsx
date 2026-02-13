"use client";

import { useMemo } from "react";
import { Badge, ColorDot } from "@/components/shared/Badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";
import type { Activity } from "@/lib/types";

type ChangeSnapshot = {
  name: string;
  categoryId: string | null;
  stageId: string | null;
  notes: string | null;
  roleIds: string[];
};

type ActivityChangeTrackerProps = {
  activity: Activity;
  editName: string;
  editNotes: string;
  editCategoryId: string;
  editStageId: string;
  assignedRoleIds: string[];
  onCommitChanges: () => void;
  onDiscardChanges: () => void;
};

export function ActivityChangeTracker({
  activity,
  editName,
  editNotes,
  editCategoryId,
  editStageId,
  assignedRoleIds,
  onCommitChanges,
  onDiscardChanges,
}: ActivityChangeTrackerProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);
  const categories = useWorkspaceStore((s) => s.categories);

  // Parse the pre-change snapshot
  const snapshot = useMemo<ChangeSnapshot | null>(() => {
    if (!activity.preChangeSnapshot) return null;
    return activity.preChangeSnapshot as ChangeSnapshot;
  }, [activity.preChangeSnapshot]);

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    if (!snapshot) return false;
    return (
      editName !== snapshot.name ||
      editNotes !== (snapshot.notes ?? "") ||
      editCategoryId !== (snapshot.categoryId ?? "") ||
      editStageId !== (snapshot.stageId ?? "") ||
      JSON.stringify(assignedRoleIds.sort()) !== JSON.stringify(snapshot.roleIds.sort())
    );
  }, [snapshot, editName, editNotes, editCategoryId, editStageId, assignedRoleIds]);

  if (!snapshot || !hasChanges) return null;

  const preCategory = categories.find((c) => c.id === snapshot.categoryId);
  const preStage = stages.find((s) => s.id === snapshot.stageId);
  const preRoles = snapshot.roleIds
    .map((rid) => roles.find((r) => r.id === rid))
    .filter(Boolean);

  const currentCategory = categories.find((c) => c.id === editCategoryId);
  const currentStage = stages.find((s) => s.id === editStageId);
  const currentRoles = assignedRoleIds
    .map((rid) => roles.find((r) => r.id === rid))
    .filter(Boolean);

  return (
    <div className="mt-4 border-t-2 border-blue-200 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Change Tracking
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onDiscardChanges}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Discard Changes
          </button>
          <button
            onClick={onCommitChanges}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-1"
          >
            <Check size={14} weight="bold" />
            Commit Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pre-Change Section */}
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
          <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
            📋 Pre-Change
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-gray-400 font-semibold mb-0.5">Name</div>
              <div className="text-gray-700">{snapshot.name}</div>
            </div>
            {preCategory && (
              <div>
                <div className="text-gray-400 font-semibold mb-0.5">Category</div>
                <Badge variant="default" className="text-xs">
                  {preCategory.name}
                </Badge>
              </div>
            )}
            {preStage && (
              <div>
                <div className="text-gray-400 font-semibold mb-0.5">Stage</div>
                <Badge variant="neutral" className="text-xs">
                  {preStage.name}
                </Badge>
              </div>
            )}
            {snapshot.notes && (
              <div>
                <div className="text-gray-400 font-semibold mb-0.5">Notes</div>
                <div className="text-gray-600 text-xs line-clamp-2">
                  {snapshot.notes}
                </div>
              </div>
            )}
            {preRoles.length > 0 && (
              <div>
                <div className="text-gray-400 font-semibold mb-1">Roles ({preRoles.length})</div>
                <div className="flex flex-wrap gap-1">
                  {preRoles.map((role) => (
                    role && (
                      <div
                        key={role.id}
                        className="flex items-center gap-1 text-xs text-gray-600"
                      >
                        <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                        <span className="truncate max-w-[100px]">{role.jobTitle}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arrow & Changes */}
        <div className="flex flex-col items-center justify-center text-center py-4">
          <ArrowRight size={24} weight="bold" className="text-blue-500 mb-2" />
          <div className="text-xs font-semibold text-blue-600">
            {getChangeSummary(snapshot, {
              name: editName,
              categoryId: editCategoryId,
              stageId: editStageId,
              notes: editNotes,
              roleIds: assignedRoleIds,
            })}
          </div>
        </div>

        {/* Proposed Changes / Final Copy */}
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-3">
          <div className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
            ✨ Proposed Changes
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-blue-600 font-semibold mb-0.5">Name</div>
              <div className="text-blue-900 font-medium">{editName}</div>
            </div>
            {currentCategory && (
              <div>
                <div className="text-blue-600 font-semibold mb-0.5">Category</div>
                <Badge variant="default" className="text-xs">
                  {currentCategory.name}
                </Badge>
              </div>
            )}
            {currentStage && (
              <div>
                <div className="text-blue-600 font-semibold mb-0.5">Stage</div>
                <Badge variant="neutral" className="text-xs">
                  {currentStage.name}
                </Badge>
              </div>
            )}
            {editNotes && (
              <div>
                <div className="text-blue-600 font-semibold mb-0.5">Notes</div>
                <div className="text-blue-800 text-xs line-clamp-2">
                  {editNotes}
                </div>
              </div>
            )}
            {currentRoles.length > 0 && (
              <div>
                <div className="text-blue-600 font-semibold mb-1">Roles ({currentRoles.length})</div>
                <div className="flex flex-wrap gap-1">
                  {currentRoles.map((role) => (
                    role && (
                      <div
                        key={role.id}
                        className="flex items-center gap-1 text-xs text-blue-800"
                      >
                        <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                        <span className="truncate max-w-[100px]">{role.jobTitle}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to generate a change summary
function getChangeSummary(
  snapshot: ChangeSnapshot,
  current: ChangeSnapshot
): string {
  const changes: string[] = [];

  if (snapshot.name !== current.name) changes.push("name");
  if (snapshot.categoryId !== current.categoryId) changes.push("category");
  if (snapshot.stageId !== current.stageId) changes.push("stage");
  if (snapshot.notes !== current.notes) changes.push("notes");
  if (
    JSON.stringify(snapshot.roleIds.sort()) !==
    JSON.stringify(current.roleIds.sort())
  ) {
    changes.push("roles");
  }

  if (changes.length === 0) return "No changes";
  if (changes.length === 1) return `Changed ${changes[0]}`;
  if (changes.length === 2) return `Changed ${changes.join(" & ")}`;
  return `${changes.length} changes made`;
}
