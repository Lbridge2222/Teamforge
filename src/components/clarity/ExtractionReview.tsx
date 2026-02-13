"use client";

// ════════════════════════════════════════════
// ExtractionReview — Review AI-extracted role data & select target role
// ════════════════════════════════════════════

import { useState } from "react";
import { useClarityStore } from "@/lib/store/clarity-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  CheckCircle,
  ListBullets,
  Package,
  ShieldSlash,
  Star,
  UserCircle,
  CaretRight,
  SpinnerGap,
  Warning,
  ArrowsClockwise,
  HandPalm,
  Gauge,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES, ROLE_COLORS } from "@/lib/design-system";
import type { TeamRole } from "@/lib/types";

export function ExtractionReview({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const session = useClarityStore((s) => s.session);
  const step = useClarityStore((s) => s.step);
  const setStep = useClarityStore((s) => s.setStep);
  const setSession = useClarityStore((s) => s.setSession);
  const setProposals = useClarityStore((s) => s.setProposals);
  const setClarityScore = useClarityStore((s) => s.setClarityScore);
  const setRACIIssues = useClarityStore((s) => s.setRACIIssues);
  const setManagerBrief = useClarityStore((s) => s.setManagerBrief);
  const setImplementationPlan = useClarityStore((s) => s.setImplementationPlan);
  const isComparing = useClarityStore((s) => s.isComparing);
  const setIsComparing = useClarityStore((s) => s.setIsComparing);
  const setError = useClarityStore((s) => s.setError);

  const roles = useWorkspaceStore((s) => s.roles);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    session?.roleId ?? null
  );

  if (!session) return null;

  // Handle both old (string[]) and new (object[]) extraction formats
  const rawResponsibilities = (session.extractedResponsibilities as unknown[]) ?? [];
  const responsibilities = rawResponsibilities.map((r) =>
    typeof r === "string" ? { text: r, raciType: "responsible" as const, frequency: "unclear" as const, isCore: true } : (r as { text: string; raciType: string; frequency: string; isCore: boolean })
  );

  const rawDeliverables = (session.extractedDeliverables as unknown[]) ?? [];
  const deliverables = rawDeliverables.map((d) =>
    typeof d === "string" ? { text: d, measurable: false, suggestedMetric: null } : (d as { text: string; measurable: boolean; suggestedMetric: string | null })
  );

  const domains =
    (session.extractedOwnershipDomains as {
      title: string;
      items: string[];
      decisionRights?: string;
    }[]) ?? [];
  const doesNotOwn = (session.extractedDoesNotOwn as string[]) ?? [];
  const contributesTo = ((session as Record<string, unknown>).extractedContributesTo as string[]) ?? [];

  const rawSkills = (session.extractedSkills as unknown[]) ?? [];
  const skills = rawSkills.map((s) =>
    typeof s === "string" ? { text: s, category: "domain" as const, required: true } : (s as { text: string; category: string; required: boolean })
  );

  const ambiguities = ((session as Record<string, unknown>).extractedAmbiguities as { area: string; quote: string; risk: string; suggestedClarification: string }[]) ?? [];
  const redFlags = ((session as Record<string, unknown>).extractedRedFlags as string[]) ?? [];
  const autonomyLevel = (session as Record<string, unknown>).extractedAutonomyLevel as string | undefined;
  const spanOfInfluence = (session as Record<string, unknown>).extractedSpanOfInfluence as string | undefined;

  async function handleCompare() {
    if (!selectedRoleId) return;

    setIsComparing(true);
    setStep("comparing");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/${session!.id}/compare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: selectedRoleId }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.details ?? data.error ?? "Comparison failed"
        );
      }

      const data = await res.json();

      // Update session with comparison data
      setSession({
        ...session!,
        roleId: selectedRoleId,
        comparisonSummary: data.summary,
        gapAnalysis: data.gaps,
        overlapAnalysis: data.overlaps,
        status: "compared",
        role: roles.find((r) => r.id === selectedRoleId) ?? null,
      });

      // Store enriched comparison intelligence
      if (data.clarityScore) setClarityScore(data.clarityScore);
      if (data.raciIssues) setRACIIssues(data.raciIssues);
      if (data.managerBrief) setManagerBrief(data.managerBrief);
      if (data.implementationPlan) setImplementationPlan(data.implementationPlan);

      setProposals(data.proposals);
      setStep("comparison");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Comparison failed"
      );
      setStep("review-extraction");
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Extracted title & purpose */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {session.extractedTitle ?? "Extracted Role"}
        </h2>
        {session.extractedPurpose && (
          <p className="text-[13px] text-gray-500">
            {session.extractedPurpose}
          </p>
        )}
        {session.extractedTier && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 mt-2">
            Suggested tier: {session.extractedTier}
          </span>
        )}
      </div>

      {/* Autonomy & Span badges */}
      {(autonomyLevel || spanOfInfluence) && (
        <div className="flex flex-wrap gap-2">
          {autonomyLevel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] font-semibold text-indigo-700">
              <Gauge size={12} weight="bold" />
              Autonomy: {autonomyLevel}
            </span>
          )}
          {spanOfInfluence && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-semibold text-purple-700">
              <ArrowsClockwise size={12} weight="bold" />
              Span: {spanOfInfluence}
            </span>
          )}
        </div>
      )}

      {/* Red flags alert */}
      {redFlags.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <HandPalm size={16} weight="bold" className="text-red-600" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-red-700">
              Red Flags ({redFlags.length})
            </h3>
          </div>
          <ul className="space-y-1.5">
            {redFlags.map((flag, i) => (
              <li key={i} className="text-[12px] text-red-700 flex items-start gap-2">
                <Warning size={12} weight="bold" className="text-red-500 mt-0.5 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted data cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Responsibilities with RACI badges */}
        {responsibilities.length > 0 && (
          <div className={`${CARD_CLASSES} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <ListBullets size={16} weight="bold" className="text-blue-600" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Responsibilities ({responsibilities.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {responsibilities.map((r, i) => (
                <li key={i} className="text-[12px] text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-400 mt-1 shrink-0">·</span>
                  <div className="flex-1 min-w-0">
                    <span>{r.text}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <RACIBadge type={r.raciType} />
                      {r.isCore && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0 text-[9px] font-bold text-blue-700 uppercase">Core</span>
                      )}
                      {r.frequency && r.frequency !== "unclear" && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0 text-[9px] font-medium text-gray-500">{r.frequency}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deliverables with measurability */}
        {deliverables.length > 0 && (
          <div className={`${CARD_CLASSES} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} weight="bold" className="text-emerald-600" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Deliverables ({deliverables.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {deliverables.map((d, i) => (
                <li key={i} className="text-[12px] text-emerald-800 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-1 shrink-0">·</span>
                  <div className="flex-1 min-w-0">
                    <span>{d.text}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {d.measurable ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0 text-[9px] font-bold text-emerald-700">✓ Measurable</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-700">⚠ Not measurable</span>
                      )}
                      {d.suggestedMetric && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0 text-[9px] font-medium text-gray-600">
                          Metric: {d.suggestedMetric}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ownership Domains with decision rights */}
        {domains.length > 0 && (
          <div className={`${CARD_CLASSES} p-4 md:col-span-2`}>
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} weight="bold" className="text-violet-600" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Ownership Domains ({domains.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domains.map((d, i) => (
                <div key={i} className="rounded-md bg-violet-50 p-3">
                  <p className="text-[12px] font-semibold text-violet-800 mb-1">
                    {d.title}
                  </p>
                  {d.decisionRights && (
                    <p className="text-[10px] font-medium text-violet-500 mb-1.5 flex items-center gap-1">
                      <Star size={10} weight="fill" />
                      Decision rights: {d.decisionRights}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {d.items.map((item, j) => (
                      <li
                        key={j}
                        className="text-[12px] text-violet-700 flex items-start gap-1.5"
                      >
                        <span className="text-violet-400 mt-1">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Does Not Own */}
        {doesNotOwn.length > 0 && (
          <ExtractedSection
            icon={<ShieldSlash size={16} weight="bold" />}
            title="Does Not Own"
            items={doesNotOwn}
            color="red"
          />
        )}

        {/* Contributes To */}
        {contributesTo.length > 0 && (
          <ExtractedSection
            icon={<ArrowsClockwise size={16} weight="bold" />}
            title="Contributes To (Not Owns)"
            items={contributesTo}
            color="violet"
          />
        )}

        {/* Skills with categories */}
        {skills.length > 0 && (
          <div className={`${CARD_CLASSES} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} weight="bold" className="text-amber-600" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Key Skills ({skills.length})
              </h3>
            </div>
            <ul className="space-y-1.5">
              {skills.map((s, i) => (
                <li key={i} className="text-[12px] text-amber-800 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-1 shrink-0">·</span>
                  <div className="flex-1 min-w-0">
                    <span>{s.text}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0 text-[9px] font-medium text-amber-700">{s.category}</span>
                      {!s.required && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0 text-[9px] font-medium text-gray-500">Nice-to-have</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ambiguities requiring manager clarification */}
      {ambiguities.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Warning size={16} weight="bold" className="text-amber-600" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-amber-800">
              Ambiguities Requiring Clarification ({ambiguities.length})
            </h3>
          </div>
          <div className="space-y-3">
            {ambiguities.map((a, i) => (
              <div key={i} className="rounded-md bg-white border border-amber-100 p-3">
                <p className="text-[12px] font-semibold text-gray-900 mb-1">{a.area}</p>
                {a.quote && (
                  <p className="text-[11px] text-gray-400 italic mb-1">&quot;{a.quote}&quot;</p>
                )}
                <p className="text-[11px] text-amber-700 mb-1.5">
                  <span className="font-semibold">Risk:</span> {a.risk}
                </p>
                <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1">
                  <span className="font-semibold">Ask:</span> {a.suggestedClarification}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role selection */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-[13px] font-semibold text-gray-900 mb-1">
          Compare against which role?
        </h3>
        <p className="text-[12px] text-gray-500 mb-4">
          Select an existing role to compare, or create a new one from
          the extraction.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {roles.map((role) => (
            <RoleOption
              key={role.id}
              role={role}
              selected={selectedRoleId === role.id}
              onSelect={() => setSelectedRoleId(role.id)}
            />
          ))}
        </div>

        <button
          onClick={handleCompare}
          disabled={!selectedRoleId || isComparing}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isComparing ? (
            <>
              <SpinnerGap size={16} weight="bold" className="animate-spin" />
              Comparing…
            </>
          ) : (
            <>
              Compare Expected vs Current
              <CaretRight size={14} weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const RACI_COLORS: Record<string, { bg: string; text: string }> = {
  accountable: { bg: "bg-red-100", text: "text-red-700" },
  responsible: { bg: "bg-blue-100", text: "text-blue-700" },
  consulted: { bg: "bg-amber-100", text: "text-amber-700" },
  informed: { bg: "bg-gray-100", text: "text-gray-600" },
};

function RACIBadge({ type }: { type: string }) {
  const c = RACI_COLORS[type] ?? RACI_COLORS.responsible;
  return (
    <span className={`inline-flex items-center rounded-full ${c.bg} px-1.5 py-0 text-[9px] font-bold ${c.text} uppercase`}>
      {type.charAt(0)}
    </span>
  );
}

function ExtractedSection({
  icon,
  title,
  items,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: "blue" | "emerald" | "red" | "amber" | "violet";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-800", icon: "text-blue-600", dot: "text-blue-400" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-800", icon: "text-emerald-600", dot: "text-emerald-400" },
    red: { bg: "bg-red-50", text: "text-red-800", icon: "text-red-600", dot: "text-red-400" },
    amber: { bg: "bg-amber-50", text: "text-amber-800", icon: "text-amber-600", dot: "text-amber-400" },
    violet: { bg: "bg-violet-50", text: "text-violet-800", icon: "text-violet-600", dot: "text-violet-400" },
  };
  const c = colorMap[color];

  return (
    <div className={`${CARD_CLASSES} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={c.icon}>{icon}</span>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
          {title} ({items.length})
        </h3>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-[12px] ${c.text} flex items-start gap-1.5`}
          >
            <span className={`${c.dot} mt-1`}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleOption({
  role,
  selected,
  onSelect,
}: {
  role: TeamRole;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = ROLE_COLORS[role.colorIndex % ROLE_COLORS.length];

  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full shrink-0 ${color?.bg ?? "bg-gray-200"}`}
      />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-gray-900 truncate">
          {role.jobTitle}
        </p>
        {role.corePurpose && (
          <p className="text-[11px] text-gray-400 truncate">
            {role.corePurpose}
          </p>
        )}
      </div>
      {selected && (
        <CheckCircle
          size={18}
          weight="fill"
          className="text-blue-600 ml-auto shrink-0"
        />
      )}
    </button>
  );
}
