"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import {
  detectOwnershipOverlaps,
  detectGaps,
  calculateHealthScore,
  crossReferenceBoundaries,
  analyseBelbinActivityFit,
  detectBelbinMismatches,
  analyseBelbinComposition,
  summariseActivityAssignments,
} from "@/lib/analysis";
import { SanityTable } from "./SanityTable";
import { FunnelHealth } from "./FunnelHealth";
import { OwnershipOverlaps } from "./OwnershipOverlaps";
import { PotentialGaps } from "./PotentialGaps";
import { TensionsAggregation } from "./TensionsAggregation";
import { ResponsibilityMatrix } from "./ResponsibilityMatrix";
import { BoundaryMap } from "./BoundaryMap";
import { BelbinComposition } from "./BelbinComposition";
import { BelbinFitTable } from "./BelbinFitTable";
import { BelbinMismatches } from "./BelbinMismatches";

export function DiagnosticsDashboard() {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);
  const handoffs = useWorkspaceStore((s) => s.handoffs);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const stageAssignments = useWorkspaceStore((s) => s.stageAssignments);
  const categories = useWorkspaceStore((s) => s.categories);

  // Run all algorithms
  const overlaps = useMemo(() => detectOwnershipOverlaps(roles), [roles]);
  const gaps = useMemo(
    () =>
      detectGaps(stages, stageAssignments, handoffs, activities, activityAssignments),
    [stages, stageAssignments, handoffs, activities, activityAssignments]
  );
  const health = useMemo(
    () =>
      calculateHealthScore(
        roles,
        stages,
        stageAssignments,
        handoffs,
        activities,
        activityAssignments
      ),
    [roles, stages, stageAssignments, handoffs, activities, activityAssignments]
  );
  const boundaries = useMemo(
    () => crossReferenceBoundaries(roles),
    [roles]
  );
  const belbinFit = useMemo(
    () => analyseBelbinActivityFit(categories, roles),
    [categories, roles]
  );
  const belbinMismatches = useMemo(
    () =>
      detectBelbinMismatches(
        categories,
        activities,
        activityAssignments,
        roles
      ),
    [categories, activities, activityAssignments, roles]
  );
  const belbinComposition = useMemo(
    () => analyseBelbinComposition(roles),
    [roles]
  );

  return (
    <div className="space-y-6">
      {/* 9.1 Sanity Table */}
      <SanityTable />

      {/* 9.2 Funnel Health Score */}
      <FunnelHealth health={health} />

      {/* 9.3 Ownership Overlaps */}
      <OwnershipOverlaps overlaps={overlaps} />

      {/* 9.4 Potential Gaps */}
      <PotentialGaps gaps={gaps} />

      {/* 9.5 Tensions Aggregation */}
      <TensionsAggregation />

      {/* 9.6 Responsibility Matrix */}
      <ResponsibilityMatrix />

      {/* 9.7 Boundary Map */}
      <BoundaryMap boundaries={boundaries} />

      {/* 9.8 Belbin Team Composition */}
      <BelbinComposition composition={belbinComposition} />

      {/* 9.9 Belbin Activity Fit Table */}
      <BelbinFitTable fits={belbinFit} />

      {/* 9.10 Belbin Mismatch Warnings */}
      <BelbinMismatches mismatches={belbinMismatches} />
    </div>
  );
}
