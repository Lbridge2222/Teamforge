"use client";

// ════════════════════════════════════════════
// ClarityBuilder — Main orchestrator component
// Controls the step-by-step guided flow
// ════════════════════════════════════════════

import { useClarityStore } from "@/lib/store/clarity-store";
import { ClarityWelcome } from "./ClarityWelcome";
import { RoleImportPanel } from "./RoleImportPanel";
import { ExtractionReview } from "./ExtractionReview";
import { ComparisonPanel } from "./ComparisonPanel";
import { ProposalCard } from "./ProposalCard";
import { CommentThread } from "./CommentThread";
import { OwnershipResolver } from "./OwnershipResolver";
import { HandoffSLAPanel } from "./HandoffSLAPanel";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  ArrowLeft,
  SpinnerGap,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

const STEP_LABELS: Record<string, string> = {
  welcome: "Get Started",
  import: "Import Role Spec",
  "select-role": "Select Role",
  extracting: "Extracting…",
  "review-extraction": "Review Extraction",
  comparing: "Comparing…",
  comparison: "Expected vs Current",
  proposals: "Review Changes",
  done: "Complete",
};

export function ClarityBuilder({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const step = useClarityStore((s) => s.step);
  const setStep = useClarityStore((s) => s.setStep);
  const session = useClarityStore((s) => s.session);
  const reset = useClarityStore((s) => s.reset);
  const proposals = useClarityStore((s) => s.proposals);

  const resolvedCount = proposals.filter(
    (p) => p.status !== "pending"
  ).length;
  const totalProposals = proposals.length;

  function handleBack() {
    const backMap: Record<string, string> = {
      import: "welcome",
      "select-role": "review-extraction",
      "review-extraction": "import",
      comparison: "review-extraction",
      proposals: "comparison",
    };
    const prev = backMap[step];
    if (prev) setStep(prev as typeof step);
  }

  function handleStartOver() {
    reset();
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {step !== "welcome" && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {STEP_LABELS[step] ?? step}
              </span>
              {step === "proposals" && totalProposals > 0 && (
                <span className="text-[11px] font-medium text-gray-500">
                  {resolvedCount}/{totalProposals} resolved
                </span>
              )}
            </div>
            <StepBar step={step} />
          </div>

          <button
            onClick={handleStartOver}
            className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Start over
          </button>
        </div>
      )}

      {/* Step content */}
      {step === "welcome" && (
        <ClarityWelcome workspaceId={workspaceId} />
      )}
      {step === "import" && (
        <RoleImportPanel workspaceId={workspaceId} />
      )}
      {(step === "extracting" || step === "comparing") && (
        <LoadingStep step={step} />
      )}
      {step === "review-extraction" && (
        <ExtractionReview workspaceId={workspaceId} />
      )}
      {step === "select-role" && (
        <ExtractionReview workspaceId={workspaceId} />
      )}
      {step === "comparison" && (
        <ComparisonPanel workspaceId={workspaceId} />
      )}
      {step === "proposals" && (
        <div className="space-y-6">
          <ProposalsList workspaceId={workspaceId} />
          <CommentThread workspaceId={workspaceId} />
        </div>
      )}
      {step === "done" && <DoneStep onReset={handleStartOver} />}
    </div>
  );
}

// ── Step Progress Bar ──

function StepBar({ step }: { step: string }) {
  const steps = [
    "import",
    "review-extraction",
    "comparison",
    "proposals",
    "done",
  ];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="flex gap-1">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= currentIdx ? "bg-blue-600" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ── Loading Step ──

function LoadingStep({ step }: { step: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <SpinnerGap
        size={32}
        weight="bold"
        className="text-blue-600 animate-spin mb-4"
      />
      <p className="text-[13px] font-medium text-gray-700">
        {step === "extracting"
          ? "AI is analysing the job specification…"
          : "AI is comparing expected vs current role…"}
      </p>
      <p className="text-[12px] text-gray-400 mt-1">
        This usually takes 10-20 seconds
      </p>
    </div>
  );
}

// ── Proposals List ──

function ProposalsList({ workspaceId }: { workspaceId: string }) {
  const proposals = useClarityStore((s) => s.proposals);
  const session = useClarityStore((s) => s.session);

  if (!session) return null;

  const pending = proposals.filter((p) => p.status === "pending");
  const accepted = proposals.filter((p) => p.status === "accepted");
  const dismissed = proposals.filter((p) => p.status === "dismissed");

  return (
    <div className="space-y-4">
      {session.comparisonSummary && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-[13px] text-blue-900">
            {session.comparisonSummary}
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Pending Changes ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                workspaceId={workspaceId}
                sessionId={session.id}
              />
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-3">
            Applied ({accepted.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {accepted.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                workspaceId={workspaceId}
                sessionId={session.id}
              />
            ))}
          </div>
        </div>
      )}

      {dismissed.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Dismissed ({dismissed.length})
          </h3>
          <div className="space-y-2 opacity-40">
            {dismissed.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                workspaceId={workspaceId}
                sessionId={session.id}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && proposals.length > 0 && (
        <div className="text-center py-6">
          <CheckCircle
            size={32}
            weight="fill"
            className="text-emerald-500 mx-auto mb-2"
          />
          <p className="text-[13px] font-medium text-gray-700">
            All proposals reviewed
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            {accepted.length} applied, {dismissed.length} dismissed
          </p>
        </div>
      )}
    </div>
  );
}

// ── Done Step ──

function DoneStep({ onReset }: { onReset: () => void }) {
  const proposals = useClarityStore((s) => s.proposals);
  const accepted = proposals.filter((p) => p.status === "accepted").length;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckCircle
        size={48}
        weight="fill"
        className="text-emerald-500 mb-4"
      />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Role Clarity Updated
      </h2>
      <p className="text-[13px] text-gray-500 text-center max-w-md mb-6">
        {accepted} change{accepted !== 1 ? "s" : ""} applied to your
        role model. The workspace data has been updated.
      </p>
      <button
        onClick={onReset}
        className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Analyse Another Role
      </button>
    </div>
  );
}
