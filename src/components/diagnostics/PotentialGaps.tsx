"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, Badge } from "@/components/shared/Badge";
import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import type { GapDetectionResult } from "@/lib/analysis";

type Props = { gaps: GapDetectionResult };

export function PotentialGaps({ gaps }: Props) {
  const totalGaps =
    gaps.emptyStages.length +
    gaps.missingSlas.length +
    gaps.unassignedActivities.length;

  return (
    <div>
      <SectionHeader
        title="Potential Gaps"
        subtitle="Stages, SLAs, and activities with missing coverage"
      />
      {totalGaps === 0 ? (
        <div className={`${CARD_CLASSES} p-6 text-center`}>
          <CheckCircle size={28} weight="bold" className="text-emerald-500 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-emerald-700">No gaps detected!</p>
        </div>
      ) : (
        <div className={`${CARD_CLASSES} overflow-hidden`}>
          <div className="bg-red-50 border-b border-red-300 px-4 py-2">
            <span className="text-[11px] font-semibold text-red-800 flex items-center gap-1.5">
              <Warning size={14} weight="bold" />
              {totalGaps} gap{totalGaps > 1 ? "s" : ""} found
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {gaps.emptyStages.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <Badge variant="danger">Empty Stage</Badge>
                <span className="text-sm text-gray-800 font-medium">
                  {s.name} — no roles assigned
                </span>
              </div>
            ))}
            {gaps.missingSlas.map((h) => (
              <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                <Badge variant="warning">Missing SLA</Badge>
                <span className="text-sm text-gray-800">
                  Handoff has no SLA defined
                </span>
              </div>
            ))}
            {gaps.unassignedActivities.slice(0, 10).map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <Badge variant="danger">Unowned</Badge>
                <span className="text-sm text-gray-800">{a.name}</span>
              </div>
            ))}
            {gaps.unassignedActivities.length > 10 && (
              <div className="px-4 py-3 text-xs text-gray-400">
                ...and {gaps.unassignedActivities.length - 10} more unowned activities
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
