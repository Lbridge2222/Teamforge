"use client";

// ════════════════════════════════════════════
// ProposalCard — One-click fix with apply/dismiss
// ════════════════════════════════════════════

import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  Check,
  X,
  SpinnerGap,
  ArrowRight,
  Lightning,
  ChatCircleDots,
  Users,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES } from "@/lib/design-system";
import type { ClarityProposal } from "@/lib/types";

type ProposalMetadata = {
  effort?: string;
  confidence?: string;
  sequenceGroup?: number;
  reversible?: boolean;
  requiresConversation?: boolean;
  affectedRoles?: string[];
  doNothingCost?: string;
};

const TYPE_LABELS: Record<string, string> = {
  edit_role: "Edit Role",
  add_ownership: "Add Ownership",
  remove_ownership: "Remove Ownership",
  add_deliverable: "Add Deliverable",
  remove_deliverable: "Remove Deliverable",
  set_boundary: "Set Boundary",
  add_handoff_sla: "Add Handoff SLA",
  update_handoff_sla: "Update Handoff SLA",
  resolve_overlap: "Resolve Overlap",
};

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const EFFORT_STYLES: Record<string, string> = {
  trivial: "bg-emerald-100 text-emerald-700",
  small: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  large: "bg-red-100 text-red-700",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

export function ProposalCard({
  proposal,
  workspaceId,
  sessionId,
}: {
  proposal: ClarityProposal;
  workspaceId: string;
  sessionId: string;
}) {
  const updateProposal = useClarityStore((s) => s.updateProposal);
  const isApplying = useClarityStore((s) => s.isApplying);
  const setIsApplying = useClarityStore((s) => s.setIsApplying);
  const setError = useClarityStore((s) => s.setError);

  // Refresh workspace data after applying
  const version = useWorkspaceStore((s) => s.version);

  const isThisApplying = isApplying === proposal.id;
  const isResolved = proposal.status !== "pending";
  const meta = (proposal as ClarityProposal & { metadata?: ProposalMetadata }).metadata;

  async function handleApply() {
    setIsApplying(proposal.id);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/${sessionId}/proposals/${proposal.id}/apply`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to apply");
      }

      updateProposal(proposal.id, {
        status: "accepted",
        resolvedAt: new Date().toISOString() as unknown as Date,
      });

      // Trigger workspace data refresh
      // The workspace provider will pick up changes on next navigation
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to apply change"
      );
    } finally {
      setIsApplying(null);
    }
  }

  async function handleDismiss() {
    setIsApplying(proposal.id);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/${sessionId}/proposals/${proposal.id}/dismiss`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error("Failed to dismiss");
      }

      updateProposal(proposal.id, {
        status: "dismissed",
        resolvedAt: new Date().toISOString() as unknown as Date,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to dismiss"
      );
    } finally {
      setIsApplying(null);
    }
  }

  return (
    <div
      className={`${CARD_CLASSES} p-4 ${
        isResolved ? "opacity-60" : ""
      } transition-opacity`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Lightning
            size={14}
            weight="fill"
            className={
              proposal.status === "accepted"
                ? "text-emerald-500"
                : proposal.status === "dismissed"
                  ? "text-gray-400"
                  : "text-amber-500"
            }
          />
          <p className="text-[13px] font-semibold text-gray-900 truncate">
            {proposal.title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              IMPACT_STYLES[proposal.impact ?? "low"]
            }`}
          >
            {proposal.impact ?? "low"}
          </span>
          {meta?.effort && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${EFFORT_STYLES[meta.effort] ?? "bg-gray-100 text-gray-600"}`}>
              {meta.effort}
            </span>
          )}
          {meta?.confidence && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_STYLES[meta.confidence] ?? "bg-gray-100 text-gray-600"}`}>
              {meta.confidence} conf.
            </span>
          )}
          {meta?.sequenceGroup && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              Step {meta.sequenceGroup}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            {TYPE_LABELS[proposal.type] ?? proposal.type}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
        {proposal.explanation}
      </p>

      {/* Enriched metadata alerts */}
      {meta && (
        <div className="space-y-1.5 mb-3">
          {meta.requiresConversation && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1">
              <ChatCircleDots size={12} weight="bold" />
              <span className="font-medium">Requires a conversation before applying</span>
            </div>
          )}
          {meta.affectedRoles && meta.affectedRoles.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <Users size={12} weight="bold" />
              <span>Affects: {meta.affectedRoles.join(", ")}</span>
            </div>
          )}
          {meta.doNothingCost && (
            <div className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">
              <Warning size={12} weight="bold" className="mt-0.5 shrink-0" />
              <span>If not fixed: {meta.doNothingCost}</span>
            </div>
          )}
          {meta.reversible === false && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              ⚠ Not easily reversible
            </span>
          )}
        </div>
      )}

      {/* Change preview */}
      {proposal.field && (
        <div className="rounded-md bg-gray-50 border border-gray-100 p-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Current ({proposal.field})
              </p>
              <pre className="text-[11px] text-gray-600 font-mono whitespace-pre-wrap break-words">
                {formatValue(proposal.currentValue)}
              </pre>
            </div>
            <ArrowRight
              size={14}
              className="text-gray-300 mt-3 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                Proposed
              </p>
              <pre className="text-[11px] text-blue-700 font-mono whitespace-pre-wrap break-words">
                {formatValue(proposal.proposedValue)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            disabled={isThisApplying}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isThisApplying ? (
              <SpinnerGap
                size={14}
                weight="bold"
                className="animate-spin"
              />
            ) : (
              <Check size={14} weight="bold" />
            )}
            Apply Change
          </button>
          <button
            onClick={handleDismiss}
            disabled={isThisApplying}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Resolved state */}
      {isResolved && (
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold ${
              proposal.status === "accepted"
                ? "text-emerald-600"
                : "text-gray-400"
            }`}
          >
            {proposal.status === "accepted" ? "Applied" : "Dismissed"}
          </span>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "string") {
      return value.join("\n");
    }
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}
