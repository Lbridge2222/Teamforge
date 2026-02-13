"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, Badge } from "@/components/shared/Badge";
import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import type { OwnershipOverlap } from "@/lib/analysis";

type Props = { overlaps: OwnershipOverlap[] };

export function OwnershipOverlaps({ overlaps }: Props) {
  return (
    <div>
      <SectionHeader
        title="Ownership Overlaps"
        subtitle="Items claimed by multiple roles"
      />
      {overlaps.length === 0 ? (
        <div className={`${CARD_CLASSES} p-6 text-center`}>
          <CheckCircle size={28} weight="bold" className="text-emerald-500 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-emerald-700">No ownership overlaps detected</p>
        </div>
      ) : (
        <div className={`${CARD_CLASSES} overflow-hidden`}>
          <div className="bg-amber-50 border-b border-amber-300 px-4 py-2">
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
              <Warning size={14} weight="bold" />
              {overlaps.length} overlap{overlaps.length > 1 ? "s" : ""} found
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {overlaps.map((o, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <span className="font-medium text-sm text-gray-800 flex-1">
                  "{o.item}"
                </span>
                <div className="flex gap-1.5">
                  {o.owners.map((owner) => (
                    <Badge key={owner} variant="warning">{owner}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
