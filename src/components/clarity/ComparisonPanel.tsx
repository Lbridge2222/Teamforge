"use client";

// ════════════════════════════════════════════
// ComparisonPanel — Expected vs Current side-by-side view
// ════════════════════════════════════════════

import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  ArrowRight,
  Warning,
  ArrowsClockwise,
  CaretRight,
  Lightning,
  ChatCircleDots,
  ShieldWarning,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES } from "@/lib/design-system";
import type { GapAnalysisItem, OverlapAnalysisItem, OwnershipCategory } from "@/lib/types";

export function ComparisonPanel({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const session = useClarityStore((s) => s.session);
  const setStep = useClarityStore((s) => s.setStep);
  const proposals = useClarityStore((s) => s.proposals);
  const clarityScore = useClarityStore((s) => s.clarityScore);
  const raciIssues = useClarityStore((s) => s.raciIssues);
  const managerBrief = useClarityStore((s) => s.managerBrief);
  const roles = useWorkspaceStore((s) => s.roles);

  if (!session) return null;

  const gaps = (session.gapAnalysis as GapAnalysisItem[]) ?? [];
  const overlaps = (session.overlapAnalysis as OverlapAnalysisItem[]) ?? [];
  const currentRole = session.roleId
    ? roles.find((r) => r.id === session.roleId)
    : null;

  const currentOwns = (currentRole?.owns as OwnershipCategory[]) ?? [];
  const currentDeliverables =
    (currentRole?.keyDeliverables as string[]) ?? [];

  const extractedDomains =
    (session.extractedOwnershipDomains as {
      title: string;
      items: string[];
    }[]) ?? [];
  const extractedDeliverables =
    ((session.extractedDeliverables as unknown[]) ?? []).map((d) =>
      typeof d === "string" ? d : (d as { text: string }).text
    );

  const highGaps = gaps.filter((g) => g.severity === "high");
  const medGaps = gaps.filter((g) => g.severity === "medium");
  const lowGaps = gaps.filter((g) => g.severity === "low");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary */}
      {session.comparisonSummary && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-[13px] text-blue-900 leading-relaxed">
            {session.comparisonSummary}
          </p>
        </div>
      )}

      {/* Clarity Score */}
      {clarityScore && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
              clarityScore.overall >= 70 ? "bg-emerald-100 text-emerald-700" :
              clarityScore.overall >= 40 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {clarityScore.overall}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">Role Clarity Score</p>
              <p className="text-[12px] text-gray-500">{clarityScore.interpretation}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(clarityScore.dimensions).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="relative h-2 bg-gray-200 rounded-full mb-1">
                  <div className={`absolute inset-y-0 left-0 rounded-full ${
                    value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${value}%` }} />
                </div>
                <p className="text-[9px] font-medium text-gray-500 leading-tight">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="text-[11px] font-bold text-gray-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager Brief */}
      {managerBrief && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChatCircleDots size={16} weight="bold" className="text-blue-600" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-blue-800">Manager Brief</h3>
          </div>
          <p className="text-[13px] font-medium text-blue-900 mb-2">
            Top priority: {managerBrief.topPriority}
          </p>
          {managerBrief.quickWins.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Quick Wins</p>
              <ul className="space-y-0.5">
                {managerBrief.quickWins.map((w, i) => (
                  <li key={i} className="text-[12px] text-blue-800 flex items-start gap-1.5">
                    <Lightning size={10} weight="fill" className="text-blue-500 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {managerBrief.conversationsNeeded.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Conversations Needed</p>
              {managerBrief.conversationsNeeded.map((c, i) => (
                <div key={i} className="text-[12px] text-blue-800 mb-1">
                  <span className="font-medium">With {c.with}</span> about {c.about}
                  <span className="text-blue-500 ml-1">— {c.why}</span>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 mt-2">
            <p className="text-[11px] text-red-700">
              <span className="font-semibold">Do-nothing risk:</span> {managerBrief.doNothingRisk}
            </p>
          </div>
        </div>
      )}

      {/* RACI Issues */}
      {raciIssues.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <ShieldWarning size={14} weight="bold" />
            RACI Issues ({raciIssues.length})
          </h3>
          <div className="space-y-2">
            {raciIssues.map((issue, i) => (
              <div key={i} className={`${CARD_CLASSES} p-3`}>
                <p className="text-[13px] font-medium text-gray-900">{issue.domain}</p>
                <p className="text-[12px] text-amber-700 mt-0.5">{issue.issue}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Current: {issue.currentState}</p>
                <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{issue.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Gaps Found"
          value={gaps.length}
          color={gaps.length > 0 ? "amber" : "emerald"}
        />
        <StatCard
          label="Overlaps"
          value={overlaps.length}
          color={overlaps.length > 0 ? "red" : "emerald"}
        />
        <StatCard
          label="Proposals Ready"
          value={proposals.length}
          color="blue"
        />
      </div>

      {/* Side-by-side comparison */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Ownership Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expected */}
          <div className={`${CARD_CLASSES} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="text-[12px] font-semibold text-blue-700 uppercase tracking-wider">
                Expected (Job Spec)
              </h4>
            </div>
            {extractedDomains.length > 0 ? (
              <div className="space-y-3">
                {extractedDomains.map((d, i) => (
                  <div key={i}>
                    <p className="text-[12px] font-semibold text-gray-800 mb-1">
                      {d.title}
                    </p>
                    <ul className="space-y-0.5">
                      {d.items.map((item, j) => (
                        <li
                          key={j}
                          className="text-[12px] text-gray-600 flex items-start gap-1.5"
                        >
                          <span className="text-blue-400 mt-1">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400 italic">
                No ownership domains extracted
              </p>
            )}

            {extractedDeliverables.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Deliverables
                </p>
                <ul className="space-y-0.5">
                  {extractedDeliverables.map((d, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-gray-600 flex items-start gap-1.5"
                    >
                      <span className="text-blue-400 mt-1">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Current */}
          <div className={`${CARD_CLASSES} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <h4 className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                Current (Role Model)
              </h4>
            </div>
            {currentOwns.length > 0 ? (
              <div className="space-y-3">
                {currentOwns.map((d, i) => (
                  <div key={i}>
                    <p className="text-[12px] font-semibold text-gray-800 mb-1">
                      {d.title}
                    </p>
                    <ul className="space-y-0.5">
                      {d.items.map((item, j) => (
                        <li
                          key={j}
                          className="text-[12px] text-gray-600 flex items-start gap-1.5"
                        >
                          <span className="text-gray-400 mt-1">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400 italic">
                No ownership defined yet
              </p>
            )}

            {currentDeliverables.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Deliverables
                </p>
                <ul className="space-y-0.5">
                  {currentDeliverables.map((d, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-gray-600 flex items-start gap-1.5"
                    >
                      <span className="text-gray-400 mt-1">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gap analysis */}
      {gaps.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Gap Analysis ({gaps.length})
          </h3>
          <div className="space-y-2">
            {highGaps.length > 0 && (
              <GapSection label="High Priority" gaps={highGaps} color="red" />
            )}
            {medGaps.length > 0 && (
              <GapSection label="Medium" gaps={medGaps} color="amber" />
            )}
            {lowGaps.length > 0 && (
              <GapSection label="Low" gaps={lowGaps} color="gray" />
            )}
          </div>
        </div>
      )}

      {/* Overlaps */}
      {overlaps.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Ownership Overlaps ({overlaps.length})
          </h3>
          <div className="space-y-2">
            {overlaps.map((o, i) => (
              <div key={i} className={`${CARD_CLASSES} p-3`}>
                <div className="flex items-start gap-3">
                  <ArrowsClockwise
                    size={16}
                    weight="bold"
                    className="text-red-500 mt-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-900">
                      {o.item}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Current: <span className="font-medium">{o.currentOwner}</span>
                      <ArrowRight size={10} className="inline mx-1" />
                      Expected: <span className="font-medium">{o.expectedOwner}</span>
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {o.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue to proposals */}
      {proposals.length > 0 && (
        <button
          onClick={() => setStep("proposals")}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Review {proposals.length} Proposed Change{proposals.length !== 1 ? "s" : ""}
          <CaretRight size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "red" | "blue";
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div
      className={`rounded-lg border p-3 text-center ${colorClasses[color]}`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
    </div>
  );
}

function GapSection({
  label,
  gaps,
  color,
}: {
  label: string;
  gaps: GapAnalysisItem[];
  color: "red" | "amber" | "gray";
}) {
  const dotColor = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    gray: "bg-gray-400",
  };

  return (
    <div className="space-y-2">
      {gaps.map((gap, i) => (
        <div key={i} className={`${CARD_CLASSES} p-3`}>
          <div className="flex items-start gap-3">
            <div
              className={`w-2 h-2 rounded-full ${dotColor[color]} mt-1.5 shrink-0`}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-900">
                {gap.area}
              </p>
              <div className="flex items-start gap-4 mt-1">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-0.5">
                    Expected
                  </p>
                  <p className="text-[12px] text-gray-600">{gap.expected}</p>
                </div>
                <ArrowRight size={12} className="text-gray-300 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                    Current
                  </p>
                  <p className="text-[12px] text-gray-600">{gap.current}</p>
                </div>
              </div>
              <p className="text-[12px] text-gray-400 mt-1.5 italic">
                {gap.explanation}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
