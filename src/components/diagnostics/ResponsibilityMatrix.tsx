"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, ColorDot, Badge } from "@/components/shared/Badge";
import { Check, Eye, Minus } from "@phosphor-icons/react/dist/ssr";

export function ResponsibilityMatrix() {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);
  const stageAssignments = useWorkspaceStore((s) => s.stageAssignments);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [stages]
  );

  // Separate operational from oversight roles
  const operationalRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          !r.overseesStageIds ||
          !Array.isArray(r.overseesStageIds) ||
          (r.overseesStageIds as string[]).length === 0
      ),
    [roles]
  );

  const oversightRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.overseesStageIds &&
          Array.isArray(r.overseesStageIds) &&
          (r.overseesStageIds as string[]).length > 0
      ),
    [roles]
  );

  return (
    <div>
      <SectionHeader
        title="Responsibility Matrix"
        subtitle="Which roles operate in which stages"
      />
      <div className={`${CARD_CLASSES} overflow-x-auto`}>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sticky left-0 bg-gray-50 z-10">
                Role
              </th>
              {sortedStages.map((s) => (
                <th
                  key={s.id}
                  className="text-center py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Operational roles */}
            {operationalRoles.map((role, idx) => (
              <tr
                key={role.id}
                className={idx > 0 ? "border-t border-gray-100" : ""}
              >
                <td className="py-2.5 px-4 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                    <span className="font-medium text-gray-700 text-xs truncate max-w-[120px]">
                      {role.jobTitle}
                    </span>
                  </div>
                </td>
                {sortedStages.map((stage) => {
                  const isAssigned = stageAssignments.some(
                    (sa) =>
                      sa.stageId === stage.id && sa.roleId === role.id
                  );
                  return (
                    <td key={stage.id} className="py-2.5 px-3 text-center">
                      {isAssigned ? (
                        <Check
                          size={16}
                          weight="bold"
                          className="text-emerald-500 mx-auto"
                        />
                      ) : (
                        <Minus
                          size={12}
                          weight="bold"
                          className="text-gray-200 mx-auto"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Oversight separator */}
            {oversightRoles.length > 0 && (
              <tr className="border-t border-gray-300">
                <td
                  colSpan={sortedStages.length + 1}
                  className="py-1.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50"
                >
                  Oversight
                </td>
              </tr>
            )}

            {/* Oversight roles */}
            {oversightRoles.map((role, idx) => {
              const overseesIds = (role.overseesStageIds as string[]) ?? [];
              return (
                <tr
                  key={role.id}
                  className={
                    idx > 0 ? "border-t border-gray-100" : ""
                  }
                >
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <ColorDot
                        colorIndex={role.colorIndex ?? 0}
                        size="sm"
                      />
                      <span className="font-medium text-gray-700 text-xs truncate max-w-[120px]">
                        {role.jobTitle}
                      </span>
                    </div>
                  </td>
                  {sortedStages.map((stage) => {
                    const oversees = overseesIds.includes(stage.id);
                    return (
                      <td
                        key={stage.id}
                        className="py-2.5 px-3 text-center"
                      >
                        {oversees ? (
                          <Eye
                            size={16}
                            weight="bold"
                            className="text-blue-500 mx-auto"
                          />
                        ) : (
                          <Minus
                            size={12}
                            weight="bold"
                            className="text-gray-200 mx-auto"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
