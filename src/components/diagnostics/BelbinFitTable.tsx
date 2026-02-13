"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, ColorDot, Badge } from "@/components/shared/Badge";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import type { BelbinActivityFit } from "@/lib/analysis";

type Props = { fits: BelbinActivityFit[] };

export function BelbinFitTable({ fits }: Props) {
  if (fits.length === 0) {
    return (
      <div>
        <SectionHeader
          title="Belbin Activity Fit"
          subtitle="Which roles best suit each activity category"
        />
        <div className={`${CARD_CLASSES} p-6 text-center text-sm text-gray-400`}>
          No categories have Belbin fit configured. Add belbin_ideal to activity
          categories.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Belbin Activity Fit"
        subtitle="Which roles best suit each activity category"
      />
      <div className={`${CARD_CLASSES} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Activity Category
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Ideal Belbin Types
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Best Fit People
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Why
              </th>
            </tr>
          </thead>
          <tbody>
            {fits.map((fit, i) => (
              <tr
                key={fit.category}
                className={i > 0 ? "border-t border-gray-100" : ""}
              >
                <td className="py-3 px-4 font-medium text-gray-800">
                  {fit.category}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {fit.idealTypes.map((key) => {
                      const b = BELBIN_ROLES[key];
                      return b ? (
                        <Badge key={key} variant="default" className="flex items-center gap-1">
                          <BelbinIcon roleKey={key} className="w-3.5 h-3.5" />
                          {b.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {fit.bestFitRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fit.bestFitRoles.map((r) => (
                        <div key={r.id} className="flex items-center gap-1">
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
                  ) : (
                    <Badge variant="danger">No fit</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-gray-500 max-w-[200px]">
                  {fit.reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
