"use client";

import { CARD_CLASSES } from "@/lib/design-system";
import { SectionHeader, Badge, ColorDot } from "@/components/shared/Badge";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { WarningCircle } from "@phosphor-icons/react";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import type { BelbinMismatch } from "@/lib/analysis";

type Props = { mismatches: BelbinMismatch[] };

export function BelbinMismatches({ mismatches }: Props) {
  return (
    <div>
      <SectionHeader
        title="Belbin Mismatches"
        subtitle="Roles assigned to activities outside their natural fit"
      />

      {mismatches.length === 0 ? (
        <div
          className={`${CARD_CLASSES} p-6 text-center text-sm text-emerald-600 bg-emerald-50`}
        >
          ✅ No Belbin mismatches detected — all role-to-activity pairings align.
        </div>
      ) : (
        <>
          <div className={`${CARD_CLASSES} overflow-hidden`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Role
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Activity Category
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Their Belbin
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Ideal Belbin
                  </th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map((m, i) => {
                  const roleBelbin = [
                    m.role.belbinPrimary,
                    m.role.belbinSecondary,
                  ].filter(Boolean) as string[];

                  return (
                    <tr
                      key={`${m.role.id}-${m.category}`}
                      className={i > 0 ? "border-t border-gray-100" : ""}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <ColorDot
                            colorIndex={m.role.colorIndex ?? 0}
                            size="sm"
                          />
                          <span className="font-medium text-gray-800">
                            {m.role.jobTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {m.category}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {roleBelbin.map((key) => {
                            const b = BELBIN_ROLES[key];
                            return b ? (
                              <Badge key={key} variant="default" className="flex items-center gap-1">
                                <BelbinIcon roleKey={key} className="w-3.5 h-3.5" />
                                {b.label}
                              </Badge>
                            ) : null;
                          })}
                          {roleBelbin.length === 0 && (
                            <span className="text-xs text-gray-400 italic">
                              None set
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.idealTypes.map((key) => {
                            const b = BELBIN_ROLES[key];
                            return b ? (
                              <Badge key={key} variant="warning" className="flex items-center gap-1">
                                <BelbinIcon roleKey={key} className="w-3.5 h-3.5" />
                                {b.label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Caveat */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <WarningCircle weight="bold" className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> Belbin fit is a useful heuristic, not a rule.
              Context, experience, and personal development goals may override
              natural fit. Use mismatches as coaching conversation starters, not
              as re-assignment directives.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
