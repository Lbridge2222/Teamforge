"use client";

import { useState } from "react";
import {
  ROLE_COLORS,
  TIER_COLORS,
  GROWTH_TRACK_STYLES,
  AUTONOMY_LEVELS,
} from "@/lib/design-system";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { ActivityDetailModal } from "@/components/activities/ActivityDetailModal";
import {
  Lightning,
  BatteryCharging,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowsLeftRight,
  Warning,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import type {
  TeamRole,
  RoleProgression,
  JobCharacteristics,
  DecisionRights,
  Tier,
} from "@/lib/types";

const TRACK_ICONS: Record<string, any> = {
  steep: Lightning,
  steady: Star,
  either: ArrowsLeftRight,
};



type ProgressionCardProps = {
  role: TeamRole;
  progression: RoleProgression;
};

export function ProgressionCard({ role, progression }: ProgressionCardProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const tierInfo = TIER_COLORS[(progression.tier as string) ?? "entry"];
  const growthStyle =
    GROWTH_TRACK_STYLES[(progression.growthTrack as string) ?? "either"];
  const belbinP = role.belbinPrimary ? BELBIN_ROLES[role.belbinPrimary] : null;
  const belbinS = role.belbinSecondary ? BELBIN_ROLES[role.belbinSecondary] : null;
  const color = ROLE_COLORS[role.colorIndex ?? 0];
  const jobChars = progression.jobCharacteristics as JobCharacteristics | null;
  const decisionRights = progression.decisionRights as DecisionRights | null;
  const energisedBy = (progression.energisedBy as string[]) ?? [];
  const drainedBy = (progression.drainedBy as string[]) ?? [];
  const readinessSignals = (progression.readinessSignals as string[]) ?? [];
  const developmentAreas = (progression.developmentAreas as string[]) ?? [];
  const progressesTo = (progression.progressesTo as string[]) ?? [];
  const lateralMoves = (progression.lateralMoves as string[]) ?? [];
  const growthActivityIds = (progression.growthActivityIds as string[]) ?? [];
  const autonomyIdx = AUTONOMY_LEVELS.indexOf(
    (progression.autonomy as any) ?? "low"
  );

  // Stretch activities
  const stretchActivities = growthActivityIds.map((actId) => {
    const act = activities.find((a) => a.id === actId);
    const isAssigned = activityAssignments.some(
      (aa) => aa.activityId === actId && aa.roleId === role.id
    );
    return { activity: act, isAssigned };
  });

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ backgroundColor: color.hex + "20" }}
      >
        <div
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-sm font-semibold bg-white"
        >
          {(tierInfo?.label ?? "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ColorDot colorIndex={role.colorIndex ?? 0} size="md" />
            <span className="text-base font-semibold text-gray-900 truncate">
              {role.jobTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {progression.band && (
              <Badge variant="default">{progression.band}</Badge>
            )}
            {belbinP && (
              <Badge variant="info" className="flex items-center gap-1">
                <BelbinIcon roleKey={belbinP.key} className="w-3.5 h-3.5" weight="fill" />
                {belbinP.label}
              </Badge>
            )}
            {belbinS && (
              <Badge variant="neutral" className="flex items-center gap-1">
                <BelbinIcon roleKey={belbinS.key} className="w-3.5 h-3.5" weight="fill" />
                {belbinS.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* 1. Growth Track */}
        {growthStyle && (
          <Section title="Growth Track (Radical Candor)">
            <div
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold ${growthStyle.bg} ${growthStyle.text}`}
            >
              {(() => {
                const Icon = TRACK_ICONS[(progression.growthTrack as string) ?? "either"] ?? ArrowsLeftRight;
                return <Icon size={16} weight="bold" className="shrink-0" />;
              })()}
              {growthStyle.label}
            </div>
            {progression.growthTrackNotes && (
              <p className="text-sm text-gray-600 mt-2">
                {progression.growthTrackNotes}
              </p>
            )}
          </Section>
        )}

        {/* 2. Autonomy · Mastery · Purpose (Drive) */}
        <Section title="Autonomy · Mastery · Purpose (Drive)">
          <div className="grid grid-cols-3 gap-3">
            <MiniCard title="Autonomy">
              <div className="flex gap-1 mt-1">
                {AUTONOMY_LEVELS.map((level, i) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full ${
                      i <= autonomyIdx ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 capitalize">
                {progression.autonomy ?? "low"}
              </span>
            </MiniCard>
            <MiniCard title="Mastery">
              <p className="text-xs text-gray-600 mt-1">
                {progression.mastery || "Not defined"}
              </p>
            </MiniCard>
            <MiniCard title="Purpose">
              <p className="text-xs text-gray-600 italic mt-1">
                {progression.purpose || "Not defined"}
              </p>
            </MiniCard>
          </div>
        </Section>

        {/* 3. Energy Profile (Working Genius) */}
        {(energisedBy.length > 0 || drainedBy.length > 0) && (
          <Section title="Energy Profile (Working Genius)">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-1.5 mb-2 text-emerald-700 font-semibold text-[12px]">
                  <Lightning size={14} weight="bold" />
                  Energised By
                </div>
                <ul className="space-y-1">
                  {energisedBy.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[12px] text-emerald-700"
                    >
                      <CheckCircle
                        size={12}
                        weight="bold"
                        className="mt-0.5 shrink-0"
                      />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-1.5 mb-2 text-red-700 font-semibold text-[12px]">
                  <BatteryCharging size={14} weight="bold" />
                  Drained By
                </div>
                <ul className="space-y-1">
                  {drainedBy.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[12px] text-red-700"
                    >
                      <XCircle
                        size={12}
                        weight="bold"
                        className="mt-0.5 shrink-0"
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        )}

        {/* 4. Readiness Signals */}
        {readinessSignals.length > 0 && (
          <Section title="Readiness Signals">
            <ul className="space-y-1">
              {readinessSignals.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-sm text-gray-700"
                >
                  <CheckCircle
                    size={14}
                    weight="bold"
                    className="text-emerald-500 mt-0.5 shrink-0"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 5. Decision Rights (RAPID) */}
        {decisionRights && (
          <Section title="Decision Rights (RAPID)">
            <div className="grid grid-cols-2 gap-2">
              <RapidBlock
                label="Decides"
                items={decisionRights.decides}
                color="bg-emerald-100 text-emerald-800 border-emerald-300"
              />
              <RapidBlock
                label="Recommends"
                items={decisionRights.recommends}
                color="bg-amber-100 text-amber-800 border-amber-300"
              />
              <RapidBlock
                label="Inputs To"
                items={decisionRights.inputsTo}
                color="bg-gray-100 text-gray-700 border-gray-300"
              />
              <RapidBlock
                label="Performs"
                items={decisionRights.performs}
                color="bg-white text-gray-600 border-gray-300"
              />
            </div>
          </Section>
        )}

        {/* 6. Job Characteristics (Hackman & Oldham) */}
        {jobChars && (
          <Section title="Job Characteristics (Hackman & Oldham)">
            <div className="space-y-2 text-sm">
              <JCRow label="Skill Variety" value={jobChars.skillVariety} />
              <JCRow label="Task Identity" value={jobChars.taskIdentity} />
              <JCRow
                label="Task Significance"
                value={jobChars.taskSignificance}
              />
              <JCRow label="Autonomy" value={jobChars.autonomyLevel} />
              <JCRow label="Feedback" value={jobChars.feedback} />
            </div>
          </Section>
        )}

        {/* 7. Development Areas */}
        {developmentAreas.length > 0 && (
          <Section title="Development Areas">
            <div className="flex flex-wrap gap-1.5">
              {developmentAreas.map((d, i) => (
                <Badge key={i} variant="warning">
                  {d}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* 8. Stretch Activities */}
        {stretchActivities.length > 0 && (
          <Section title="Stretch Activities">
            <div className="space-y-1.5">
              {stretchActivities.map(({ activity, isAssigned }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                >
                  <button
                    onClick={() => activity && setSelectedActivityId(activity.id)}
                    className="text-gray-700 hover:text-blue-600 hover:underline font-medium transition-colors text-left"
                  >
                    {activity?.name ?? "Unknown activity"}
                  </button>
                  {isAssigned ? (
                    <Badge variant="success">ACTIVE</Badge>
                  ) : (
                    <Badge variant="warning">NOT YET ASSIGNED</Badge>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 9. Progresses To / Lateral Moves */}
        {(progressesTo.length > 0 || lateralMoves.length > 0) && (
          <Section title="Career Paths">
            <div className="space-y-2">
              {progressesTo.map((rid) => {
                const target = roles.find((r) => r.id === rid);
                return (
                  <div key={rid} className="flex items-center gap-2 text-sm">
                    <ArrowUp
                      size={14}
                      weight="bold"
                      className="text-emerald-500"
                    />
                    <span className="font-medium text-gray-700">
                      {target?.jobTitle ?? "Unknown role"}
                    </span>
                    <Badge variant="success">Promotion</Badge>
                  </div>
                );
              })}
              {lateralMoves.map((rid) => {
                const target = roles.find((r) => r.id === rid);
                return (
                  <div key={rid} className="flex items-center gap-2 text-sm">
                    <ArrowsLeftRight
                      size={14}
                      weight="bold"
                      className="text-blue-500"
                    />
                    <span className="font-medium text-gray-700">
                      {target?.jobTitle ?? "Unknown role"}
                    </span>
                    <Badge variant="info">Lateral</Badge>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 10. Risk If Stagnant */}
        {progression.riskIfStagnant && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-red-700 font-semibold text-[12px]">
              <Warning size={14} weight="bold" />
              Risk If Stagnant
            </div>
            <p className="text-[13px] text-red-700 leading-relaxed">
              {progression.riskIfStagnant}
            </p>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={
          selectedActivityId
            ? activities.find((a) => a.id === selectedActivityId) ?? null
            : null
        }
        open={!!selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  );
}

// ═══ Helpers ═══

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function MiniCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </span>
      {children}
    </div>
  );
}

function RapidBlock({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}) {
  return (
    <div className={`rounded-lg border p-2.5 ${color}`}>
      <span className="text-[12px] font-semibold">{label}</span>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs">
              • {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic opacity-60 mt-1">None defined</p>
      )}
    </div>
  );
}

function JCRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] font-semibold text-gray-400 w-28 shrink-0">
        {label}
      </span>
      <span className="text-[12px] text-gray-700">{value}</span>
    </div>
  );
}
