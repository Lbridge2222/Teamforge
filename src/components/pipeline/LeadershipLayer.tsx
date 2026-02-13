"use client";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { RoleChip } from "./RoleChip";
import { Crown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { TeamRole, Stage } from "@/lib/types";

type LeadershipLayerProps = {
  onSelectRole: (id: string) => void;
  onEditRole: (id: string) => void;
};

export function LeadershipLayer({
  onSelectRole,
  onEditRole,
}: LeadershipLayerProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);

  const leadershipRoles = roles.filter(
    (r) =>
      r.overseesStageIds &&
      Array.isArray(r.overseesStageIds) &&
      (r.overseesStageIds as string[]).length > 0
  );

  if (leadershipRoles.length === 0) return null;

  const stageMap = new Map(stages.map((s) => [s.id, s]));

  const sorted = [...leadershipRoles].sort((a, b) => {
    const aIds = (a.overseesStageIds as string[]) ?? [];
    const bIds = (b.overseesStageIds as string[]) ?? [];
    const aFirst = aIds.length > 0 ? (stageMap.get(aIds[0])?.sortOrder ?? 999) : 999;
    const bFirst = bIds.length > 0 ? (stageMap.get(bIds[0])?.sortOrder ?? 999) : 999;
    return aFirst - bFirst;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Crown size={14} weight="fill" className="text-amber-500" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Leadership & Oversight
        </h3>
        <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-semibold tabular-nums">
          {leadershipRoles.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        {sorted.map((role) => {
          const oversees = (role.overseesStageIds as string[]) ?? [];
          const overseeStages = oversees
            .map((id) => stageMap.get(id))
            .filter(Boolean) as Stage[];

          return (
            <div key={role.id} className="flex flex-col items-center gap-1">
              <RoleChip
                role={role}
                onClick={() => onSelectRole(role.id)}
                onEdit={() => onEditRole(role.id)}
              />

              {overseeStages.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-gray-400">
                    oversees
                  </span>
                  {overseeStages.map((stage, i) => (
                    <span key={stage.id} className="flex items-center gap-0.5">
                      <span className="text-[10px] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 font-medium text-gray-500">
                        {stage.name}
                      </span>
                      {i < overseeStages.length - 1 && (
                        <ArrowRight size={10} weight="bold" className="text-gray-300" />
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
