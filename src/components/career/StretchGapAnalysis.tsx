"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES } from "@/lib/design-system";
import { ColorDot, Badge, SectionHeader } from "@/components/shared/Badge";
import { CheckCircle, Lightning } from "@phosphor-icons/react/dist/ssr";
import type { TeamRole, RoleProgression } from "@/lib/types";

type StretchGapAnalysisProps = {
  rolesWithProgressions: { role: TeamRole; progression: RoleProgression }[];
};

export function StretchGapAnalysis({
  rolesWithProgressions,
}: StretchGapAnalysisProps) {
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);

  const gaps = useMemo(() => {
    const result: {
      role: TeamRole;
      activityName: string;
      activityId: string;
    }[] = [];

    for (const { role, progression } of rolesWithProgressions) {
      const growthActivityIds =
        (progression.growthActivityIds as string[]) ?? [];
      for (const actId of growthActivityIds) {
        const isAssigned = activityAssignments.some(
          (aa) => aa.activityId === actId && aa.roleId === role.id
        );
        if (!isAssigned) {
          const act = activities.find((a) => a.id === actId);
          result.push({
            role,
            activityName: act?.name ?? "Unknown activity",
            activityId: actId,
          });
        }
      }
    }
    return result;
  }, [rolesWithProgressions, activities, activityAssignments]);

  return (
    <div>
      <SectionHeader
        title="Stretch Activity Gap Analysis"
        subtitle="Growth activities tagged but not yet assigned"
      />

      {gaps.length === 0 ? (
        <div className={`${CARD_CLASSES} p-6 text-center`}>
          <CheckCircle
            size={32}
            weight="bold"
            className="text-emerald-500 mx-auto mb-2"
          />
          <p className="text-[13px] font-semibold text-emerald-700">
            All stretch activities are assigned!
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            Every growth opportunity has been linked to the relevant role.
          </p>
        </div>
      ) : (
        <div className={`${CARD_CLASSES} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Role
                </th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Activity
                </th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap, i) => (
                <tr
                  key={`${gap.role.id}-${gap.activityId}`}
                  className={
                    i > 0 ? "border-t border-gray-100" : ""
                  }
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <ColorDot
                        colorIndex={gap.role.colorIndex ?? 0}
                        size="sm"
                      />
                      <span className="font-medium text-gray-700">
                        {gap.role.jobTitle}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-gray-700">
                    {gap.activityName}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant="warning">
                      <Lightning size={10} weight="bold" />
                      GROWTH OPPORTUNITY
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
