"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, Badge } from "@/components/shared/Badge";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import type { BelbinCompositionCategory } from "@/lib/analysis";

type Props = { composition: BelbinCompositionCategory[] };

const CATEGORY_STYLES: Record<string, { border: string; bg: string; headerBg: string }> = {
  Action: { border: "border-red-300", bg: "bg-red-50/30", headerBg: "bg-red-100 text-red-800" },
  People: { border: "border-amber-300", bg: "bg-amber-50/30", headerBg: "bg-amber-100 text-amber-800" },
  Thinking: { border: "border-violet-300", bg: "bg-violet-50/30", headerBg: "bg-violet-100 text-violet-800" },
};

export function BelbinComposition({ composition }: Props) {
  const anyUncovered = composition.some((c) => c.uncoveredRoles.length > 0);

  return (
    <div>
      <SectionHeader
        title="Belbin Team Composition"
        subtitle="Coverage across all 9 team role types"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {composition.map((cat) => {
          const style = CATEGORY_STYLES[cat.category] ?? CATEGORY_STYLES.Action;
          return (
            <div
              key={cat.category}
              className={`${CARD_CLASSES} overflow-hidden`}
            >
              <div className={`px-4 py-2 font-semibold text-[12px] ${style.headerBg}`}>
                {cat.category}-Oriented
              </div>
              <div className="p-4 space-y-2">
                {cat.roles.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <BelbinIcon roleKey={r.key} className="w-4 h-4 text-gray-400" />
                      <span className="text-[13px] text-gray-700 font-medium">
                        {r.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {r.primaryCount > 0 && (
                        <Badge variant="info">{r.primaryCount}P</Badge>
                      )}
                      {r.secondaryCount > 0 && (
                        <Badge variant="neutral">{r.secondaryCount}S</Badge>
                      )}
                      {!r.hasCoverage && (
                        <Badge variant="danger">GAP</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {anyUncovered && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <Warning size={16} weight="bold" className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">
              Missing Belbin coverage
            </p>
            <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
              {composition
                .flatMap((c) => c.uncoveredRoles)
                .join(", ")}{" "}
              — no team member covers these Belbin types. Consider this when
              hiring or reassigning roles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
