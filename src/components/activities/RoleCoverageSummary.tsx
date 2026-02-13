"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES } from "@/lib/design-system";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { SectionHeader } from "@/components/shared/Badge";
import { ChartBar } from "@phosphor-icons/react/dist/ssr";

export function RoleCoverageSummary() {
  const roles = useWorkspaceStore((s) => s.roles);
  const categories = useWorkspaceStore((s) => s.categories);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);

  const roleStats = useMemo(() => {
    return roles.map((role) => {
      const assignedActivityIds = activityAssignments
        .filter((aa) => aa.roleId === role.id)
        .map((aa) => aa.activityId);

      const total = assignedActivityIds.length;

      // Shared count: activities where more than 1 role is assigned
      const shared = assignedActivityIds.filter((actId) => {
        const count = activityAssignments.filter(
          (aa) => aa.activityId === actId
        ).length;
        return count >= 2;
      }).length;

      // Categories this role is active in
      const catIds = new Set(
        assignedActivityIds
          .map((actId) => activities.find((a) => a.id === actId)?.categoryId)
          .filter(Boolean) as string[]
      );

      const categoryNames = [...catIds]
        .map((cid) => categories.find((c) => c.id === cid)?.name)
        .filter(Boolean) as string[];

      return { role, total, shared, categoryNames };
    });
  }, [roles, activities, activityAssignments, categories]);

  if (roles.length === 0) return null;

  return (
    <div>
      <SectionHeader
        title="Role Coverage"
        subtitle="Activities per role across all categories"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roleStats.map(({ role, total, shared, categoryNames }) => (
          <div
            key={role.id}
            className={`${CARD_CLASSES} p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ColorDot colorIndex={role.colorIndex ?? 0} size="md" />
              <span className="font-semibold text-[13px] text-gray-800 truncate">
                {role.jobTitle}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-semibold text-gray-900 tabular-nums">
                {total}
              </span>
              <span className="text-[12px] text-gray-400">
                activit{total === 1 ? "y" : "ies"}
              </span>
              {shared > 0 && (
                <span className="text-[12px] text-amber-600 font-medium">
                  ({shared} shared)
                </span>
              )}
            </div>

            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categoryNames.map((name) => (
                  <Badge key={name} variant="neutral">
                    {name}
                  </Badge>
                ))}
              </div>
            )}

            {total === 0 && (
              <p className="text-xs text-gray-400 italic">
                No activities assigned
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
