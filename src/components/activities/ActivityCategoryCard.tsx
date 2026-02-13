"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES, BUTTON, INPUT_CLASSES } from "@/lib/design-system";
import { Collapsible } from "@/components/shared/Collapsible";
import { Badge } from "@/components/shared/Badge";
import { ActivityRow } from "./ActivityRow";
import {
  PencilSimple,
  Trash,
  Check,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { ActivityCategory, Activity } from "@/lib/types";

type ActivityCategoryCardProps = {
  category: ActivityCategory;
  activities: Activity[];
  expandedActivityId: string | null;
  onToggleExpand: (id: string) => void;
};

export function ActivityCategoryCard({
  category,
  activities,
  expandedActivityId,
  onToggleExpand,
}: ActivityCategoryCardProps) {
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const updateCategory = useWorkspaceStore((s) => s.updateCategory);
  const removeCategory = useWorkspaceStore((s) => s.removeCategory);
  const allActivities = useWorkspaceStore((s) => s.activities);

  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(category.name);

  // Stats for this category (use all activities, not just filtered)
  const allCatActivities = allActivities.filter(
    (a) => a.categoryId === category.id
  );
  const unownedCount = allCatActivities.filter(
    (a) =>
      activityAssignments.filter((aa) => aa.activityId === a.id).length === 0
  ).length;
  const sharedCount = allCatActivities.filter(
    (a) =>
      activityAssignments.filter((aa) => aa.activityId === a.id).length >= 2
  ).length;

  function handleRename() {
    if (!renameName.trim()) return;
    updateCategory(category.id, { name: renameName.trim() });
    setRenaming(false);

    fetch(`/api/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
  }

  function handleDelete() {
    if (allCatActivities.length > 0) return;
    if (!confirm("Delete this category?")) return;
    removeCategory(category.id);

    fetch(`/api/categories/${category.id}`, { method: "DELETE" });
  }

  return (
    <div className={CARD_CLASSES + " overflow-hidden"}>
      <Collapsible
        align="left"
        title={
          renaming ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className={INPUT_CLASSES + " !text-sm !py-1 !w-48"}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
                className="text-emerald-600 hover:text-emerald-700 p-1"
              >
                <Check size={14} weight="bold" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 group/title">
              <span className="font-semibold text-[14px] text-gray-900 truncate">
                {category.name}
              </span>
              <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full">
                {allCatActivities.length}
              </span>
              {unownedCount > 0 && (
                <Badge variant="danger" className="!px-1.5">{unownedCount}</Badge>
              )}
              {sharedCount > 0 && (
                <Badge variant="warning" className="!px-1.5">{sharedCount}</Badge>
              )}
              
              {/* Actions - bundled with title to stay centered */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameName(category.name);
                    setRenaming(true);
                  }}
                  className="text-gray-400 hover:text-emerald-600 p-1 rounded hover:bg-gray-100"
                  title="Rename category"
                >
                  <PencilSimple size={14} weight="bold" />
                </button>
                {allCatActivities.length === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100"
                    title="Delete category"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          )
        }
        // No headerRight needed since we moved actions to title
        headerRight={null}
        defaultOpen
      >
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-gray-400 italic">
              No activities match the current filter.
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                category={category}
                isExpanded={expandedActivityId === activity.id}
                onToggle={() => onToggleExpand(activity.id)}
              />
            ))
          )}
        </div>
      </Collapsible>
    </div>
  );
}
