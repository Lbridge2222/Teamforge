"use client";

import { useMemo } from "react";
import { Modal } from "@/components/shared/Modal";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { analyseRoleCoverage } from "@/lib/analysis";
import { ListBullets, Users, User } from "@phosphor-icons/react/dist/ssr";
import type { TeamRole } from "@/lib/types";

type RoleActivityModalProps = {
  role: TeamRole | null;
  open: boolean;
  onClose: () => void;
};

export function RoleActivityModal({
  role,
  open,
  onClose,
}: RoleActivityModalProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const categories = useWorkspaceStore((s) => s.categories);

  const coverage = useMemo(() => {
    if (!role) return null;
    const analysis = analyseRoleCoverage(
      [role],
      activities,
      activityAssignments,
      categories
    );
    return analysis[0];
  }, [role, activities, activityAssignments, categories]);

  // Group activities by category
  const activitiesByCategory = useMemo(() => {
    if (!role) return [];

    const assignedActivityIds = activityAssignments
      .filter((aa) => aa.roleId === role.id)
      .map((aa) => aa.activityId);

    const categoryMap = new Map<string, { categoryName: string; activities: Array<{ activity: any; isShared: boolean }> }>();

    assignedActivityIds.forEach((actId) => {
      const activity = activities.find((a) => a.id === actId);
      if (!activity) return;

      const category = categories.find((c) => c.id === activity.categoryId);
      const categoryName = category?.name ?? "Uncategorized";

      const assignmentCount = activityAssignments.filter(
        (aa) => aa.activityId === actId
      ).length;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { categoryName, activities: [] });
      }

      categoryMap.get(categoryName)!.activities.push({
        activity,
        isShared: assignmentCount > 1,
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    );
  }, [role, activities, activityAssignments, categories]);

  if (!role || !coverage) return null;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ColorDot colorIndex={role.colorIndex ?? 0} size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              Activity Coverage: {role.jobTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {coverage.totalActivities} total activities across {coverage.categories.length} categories
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {coverage.totalActivities}
            </div>
            <div className="text-xs text-gray-500 font-medium">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {coverage.soloOwned}
            </div>
            <div className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <User size={12} weight="bold" />
              Solo Owned
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {coverage.shared}
            </div>
            <div className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <Users size={12} weight="bold" />
              Shared
            </div>
          </div>
        </div>

        {/* Activities by Category */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activitiesByCategory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ListBullets size={32} weight="light" className="mx-auto mb-2" />
              <p className="text-sm">No activities assigned to this role</p>
            </div>
          ) : (
            activitiesByCategory.map(({ categoryName, activities: acts }) => (
              <div key={categoryName} className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <ListBullets size={14} weight="bold" />
                  {categoryName}
                  <Badge variant="neutral" className="ml-auto">
                    {acts.length}
                  </Badge>
                </h3>
                <div className="space-y-1 ml-6">
                  {acts.map(({ activity, isShared }) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50"
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isShared ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {activity.name}
                      </span>
                      {isShared && (
                        <Badge variant="warning" className="text-[10px]">
                          <Users size={10} weight="bold" />
                          Shared
                        </Badge>
                      )}
                      {activity.notes && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {activity.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
