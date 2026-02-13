"use client";

import { useMemo } from "react";
import { TIER_COLORS, GROWTH_TRACK_STYLES, ROLE_COLORS, AUTONOMY_LEVELS } from "@/lib/design-system";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { 
  ArrowUp, 
  ArrowsLeftRight, 
  Lightning, 
  Star 
} from "@phosphor-icons/react/dist/ssr";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import type { TeamRole, RoleProgression, Tier } from "@/lib/types";

const TIER_ORDER: Tier[] = ["director", "head", "lead", "senior", "mid", "entry"];

const TRACK_ICONS: Record<string, any> = {
  steep: Lightning,
  steady: Star,
  either: ArrowsLeftRight,
};



type CareerLadderProps = {
  rolesWithProgressions: { role: TeamRole; progression: RoleProgression }[];
};

export function CareerLadder({ rolesWithProgressions }: CareerLadderProps) {
  // Group by tier
  const tiers = useMemo(() => {
    const groups = new Map<string, { role: TeamRole; progression: RoleProgression }[]>();
    for (const rp of rolesWithProgressions) {
      const tier = (rp.progression.tier as string) ?? "entry";
      if (!groups.has(tier)) groups.set(tier, []);
      groups.get(tier)!.push(rp);
    }
    return TIER_ORDER.map((tier) => ({
      tier,
      label: TIER_COLORS[tier]?.label ?? tier,
      bg: TIER_COLORS[tier]?.bg ?? "bg-gray-100",
      text: TIER_COLORS[tier]?.text ?? "text-gray-800",
      roles: groups.get(tier) ?? [],
    }));
  }, [rolesWithProgressions]);

  if (rolesWithProgressions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {tiers.map((tier, idx) => (
        <div
          key={tier.tier}
          className={`flex items-stretch ${
            idx > 0 ? "border-t border-gray-200" : ""
          }`}
        >
          {/* Tier label */}
          <div
            className={`w-28 shrink-0 flex items-center justify-center ${tier.bg} ${tier.text} font-semibold text-[11px] uppercase tracking-wider border-r border-gray-200 p-3`}
          >
            {tier.label}
          </div>

          {/* Role cards */}
          <div className="flex-1 p-3 flex flex-wrap gap-3">
            {tier.roles.length === 0 ? (
              <span className="text-xs text-gray-300 italic self-center">
                No roles at this tier
              </span>
            ) : (
              tier.roles.map(({ role, progression }) => {
                const growthStyle =
                  GROWTH_TRACK_STYLES[
                    (progression.growthTrack as string) ?? "either"
                  ];
                const belbinP = role.belbinPrimary
                  ? BELBIN_ROLES[role.belbinPrimary]
                  : null;
                const belbinS = role.belbinSecondary
                  ? BELBIN_ROLES[role.belbinSecondary]
                  : null;
                const autonomyIdx = AUTONOMY_LEVELS.indexOf(
                  (progression.autonomy as any) ?? "low"
                );
                const progressesTo = (progression.progressesTo as string[]) ?? [];
                const lateralMoves = (progression.lateralMoves as string[]) ?? [];

                return (
                  <div
                    key={role.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 min-w-[200px] max-w-[260px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ColorDot
                        colorIndex={role.colorIndex ?? 0}
                        size="sm"
                      />
                      <span className="font-semibold text-[13px] text-gray-800 truncate">
                        {role.jobTitle}
                      </span>
                      {progression.band && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 font-medium">
                          {progression.band}
                        </span>
                      )}
                    </div>

                    {/* Growth track */}
                    {growthStyle && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${growthStyle.bg} ${growthStyle.text}`}
                      >
                        {(() => {
                          const Icon = TRACK_ICONS[(progression.growthTrack as string) ?? "either"] ?? ArrowsLeftRight;
                          return <Icon weight="bold" className="shrink-0" />;
                        })()}
                        {growthStyle.label}
                      </span>
                    )}

                    {/* Autonomy bar */}
                    <div className="flex gap-0.5 mt-2">
                      {AUTONOMY_LEVELS.map((level, i) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= autonomyIdx
                              ? "bg-blue-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Belbin badges */}
                    <div className="flex gap-1 mt-2">
                      {role.belbinPrimary && BELBIN_ROLES[role.belbinPrimary] && (
                        <span className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                          <BelbinIcon
                            roleKey={role.belbinPrimary}
                            className="w-3 h-3 text-gray-500"
                            weight="fill"
                          />
                          {BELBIN_ROLES[role.belbinPrimary].label}
                        </span>
                      )}
                      {role.belbinSecondary && BELBIN_ROLES[role.belbinSecondary] && (
                        <span className="text-[10px] bg-gray-50 text-gray-400 rounded px-1.5 py-0.5 inline-flex items-center">
                          <BelbinIcon
                            roleKey={role.belbinSecondary}
                            className="w-3 h-3 text-gray-400"
                            weight="fill"
                          />
                        </span>
                      )}
                    </div>

                    {/* Progresses to / lateral moves */}
                    {(progressesTo.length > 0 || lateralMoves.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                        {progressesTo.length > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-600">
                            <ArrowUp size={10} weight="bold" />
                            {progressesTo.length} promotion
                            {progressesTo.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {lateralMoves.length > 0 && (
                          <span className="flex items-center gap-0.5 text-blue-600">
                            <ArrowsLeftRight size={10} weight="bold" />
                            {lateralMoves.length} lateral
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
