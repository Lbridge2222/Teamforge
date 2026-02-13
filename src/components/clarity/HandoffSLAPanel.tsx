"use client";

// ════════════════════════════════════════════
// HandoffSLAPanel — AI-suggested handoff SLAs and boundaries
// ════════════════════════════════════════════

import { useState } from "react";
import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  Handshake,
  SpinnerGap,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Warning,
  Gauge,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES } from "@/lib/design-system";

export function HandoffSLAPanel({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const suggestions = useClarityStore((s) => s.handoffSuggestions);
  const handoffHealth = useClarityStore((s) => s.handoffHealth);
  const processInsights = useClarityStore((s) => s.processInsights);
  const setSuggestions = useClarityStore((s) => s.setHandoffSuggestions);
  const isSuggesting = useClarityStore((s) => s.isSuggestingHandoffs);
  const setIsSuggesting = useClarityStore((s) => s.setIsSuggestingHandoffs);
  const setError = useClarityStore((s) => s.setError);

  const stages = useWorkspaceStore((s) => s.stages);
  const handoffs = useWorkspaceStore((s) => s.handoffs);

  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  async function handleSuggest() {
    setIsSuggesting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/suggest-handoffs`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Suggestion failed");
      }

      const data = await res.json();
      setSuggestions({
        suggestions: data.suggestions ?? [],
        handoffHealth: data.handoffHealth,
        processInsights: data.processInsights,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Suggestion failed"
      );
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleApplySLA(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    // If there's an existing handoff, update it
    if (suggestion.existingHandoffId) {
      try {
        const res = await fetch(
          `/api/handoffs/${suggestion.existingHandoffId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sla: suggestion.suggestedSLA,
              slaOwner: suggestion.suggestedOwner,
            }),
          }
        );
        if (res.ok) {
          setAppliedIds((prev) => new Set([...prev, index]));
        }
      } catch {
        // Silently fail for now
      }
    } else {
      // Create a new handoff — find stage IDs
      const fromStage = stages.find(
        (s) => s.name === suggestion.fromStage
      );
      const toStage = stages.find((s) => s.name === suggestion.toStage);

      if (fromStage && toStage) {
        try {
          const res = await fetch(
            `/api/workspaces/${workspaceId}/handoffs`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workspaceId,
                fromStageId: fromStage.id,
                toStageId: toStage.id,
                sla: suggestion.suggestedSLA,
                slaOwner: suggestion.suggestedOwner,
                notes: suggestion.explanation,
              }),
            }
          );
          if (res.ok) {
            setAppliedIds((prev) => new Set([...prev, index]));
          }
        } catch {
          // Silently fail
        }
      }
    }
  }

  const hasSuggestions = suggestions.length > 0;
  const highPriority = suggestions.filter((s) => s.priority === "high");
  const medPriority = suggestions.filter((s) => s.priority === "medium");
  const lowPriority = suggestions.filter((s) => s.priority === "low");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Handshake size={16} weight="bold" className="text-amber-500" />
          Handoff SLAs & Boundaries
        </h3>
        <p className="text-[12px] text-gray-500">
          AI analyses your pipeline stages and suggests SLAs, owners, and
          "does not own" boundaries for each handoff point.
        </p>
      </div>

      {!hasSuggestions && (
        <button
          onClick={handleSuggest}
          disabled={isSuggesting || stages.length < 2}
          className="w-full rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSuggesting ? (
            <>
              <SpinnerGap
                size={14}
                weight="bold"
                className="animate-spin"
              />
              Analysing handoffs…
            </>
          ) : (
            <>
              <Clock size={14} weight="bold" />
              Suggest Handoff SLAs
            </>
          )}
        </button>
      )}

      {stages.length < 2 && !hasSuggestions && (
        <p className="text-[12px] text-gray-400 text-center">
          You need at least 2 pipeline stages.
        </p>
      )}

      {/* Suggestions */}
      {hasSuggestions && (
        <div className="space-y-4">
          {/* Handoff Health */}
          {handoffHealth && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge size={16} weight="bold" className="text-amber-500" />
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">Handoff Health</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-md bg-emerald-50 p-2">
                  <p className="text-lg font-bold text-emerald-700">{handoffHealth.coveredHandoffs}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Covered</p>
                </div>
                <div className={`rounded-md p-2 ${handoffHealth.uncoveredHandoffs > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                  <p className={`text-lg font-bold ${handoffHealth.uncoveredHandoffs > 0 ? "text-red-700" : "text-emerald-700"}`}>{handoffHealth.uncoveredHandoffs}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Uncovered</p>
                </div>
                <div className="rounded-md bg-amber-50 p-2 col-span-2">
                  <p className="text-lg font-bold text-amber-700">{handoffHealth.estimatedWeeklyWaitHours}h</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Weekly Wait</p>
                </div>
              </div>
              {handoffHealth.highestRiskHandoff && (
                <p className="text-[11px] text-red-600 mt-2 font-medium">
                  <Warning size={12} weight="bold" className="inline mr-1" />
                  Highest risk: {handoffHealth.highestRiskHandoff}
                </p>
              )}
            </div>
          )}

          {/* Process Insights */}
          {processInsights.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
                <Lightning size={12} weight="bold" />
                Process Insights ({processInsights.length})
              </h4>
              <div className="space-y-2">
                {processInsights.map((insight, i) => (
                  <div key={i} className={`${CARD_CLASSES} p-3`}>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0 mt-0.5">
                        {insight.type.replace(/_/g, " ")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] text-gray-700">{insight.description}</p>
                        <p className="text-[11px] text-blue-600 mt-0.5">{insight.recommendation}</p>
                        {insight.affectedStages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {insight.affectedStages.map((s, j) => (
                              <span key={j} className="inline-flex rounded-full bg-gray-100 px-2 py-0 text-[10px] font-medium text-gray-600">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {highPriority.length > 0 && (
            <SuggestionGroup
              title="High Priority"
              suggestions={highPriority}
              appliedIds={appliedIds}
              onApply={handleApplySLA}
              startIndex={0}
              color="red"
            />
          )}
          {medPriority.length > 0 && (
            <SuggestionGroup
              title="Medium"
              suggestions={medPriority}
              appliedIds={appliedIds}
              onApply={handleApplySLA}
              startIndex={highPriority.length}
              color="amber"
            />
          )}
          {lowPriority.length > 0 && (
            <SuggestionGroup
              title="Fine-tuning"
              suggestions={lowPriority}
              appliedIds={appliedIds}
              onApply={handleApplySLA}
              startIndex={highPriority.length + medPriority.length}
              color="gray"
            />
          )}
        </div>
      )}
    </div>
  );
}

type SuggestionItem = {
  fromStage: string;
  toStage: string;
  existingHandoffId: string | null;
  suggestedSLA: string;
  slaRationale?: string;
  suggestedOwner: string;
  ownerRationale?: string;
  completionCriteria?: string[];
  doesNotOwnBoundaries: string[];
  escalationPath?: string;
  explanation: string;
  priority: "high" | "medium" | "low";
  riskIfMissing?: string;
};

function SuggestionGroup({
  title,
  suggestions,
  appliedIds,
  onApply,
  startIndex,
  color,
}: {
  title: string;
  suggestions: SuggestionItem[];
  appliedIds: Set<number>;
  onApply: (index: number) => void;
  startIndex: number;
  color: "red" | "amber" | "gray";
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
        {title} ({suggestions.length})
      </h4>
      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const idx = startIndex + i;
          const isApplied = appliedIds.has(idx);

          return (
            <div
              key={idx}
              className={`${CARD_CLASSES} p-4 ${
                isApplied ? "opacity-50" : ""
              } transition-opacity`}
            >
              {/* Stage transition header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-gray-900">
                  {s.fromStage}
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-900">
                  {s.toStage}
                </span>
                {s.existingHandoffId ? (
                  <span className="text-[10px] font-medium text-gray-400">
                    (update)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-blue-500">
                    (new)
                  </span>
                )}
              </div>

              {/* SLA & Owner */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="rounded-md bg-blue-50 p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock size={12} weight="bold" className="text-blue-600" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                      SLA
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-blue-900">
                    {s.suggestedSLA}
                  </p>
                </div>
                <div className="rounded-md bg-violet-50 p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Shield
                      size={12}
                      weight="bold"
                      className="text-violet-600"
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                      Owner
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-violet-900">
                    {s.suggestedOwner}
                  </p>
                </div>
              </div>

              {/* Rationales */}
              {(s.slaRationale || s.ownerRationale) && (
                <div className="space-y-1 mb-2">
                  {s.slaRationale && (
                    <p className="text-[11px] text-gray-400 italic">SLA rationale: {s.slaRationale}</p>
                  )}
                  {s.ownerRationale && (
                    <p className="text-[11px] text-gray-400 italic">Owner rationale: {s.ownerRationale}</p>
                  )}
                </div>
              )}

              {/* Does not own boundaries */}
              {s.doesNotOwnBoundaries.length > 0 && (
                <div className="rounded-md bg-red-50 p-2 mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 mb-1">
                    Does Not Cross This Boundary
                  </p>
                  <ul className="space-y-0.5">
                    {s.doesNotOwnBoundaries.map((b, j) => (
                      <li
                        key={j}
                        className="text-[12px] text-red-700 flex items-start gap-1.5"
                      >
                        <span className="text-red-400 mt-1">×</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Completion criteria */}
              {s.completionCriteria && s.completionCriteria.length > 0 && (
                <div className="rounded-md bg-emerald-50 p-2 mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                    Completion Criteria
                  </p>
                  <ul className="space-y-0.5">
                    {s.completionCriteria.map((c, j) => (
                      <li key={j} className="text-[12px] text-emerald-700 flex items-start gap-1.5">
                        <CheckCircle size={10} weight="bold" className="text-emerald-500 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Escalation path */}
              {s.escalationPath && (
                <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1 mb-2">
                  <span className="font-semibold">Escalation:</span> {s.escalationPath}
                </p>
              )}

              {/* Risk if missing */}
              {s.riskIfMissing && (
                <p className="text-[11px] text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
                  <span className="font-semibold">If missing:</span> {s.riskIfMissing}
                </p>
              )}

              {/* Explanation */}
              <p className="text-[12px] text-gray-500 mb-3">
                {s.explanation}
              </p>

              {/* Apply button */}
              {!isApplied ? (
                <button
                  onClick={() => onApply(idx)}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} weight="bold" />
                  {s.existingHandoffId ? "Update Handoff" : "Create Handoff"}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <CheckCircle
                    size={14}
                    weight="fill"
                    className="text-emerald-500"
                  />
                  <span className="text-[12px] font-medium text-emerald-600">
                    Applied
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
