"use client";

import { useState, useMemo } from "react";
import { SlideOut } from "@/components/shared/SlideOut";
import { ColorDot, Badge, Tag } from "@/components/shared/Badge";
import { ROLE_COLORS, LABEL_CLASSES, BUTTON } from "@/lib/design-system";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { RoleActivityModal } from "./RoleActivityModal";
import {
  PencilSimple,
  Trash,
  Database,
  ShieldCheck,
  ArrowRight,
  Coins,
  ListBullets,
  Target,
  Sparkle,
  Lightbulb,
  Warning,
  CheckCircle,
  Prohibit,
  Package,
  User,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import type { TeamRole, OwnershipCategory, SystemOwnership } from "@/lib/types";

type RoleDetailPanelProps = {
  role: TeamRole;
  open: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function RoleDetailPanel({
  role,
  open,
  onClose,
  onEdit,
  onDelete,
}: RoleDetailPanelProps) {
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const owns = (role.owns as OwnershipCategory[]) ?? [];
  const currentOwns = owns.filter(
    (c) => !c.title.toLowerCase().includes("(proposed)")
  );
  const proposedOwns = owns.filter((c) =>
    c.title.toLowerCase().includes("(proposed)")
  );
  const doesNotOwn = (role.doesNotOwn as string[]) ?? [];
  const contributesTo = (role.contributesTo as string[]) ?? [];
  const outputs = (role.outputs as string[]) ?? [];
  const strengthProfile = (role.strengthProfile as string[]) ?? [];
  const systemOwnership = role.systemOwnership as SystemOwnership | null;
  const keyDeliverables = (role.keyDeliverables as string[]) ?? [];
  const belbinPrimary = role.belbinPrimary
    ? BELBIN_ROLES[role.belbinPrimary]
    : null;
  const belbinSecondary = role.belbinSecondary
    ? BELBIN_ROLES[role.belbinSecondary]
    : null;

  // Activity coverage calculation
  const activityStats = useMemo(() => {
    const assignedActivityIds = activityAssignments
      .filter((aa) => aa.roleId === role.id)
      .map((aa) => aa.activityId);

    const total = assignedActivityIds.length;
    const solo = assignedActivityIds.filter((actId) => {
      const count = activityAssignments.filter((aa) => aa.activityId === actId).length;
      return count === 1;
    }).length;
    const shared = assignedActivityIds.filter((actId) => {
      const count = activityAssignments.filter((aa) => aa.activityId === actId).length;
      return count > 1;
    }).length;

    return { total, solo, shared };
  }, [role.id, activityAssignments]);

  return (
    <SlideOut open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <ColorDot colorIndex={role.colorIndex ?? 0} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {role.jobTitle}
          </h2>
          {role.cardSummary && (
            <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{role.cardSummary}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(role.id)}
            className={BUTTON.ghost + " !p-2"}
          >
            <PencilSimple size={18} weight="bold" />
          </button>
          <button
            onClick={() => onDelete(role.id)}
            className="rounded p-2 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Proposed changes banner */}
      {proposedOwns.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-[13px]">
            <Warning size={14} weight="bold" />
            Proposed Changes
          </div>
          <p className="text-[12px] text-amber-700 mt-1">
            This role has {proposedOwns.length} proposed ownership
            {proposedOwns.length > 1 ? " changes" : " change"}.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* Activity Coverage */}
        <Section
          icon={<ListBullets size={14} weight="bold" />}
          title="Activity Coverage"
        >
          <button
            onClick={() => setShowActivityModal(true)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-center flex-1">
                <div className="text-xl font-semibold text-gray-900 tabular-nums">
                  {activityStats.total}
                </div>
                <div className="text-[11px] text-gray-400 font-medium">Total</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-lg font-semibold text-emerald-600 tabular-nums">
                  {activityStats.solo}
                </div>
                <div className="text-[11px] text-gray-400 font-medium flex items-center justify-center gap-1">
                  <User size={10} weight="bold" />
                  Solo
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-lg font-semibold text-amber-600 tabular-nums">
                  {activityStats.shared}
                </div>
                <div className="text-[11px] text-gray-400 font-medium flex items-center justify-center gap-1">
                  <Users size={10} weight="bold" />
                  Shared
                </div>
              </div>
            </div>
            <p className="text-[11px] text-center text-gray-400 mt-2">Click to view details</p>
          </button>
        </Section>

        {/* Core Purpose */}
        {role.corePurpose && (
          <Section
            icon={<Target size={14} weight="bold" />}
            title="Core Purpose"
          >
            <p className="text-[13px] text-gray-600 leading-relaxed">{role.corePurpose}</p>
          </Section>
        )}

        {/* Cycle Position */}
        {role.cyclePosition && (
          <Section
            icon={<ArrowRight size={14} weight="bold" />}
            title="Cycle Position"
          >
            <p className="text-[13px] text-gray-600 leading-relaxed">{role.cyclePosition}</p>
          </Section>
        )}

        {/* Key Deliverables */}
        {keyDeliverables.length > 0 && (
          <Section
            icon={<Package size={14} weight="bold" />}
            title="Key Deliverables"
          >
            <div className="flex flex-wrap gap-1.5">
              {keyDeliverables.map((d, i) => (
                <Badge key={i} variant="info">
                  {d}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Belbin Roles */}
        {(belbinPrimary || belbinSecondary) && (
          <Section
            icon={<Sparkle size={14} weight="bold" />}
            title="Belbin Team Roles"
          >
            <div className="space-y-1.5">
              {belbinPrimary && (
                <div className="flex items-center gap-2">
                  <BelbinIcon roleKey={belbinPrimary.key} className="w-4 h-4 text-gray-600" />
                  <span className="text-[13px] font-semibold text-gray-700">
                    {belbinPrimary.label}
                  </span>
                  <Badge variant="default">Primary</Badge>
                </div>
              )}
              {belbinSecondary && (
                <div className="flex items-center gap-2">
                  <BelbinIcon roleKey={belbinSecondary.key} className="w-4 h-4 text-gray-600" />
                  <span className="text-[13px] font-semibold text-gray-700">
                    {belbinSecondary.label}
                  </span>
                  <Badge variant="neutral">Secondary</Badge>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* System Ownership */}
        {systemOwnership && (
          <Section
            icon={<Database size={14} weight="bold" />}
            title="System Ownership"
          >
            <div className="space-y-2 text-[13px]">
              <div>
                <span className="font-semibold text-gray-700">
                  {systemOwnership.primaryObject}
                </span>
                {systemOwnership.objectDescription && (
                  <p className="text-gray-500 mt-0.5">
                    {systemOwnership.objectDescription}
                  </p>
                )}
              </div>
              {systemOwnership.ownsUntil && (
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Owns until
                  </span>
                  <p className="text-gray-700">{systemOwnership.ownsUntil}</p>
                </div>
              )}
              {systemOwnership.handsOffTo && (
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Hands off to
                  </span>
                  <p className="text-gray-700">{systemOwnership.handsOffTo}</p>
                </div>
              )}
              {systemOwnership.handoffTrigger && (
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Trigger
                  </span>
                  <p className="text-gray-700">
                    {systemOwnership.handoffTrigger}
                  </p>
                </div>
              )}
              {systemOwnership.whatLivesHere?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                    What lives here
                  </span>
                  {systemOwnership.whatLivesHere.map((cat, i) => (
                    <div key={i} className="ml-2 mt-1">
                      <span className="font-medium text-gray-700">
                        {cat.title}
                      </span>
                      <ul className="list-disc list-inside text-gray-600 text-xs">
                        {cat.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {systemOwnership.whatDoesNotLiveHere?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
                    Does NOT live here
                  </span>
                  <ul className="list-disc list-inside text-gray-600 text-xs ml-2 mt-1">
                    {systemOwnership.whatDoesNotLiveHere.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Owns (Current) */}
        {currentOwns.length > 0 && (
          <Section
            icon={<CheckCircle size={14} weight="bold" />}
            title="Owns (Current)"
          >
            <div className="space-y-2">
              {currentOwns.map((cat, i) => (
                <div
                  key={i}
                  className="rounded-md border border-emerald-300 bg-emerald-50 p-2.5"
                >
                  <div className="text-[12px] font-semibold text-emerald-800">
                    {cat.title}
                  </div>
                  <ul className="list-disc list-inside text-[12px] text-emerald-700 mt-1 space-y-0.5">
                    {cat.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Proposed Ownership Changes */}
        {proposedOwns.length > 0 && (
          <Section
            icon={<Lightbulb size={14} weight="bold" />}
            title="Proposed Ownership Changes"
          >
            <div className="space-y-2">
              {proposedOwns.map((cat, i) => (
                <div
                  key={i}
                  className="rounded-md border border-amber-300 bg-amber-50 p-2.5"
                >
                  <div className="text-[12px] font-semibold text-amber-800">
                    {cat.title}
                  </div>
                  <ul className="list-disc list-inside text-[12px] text-amber-700 mt-1 space-y-0.5">
                    {cat.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Does NOT Own */}
        {doesNotOwn.length > 0 && (
          <Section
            icon={<Prohibit size={14} weight="bold" />}
            title="Does NOT Own"
          >
            <div className="rounded-md border border-red-300 bg-red-50 p-2.5">
              <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                {doesNotOwn.map((item, i) => (
                  <li key={i} className="font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* Contributes To */}
        {contributesTo.length > 0 && (
          <Section
            icon={<ListBullets size={14} weight="bold" />}
            title="Contributes To"
          >
            <div className="flex flex-wrap gap-1.5">
              {contributesTo.map((item, i) => (
                <Badge key={i} variant="neutral">
                  {item}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Outputs */}
        {outputs.length > 0 && (
          <Section
            icon={<Package size={14} weight="bold" />}
            title="Outputs"
          >
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {outputs.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Strength Profile */}
        {strengthProfile.length > 0 && (
          <Section
            icon={<Sparkle size={14} weight="bold" />}
            title="Strength Profile"
          >
            <div className="flex flex-wrap gap-1.5">
              {strengthProfile.map((item, i) => (
                <Badge key={i} variant="info">
                  {item}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Budget Level */}
        {role.budgetLevel && (
          <Section
            icon={<Coins size={14} weight="bold" />}
            title="Budget Level"
          >
            <Badge
              variant={
                role.budgetLevel === "owner"
                  ? "danger"
                  : role.budgetLevel === "manager"
                  ? "warning"
                  : role.budgetLevel === "awareness"
                  ? "info"
                  : "neutral"
              }
            >
              {role.budgetLevel.charAt(0).toUpperCase() +
                role.budgetLevel.slice(1)}
            </Badge>
            {role.budgetNotes && (
              <p className="text-xs text-gray-500 mt-1">{role.budgetNotes}</p>
            )}
          </Section>
        )}

        {/* Notes */}
        {role.notes && (
          <Section
            icon={<ListBullets size={14} weight="bold" />}
            title="Notes"
          >
            <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed">
              {role.notes}
            </p>
          </Section>
        )}
      </div>

      {/* Activity Modal */}
      <RoleActivityModal
        role={role}
        open={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
    </SlideOut>
  );
}

// ═════════════════
// Section helper
// ═════════════════

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-gray-500">{icon}</span>
        <span className={LABEL_CLASSES + " !mb-0"}>{title}</span>
      </div>
      {children}
    </div>
  );
}
