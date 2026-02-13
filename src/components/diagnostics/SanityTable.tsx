"use client";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES } from "@/lib/design-system";
import { ColorDot, Badge, SectionHeader } from "@/components/shared/Badge";
import {
  CheckCircle,
  Warning,
  Database,
} from "@phosphor-icons/react/dist/ssr";

export function SanityTable() {
  const stages = useWorkspaceStore((s) => s.stages);
  const roles = useWorkspaceStore((s) => s.roles);
  const handoffs = useWorkspaceStore((s) => s.handoffs);
  const stageAssignments = useWorkspaceStore((s) => s.stageAssignments);

  const sortedStages = [...stages].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  return (
    <div>
      <SectionHeader
        title="Sanity Table"
        subtitle="Pipeline overview at a glance"
      />
      <div className={`${CARD_CLASSES} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Stage
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Operational Roles
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                System Object
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Handoff Out
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                SLA
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStages.map((stage, idx) => {
              const stageRoleIds = stageAssignments
                .filter((sa) => sa.stageId === stage.id)
                .map((sa) => sa.roleId);
              const stageRoles = roles.filter((r) =>
                stageRoleIds.includes(r.id)
              );
              const handoff = handoffs.find(
                (h) => h.fromStageId === stage.id
              );
              const nextStage = handoff
                ? stages.find((s) => s.id === handoff.toStageId)
                : null;

              // Get system objects from roles
              const systemObjects = stageRoles
                .filter((r) => r.systemOwnership)
                .map(
                  (r) =>
                    (r.systemOwnership as any)?.primaryObject ?? "Unknown"
                );

              return (
                <tr
                  key={stage.id}
                  className={`${
                    idx > 0 ? "border-t border-gray-100" : ""
                  } ${stageRoles.length === 0 ? "bg-red-50" : ""}`}
                >
                  <td className="py-2.5 px-4 font-semibold text-[13px] text-gray-800">
                    {idx + 1}. {stage.name}
                  </td>
                  <td className="py-3 px-4">
                    {stageRoles.length === 0 ? (
                      <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                        <Warning size={12} weight="bold" />
                        No roles assigned
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {stageRoles.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-1"
                          >
                            <ColorDot
                              colorIndex={r.colorIndex ?? 0}
                              size="sm"
                            />
                            <span className="text-xs text-gray-700">
                              {r.jobTitle}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {systemObjects.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <Database
                          size={12}
                          weight="bold"
                          className="text-gray-500"
                        />
                        <span className="text-xs text-gray-700">
                          {systemObjects.join(", ")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {nextStage ? (
                      <span className="text-xs text-gray-700">
                        → {nextStage.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {handoff ? (
                      handoff.sla ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle
                            size={12}
                            weight="bold"
                            className="text-emerald-500"
                          />
                          <span className="text-xs text-gray-700">
                            {handoff.sla}
                            {handoff.slaOwner && ` (${handoff.slaOwner})`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                          <Warning size={12} weight="bold" />
                          No SLA set
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
