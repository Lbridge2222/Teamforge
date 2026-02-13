"use client";

// ════════════════════════════════════════════
// OwnershipResolver — Phase 2: Detect overlaps and resolve conflicts
// ════════════════════════════════════════════

import { useState } from "react";
import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  ShieldWarning,
  ArrowsClockwise,
  SpinnerGap,
  Warning,
  CheckCircle,
  UserCircle,
  Lightning,
  Gauge,
  ChatCircleDots,
  TreeStructure,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES, ROLE_COLORS } from "@/lib/design-system";
import { HandoffSLAPanel } from "./HandoffSLAPanel";

export function OwnershipResolver({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const roles = useWorkspaceStore((s) => s.roles);
  const workspaceOverlaps = useClarityStore((s) => s.workspaceOverlaps);
  const workspaceGaps = useClarityStore((s) => s.workspaceGaps);
  const workspaceHealth = useClarityStore((s) => s.workspaceHealth);
  const structuralInsights = useClarityStore((s) => s.structuralInsights);
  const overlapManagerBrief = useClarityStore((s) => s.overlapManagerBrief);
  const isDetecting = useClarityStore((s) => s.isDetectingOverlaps);
  const setIsDetecting = useClarityStore((s) => s.setIsDetectingOverlaps);
  const setOverlaps = useClarityStore((s) => s.setWorkspaceOverlaps);
  const error = useClarityStore((s) => s.error);
  const setError = useClarityStore((s) => s.setError);

  const [resolvedOverlaps, setResolvedOverlaps] = useState<Set<number>>(
    new Set()
  );

  async function handleDetect() {
    setIsDetecting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/detect-overlaps`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Detection failed");
      }

      const data = await res.json();
      setOverlaps({
        overlaps: data.overlaps ?? [],
        gaps: data.gaps ?? [],
        workspaceHealth: data.workspaceHealth,
        structuralInsights: data.structuralInsights,
        managerBrief: data.managerBrief,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Detection failed"
      );
    } finally {
      setIsDetecting(false);
    }
  }

  function handleResolveOverlap(index: number) {
    setResolvedOverlaps((prev) => new Set([...prev, index]));
  }

  const hasResults =
    workspaceOverlaps.length > 0 || workspaceGaps.length > 0;
  const criticalOverlaps = workspaceOverlaps.filter(
    (o) => o.severity === "critical"
  );
  const warningOverlaps = workspaceOverlaps.filter(
    (o) => o.severity === "warning"
  );
  const infoOverlaps = workspaceOverlaps.filter(
    (o) => o.severity === "info"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Friction & Ownership Resolver
          </h2>
          <p className="text-[13px] text-gray-500">
            AI analyses your entire workspace for overlapping ownership,
            unclear boundaries, and missing handoff SLAs.
          </p>
        </div>
      </div>

      {/* Scan button */}
      {!hasResults && (
        <button
          onClick={handleDetect}
          disabled={isDetecting || roles.length < 2}
          className="w-full rounded-md bg-amber-500 px-4 py-3 text-[13px] font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isDetecting ? (
            <>
              <SpinnerGap
                size={16}
                weight="bold"
                className="animate-spin"
              />
              Scanning workspace…
            </>
          ) : (
            <>
              <ShieldWarning size={16} weight="bold" />
              Scan for Ownership Conflicts
            </>
          )}
        </button>
      )}

      {roles.length < 2 && !hasResults && (
        <p className="text-[12px] text-gray-400 text-center">
          You need at least 2 roles to detect overlaps.
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Warning size={16} weight="bold" className="text-red-500 mt-0.5" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-6">
          {/* Workspace Health Score */}
          {workspaceHealth && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                  workspaceHealth.overallScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                  workspaceHealth.overallScore >= 40 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {workspaceHealth.overallScore}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">Workspace Health Score</p>
                  <p className="text-[12px] text-gray-500">{workspaceHealth.topRiskStatement}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{workspaceHealth.activeOverlapCount}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Overlaps</p>
                </div>
                <div className="rounded-md bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{workspaceHealth.criticalGapCount}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Gaps</p>
                </div>
                <div className="rounded-md bg-gray-50 p-2">
                  <p className="text-lg font-bold text-amber-600">{workspaceHealth.estimatedWeeklyFrictionHours}h</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Weekly Friction</p>
                </div>
              </div>
            </div>
          )}

          {/* Manager Brief */}
          {overlapManagerBrief && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ChatCircleDots size={16} weight="bold" className="text-blue-600" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-blue-800">Manager Brief</h3>
              </div>
              <p className="text-[13px] font-medium text-blue-900 mb-2">Fix first: {overlapManagerBrief.fixFirst}</p>
              {overlapManagerBrief.quickWins.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Quick Wins</p>
                  <ul className="space-y-0.5">
                    {overlapManagerBrief.quickWins.map((w, i) => (
                      <li key={i} className="text-[12px] text-blue-800 flex items-start gap-1.5">
                        <Lightning size={10} weight="fill" className="text-blue-500 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {overlapManagerBrief.conversationsNeeded.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Conversations Needed</p>
                  {overlapManagerBrief.conversationsNeeded.map((c, i) => (
                    <div key={i} className="text-[12px] text-blue-800 mb-1">
                      <span className="font-medium">{c.between.join(" ↔ ")}</span> re: {c.about}
                      <span className="text-blue-500 ml-1">→ {c.suggestedOutcome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`rounded-lg border p-3 text-center ${
                criticalOverlaps.length > 0
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <p className="text-2xl font-bold">{criticalOverlaps.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Critical
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-700 p-3 text-center">
              <p className="text-2xl font-bold">{warningOverlaps.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Warnings
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-700 p-3 text-center">
              <p className="text-2xl font-bold">{workspaceGaps.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Unowned Gaps
              </p>
            </div>
          </div>

          {/* Critical overlaps */}
          {criticalOverlaps.length > 0 && (
            <OverlapSection
              title="Critical Overlaps"
              overlaps={criticalOverlaps}
              roles={roles}
              resolvedSet={resolvedOverlaps}
              onResolve={handleResolveOverlap}
              startIndex={0}
              color="red"
            />
          )}

          {/* Warning overlaps */}
          {warningOverlaps.length > 0 && (
            <OverlapSection
              title="Needs Clarification"
              overlaps={warningOverlaps}
              roles={roles}
              resolvedSet={resolvedOverlaps}
              onResolve={handleResolveOverlap}
              startIndex={criticalOverlaps.length}
              color="amber"
            />
          )}

          {/* Info overlaps */}
          {infoOverlaps.length > 0 && (
            <OverlapSection
              title="Minor Items"
              overlaps={infoOverlaps}
              roles={roles}
              resolvedSet={resolvedOverlaps}
              onResolve={handleResolveOverlap}
              startIndex={criticalOverlaps.length + warningOverlaps.length}
              color="gray"
            />
          )}

          {/* Gaps */}
          {workspaceGaps.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Unowned Areas ({workspaceGaps.length})
              </h3>
              <div className="space-y-2">
                {workspaceGaps.map((gap, i) => (
                  <div key={i} className={`${CARD_CLASSES} p-3`}>
                    <div className="flex items-start gap-3">
                      <Warning
                        size={16}
                        weight="bold"
                        className="text-blue-500 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-medium text-gray-900">
                            {gap.item}
                          </p>
                          {gap.severity && (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-bold uppercase ${
                              gap.severity === "critical" ? "bg-red-100 text-red-700" :
                              gap.severity === "high" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>{gap.severity}</span>
                          )}
                          {gap.category && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0 text-[9px] font-medium text-blue-600">{gap.category}</span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Likely owner:{" "}
                          <span className="font-medium">{gap.likelyOwner}</span>
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {gap.reason}
                        </p>
                        {gap.riskIfUnowned && (
                          <p className="text-[11px] text-red-600 mt-1 font-medium">
                            Risk: {gap.riskIfUnowned}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structural Insights */}
          {structuralInsights.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <TreeStructure size={14} weight="bold" />
                Structural Insights ({structuralInsights.length})
              </h3>
              <div className="space-y-2">
                {structuralInsights.map((insight, i) => (
                  <div key={i} className={`${CARD_CLASSES} p-3`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-[13px] font-medium text-gray-900">{insight.description}</p>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-bold uppercase ${
                        insight.priority === "high" ? "bg-red-100 text-red-700" :
                        insight.priority === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{insight.priority}</span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">{insight.type.replace(/_/g, " ")}</p>
                    <p className="text-[12px] text-gray-500">{insight.recommendation}</p>
                    {insight.affectedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {insight.affectedRoles.map((r, j) => (
                          <span key={j} className="inline-flex rounded-full bg-gray-100 px-2 py-0 text-[10px] font-medium text-gray-600">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-scan button */}
          <button
            onClick={handleDetect}
            disabled={isDetecting}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isDetecting ? (
              <SpinnerGap
                size={14}
                weight="bold"
                className="animate-spin"
              />
            ) : (
              <ArrowsClockwise size={14} weight="bold" />
            )}
            Re-scan Workspace
          </button>

          {/* Handoff SLA section */}
          <div className="border-t border-gray-200 pt-6">
            <HandoffSLAPanel workspaceId={workspaceId} />
          </div>
        </div>
      )}
    </div>
  );
}

type OverlapItemType = {
  item: string;
  roles: {
    roleId: string;
    roleTitle: string;
    ownershipType: "primary" | "contributor" | "unclear";
    evidence?: string;
  }[];
  severity: "critical" | "warning" | "info";
  overlapType?: string;
  interdependenceType?: string;
  weeklyFrictionCost?: string;
  recommendation: string;
  suggestedOwner: string;
  ownershipRationale?: string;
  conversationNeeded?: boolean;
};

function OverlapSection({
  title,
  overlaps,
  roles,
  resolvedSet,
  onResolve,
  startIndex,
  color,
}: {
  title: string;
  overlaps: OverlapItemType[];
  roles: { id: string; colorIndex: number; jobTitle: string }[];
  resolvedSet: Set<number>;
  onResolve: (index: number) => void;
  startIndex: number;
  color: "red" | "amber" | "gray";
}) {
  const borderColor = {
    red: "border-red-200",
    amber: "border-amber-200",
    gray: "border-gray-200",
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {title} ({overlaps.length})
      </h3>
      <div className="space-y-3">
        {overlaps.map((overlap, i) => {
          const idx = startIndex + i;
          const isResolved = resolvedSet.has(idx);

          return (
            <div
              key={idx}
              className={`${CARD_CLASSES} ${borderColor[color]} p-4 ${
                isResolved ? "opacity-50" : ""
              } transition-opacity`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {overlap.item}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {overlap.overlapType && (
                      <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0 text-[9px] font-medium text-gray-600">{overlap.overlapType}</span>
                    )}
                    {overlap.weeklyFrictionCost && (
                      <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-700">~{overlap.weeklyFrictionCost}</span>
                    )}
                    {overlap.conversationNeeded && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0 text-[9px] font-bold text-blue-700">💬 Talk needed</span>
                    )}
                  </div>
                </div>
                {isResolved && (
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className="text-emerald-500 shrink-0"
                  />
                )}
              </div>

              {/* Involved roles */}
              <div className="flex flex-wrap gap-2 mb-2">
                {overlap.roles.map((r, j) => {
                  const wsRole = roles.find((wr) => wr.id === r.roleId);
                  const roleColor =
                    ROLE_COLORS[
                      (wsRole?.colorIndex ?? j) % ROLE_COLORS.length
                    ];

                  return (
                    <span
                      key={j}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${roleColor?.bg ?? "bg-gray-100"} ${roleColor?.text ?? "text-gray-700"}`}
                    >
                      <UserCircle size={12} weight="bold" />
                      {r.roleTitle}
                      <span className="opacity-60">({r.ownershipType})</span>
                    </span>
                  );
                })}
              </div>

              <p className="text-[12px] text-gray-500 mb-3">
                {overlap.recommendation}
              </p>

              {overlap.ownershipRationale && (
                <p className="text-[11px] text-gray-400 italic mb-2">
                  Rationale: {overlap.ownershipRationale}
                </p>
              )}

              {/* Suggested owner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightning
                    size={12}
                    weight="fill"
                    className="text-blue-500"
                  />
                  <span className="text-[11px] text-blue-700 font-medium">
                    Suggested owner: {overlap.suggestedOwner}
                  </span>
                </div>

                {!isResolved && (
                  <button
                    onClick={() => onResolve(idx)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
