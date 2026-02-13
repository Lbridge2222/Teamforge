"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, ColorDot, Badge } from "@/components/shared/Badge";
import { XCircle } from "@phosphor-icons/react/dist/ssr";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { BoundaryCrossRef } from "@/lib/analysis";

type Props = { boundaries: BoundaryCrossRef[] };

export function BoundaryMap({ boundaries }: Props) {
  const roles = useWorkspaceStore((s) => s.roles);

  // Group by excludedBy role
  const grouped = new Map<string, BoundaryCrossRef[]>();
  for (const b of boundaries) {
    if (!grouped.has(b.excludedBy)) grouped.set(b.excludedBy, []);
    grouped.get(b.excludedBy)!.push(b);
  }

  return (
    <div>
      <SectionHeader
        title="Boundary Map"
        subtitle='Explicit "does not own" declarations per role'
      />
      {boundaries.length === 0 ? (
        <div className={`${CARD_CLASSES} p-6 text-center text-sm text-gray-400`}>
          No boundary declarations found. Add "Does Not Own" items to roles.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...grouped.entries()].map(([roleName, items]) => {
            const role = roles.find((r) => r.jobTitle === roleName);
            return (
              <div key={roleName} className={`${CARD_CLASSES} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  {role && (
                    <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                  )}
                  <span className="font-semibold text-[13px] text-gray-800">
                    {roleName}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs"
                    >
                      <XCircle
                        size={14}
                        weight="bold"
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                      <div>
                        <span className="text-gray-700 font-medium">
                          {item.item}
                        </span>
                        {item.ownedBy ? (
                          <span className="text-gray-400 ml-1">
                            → owned by {item.ownedBy}
                          </span>
                        ) : (
                          <Badge variant="danger" className="ml-1.5">
                            Potential gap
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
