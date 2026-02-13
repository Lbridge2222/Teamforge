"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { FrameworksPanel } from "./FrameworksPanel";
import { CareerLadder } from "./CareerLadder";
import { ProgressionCard } from "./ProgressionCard";
import { StretchGapAnalysis } from "./StretchGapAnalysis";
import { SectionHeader } from "@/components/shared/Badge";
import type { Tier, RoleProgression, TeamRole } from "@/lib/types";

const TIER_ORDER: Tier[] = ["director", "head", "lead", "senior", "mid", "entry"];

export function CareerArchitectureView() {
  const roles = useWorkspaceStore((s) => s.roles);
  const progressions = useWorkspaceStore((s) => s.progressions);

  // Map progressions to roles
  const rolesWithProgressions = useMemo(() => {
    return progressions
      .map((p) => {
        const role = roles.find((r) => r.id === p.roleId);
        if (!role) return null;
        return { role, progression: p };
      })
      .filter(Boolean) as { role: TeamRole; progression: RoleProgression }[];
  }, [roles, progressions]);

  // Sort by tier order
  const sorted = useMemo(() => {
    return [...rolesWithProgressions].sort((a, b) => {
      const aIdx = TIER_ORDER.indexOf((a.progression.tier as Tier) ?? "entry");
      const bIdx = TIER_ORDER.indexOf((b.progression.tier as Tier) ?? "entry");
      return aIdx - bIdx;
    });
  }, [rolesWithProgressions]);

  return (
    <div className="space-y-8">
      {/* Section 1: Frameworks Reference */}
      <FrameworksPanel />

      {/* Section 2: Career Ladder Visual */}
      <CareerLadder rolesWithProgressions={rolesWithProgressions} />

      {/* Section 3: Detailed Progression Cards */}
      <div>
        <SectionHeader
          title="Detailed Progression Cards"
          subtitle="Full framework analysis for each role"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sorted.map(({ role, progression }) => (
            <ProgressionCard
              key={role.id}
              role={role}
              progression={progression}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base font-semibold">No career progressions configured yet.</p>
            <p className="text-[13px] mt-1">
              Create progressions for roles to see the career architecture.
            </p>
          </div>
        )}
      </div>

      {/* Section 4: Stretch Activity Gap Analysis */}
      <StretchGapAnalysis rolesWithProgressions={rolesWithProgressions} />
    </div>
  );
}
