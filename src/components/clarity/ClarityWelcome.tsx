"use client";

// ════════════════════════════════════════════
// ClarityWelcome — Guided onboarding entry point
// ════════════════════════════════════════════

import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  MagnifyingGlass,
  FileText,
  ArrowsClockwise,
  Lightning,
  ShieldCheck,
  Handshake,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES } from "@/lib/design-system";

export function ClarityWelcome({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const setStep = useClarityStore((s) => s.setStep);
  const roles = useWorkspaceStore((s) => s.roles);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
          <Lightning size={14} weight="fill" />
          AI-Powered
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Role Clarity Builder
        </h1>
        <p className="text-[14px] text-gray-500 max-w-lg mx-auto">
          Import a job spec, and AI will extract responsibilities,
          compare them against your current role model, and propose
          precise changes — all in under 60 minutes.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StepCard
          icon={<FileText size={20} weight="bold" />}
          step="1"
          title="Import"
          description="Paste a job spec or URL. AI extracts responsibilities, deliverables, and ownership domains."
        />
        <StepCard
          icon={<ArrowsClockwise size={20} weight="bold" />}
          step="2"
          title="Compare"
          description="See expected vs current side-by-side. AI highlights gaps, overlaps, and missing boundaries."
        />
        <StepCard
          icon={<ShieldCheck size={20} weight="bold" />}
          step="3"
          title="Decide"
          description="One-click to apply or dismiss each change. Every update requires your explicit confirmation."
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setStep("import")}
          className="w-full sm:w-auto rounded-md bg-blue-600 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Import a Job Spec
        </button>
        {roles.length > 0 && (
          <button
            onClick={() => setStep("import")}
            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Create Role Manually
          </button>
        )}
      </div>

      {/* Phase 2 teaser */}
      <div
        className={`${CARD_CLASSES} p-4 flex items-start gap-3`}
      >
        <Handshake size={20} weight="bold" className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5">
            Friction & Ownership Resolver
          </h3>
          <p className="text-[12px] text-gray-500">
            Detect ownership overlaps across your entire workspace,
            get AI-suggested handoff SLAs, and resolve conflicts with
            explicit confirmation.
          </p>
        </div>
      </div>

      {/* Existing sessions */}
      <ExistingSessions workspaceId={workspaceId} />
    </div>
  );
}

function StepCard({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className={`${CARD_CLASSES} p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
          {step}
        </div>
        <div className="text-gray-600">{icon}</div>
      </div>
      <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
      <p className="text-[12px] text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ExistingSessions({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const sessions = useClarityStore((s) => s.sessions);

  if (sessions.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Recent Sessions
      </h3>
      <div className="space-y-2">
        {sessions.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className={`${CARD_CLASSES} p-3 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors`}
          >
            <div>
              <p className="text-[13px] font-medium text-gray-900">
                {s.extractedTitle ?? "Untitled session"}
              </p>
              <p className="text-[11px] text-gray-400">
                {s.status} ·{" "}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    analyzing: "bg-amber-100 text-amber-700",
    compared: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    archived: "bg-gray-100 text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
