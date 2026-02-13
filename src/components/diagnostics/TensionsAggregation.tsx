"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, Badge } from "@/components/shared/Badge";
import { Warning } from "@phosphor-icons/react/dist/ssr";

export function TensionsAggregation() {
  const handoffs = useWorkspaceStore((s) => s.handoffs);
  const stages = useWorkspaceStore((s) => s.stages);

  const allTensions = useMemo(() => {
    const results: { text: string; from: string; to: string }[] = [];
    for (const h of handoffs) {
      const tensions = (h.tensions as string[]) ?? [];
      const fromStage = stages.find((s) => s.id === h.fromStageId);
      const toStage = stages.find((s) => s.id === h.toStageId);
      for (const t of tensions) {
        results.push({
          text: t,
          from: fromStage?.name ?? "Unknown",
          to: toStage?.name ?? "Unknown",
        });
      }
    }
    return results;
  }, [handoffs, stages]);

  return (
    <div>
      <SectionHeader
        title="Tensions Aggregation"
        subtitle="All known friction points across handoffs"
      />
      {allTensions.length === 0 ? (
        <div className={`${CARD_CLASSES} p-6 text-center text-sm text-gray-400`}>
          No tensions recorded across any handoff zones.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allTensions.map((t, i) => (
            <div key={i} className={`${CARD_CLASSES} p-4`}>
              <div className="flex items-start gap-2">
                <Warning size={16} weight="bold" className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-gray-800">{t.text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t.from} → {t.to}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
