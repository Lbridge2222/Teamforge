// ════════════════════════════════════════════
// Analysis Engine — All 10 Algorithms
// Pure functions: workspace data → diagnostics
// ════════════════════════════════════════════

import type {
  TeamRole,
  Stage,
  Handoff,
  Activity,
  ActivityAssignment,
  ActivityCategory,
  StageRoleAssignment,
  RoleProgression,
  OwnershipCategory,
} from "@/lib/types";
import { BELBIN_ROLES, type BelbinCategory } from "@/lib/frameworks/belbin";

// ════════════════════════════════════════════
// 10.1 Ownership Overlap Detection
// ════════════════════════════════════════════

export type OwnershipOverlap = {
  item: string;
  owners: string[];
};

export function detectOwnershipOverlaps(roles: TeamRole[]): OwnershipOverlap[] {
  // Filter to operational roles (no oversight)
  const operational = roles.filter(
    (r) =>
      !r.overseesStageIds ||
      !Array.isArray(r.overseesStageIds) ||
      (r.overseesStageIds as string[]).length === 0
  );

  const itemMap = new Map<string, Set<string>>();

  for (const role of operational) {
    const owns = (role.owns as OwnershipCategory[]) ?? [];
    for (const cat of owns) {
      for (const item of cat.items) {
        const normalised = item.toLowerCase().trim();
        if (!itemMap.has(normalised)) itemMap.set(normalised, new Set());
        itemMap.get(normalised)!.add(role.jobTitle ?? "Unknown");
      }
    }
  }

  const overlaps: OwnershipOverlap[] = [];
  for (const [item, owners] of itemMap) {
    if (owners.size > 1) {
      overlaps.push({ item, owners: [...owners] });
    }
  }

  return overlaps;
}

// ════════════════════════════════════════════
// 10.2 Gap Detection
// ════════════════════════════════════════════

export type GapDetectionResult = {
  emptyStages: Stage[];
  missingSlas: Handoff[];
  unassignedActivities: Activity[];
};

export function detectGaps(
  stages: Stage[],
  stageAssignments: StageRoleAssignment[],
  handoffs: Handoff[],
  activities: Activity[],
  activityAssignments: ActivityAssignment[]
): GapDetectionResult {
  const emptyStages = stages.filter(
    (s) => stageAssignments.filter((sa) => sa.stageId === s.id).length === 0
  );

  const missingSlas = handoffs.filter(
    (h) => !h.sla || h.sla.trim() === ""
  );

  const unassignedActivities = activities.filter(
    (a) =>
      activityAssignments.filter((aa) => aa.activityId === a.id).length === 0
  );

  return { emptyStages, missingSlas, unassignedActivities };
}

// ════════════════════════════════════════════
// 10.3 Health Score
// ════════════════════════════════════════════

export type HealthScore = {
  issueCount: number;
  slaRatio: string;
  staffingRatio: string;
  severity: "green" | "yellow" | "red";
};

export function calculateHealthScore(
  roles: TeamRole[],
  stages: Stage[],
  stageAssignments: StageRoleAssignment[],
  handoffs: Handoff[],
  activities: Activity[],
  activityAssignments: ActivityAssignment[]
): HealthScore {
  const overlaps = detectOwnershipOverlaps(roles);
  const gaps = detectGaps(
    stages,
    stageAssignments,
    handoffs,
    activities,
    activityAssignments
  );

  const issueCount =
    overlaps.length +
    gaps.emptyStages.length +
    gaps.missingSlas.length +
    gaps.unassignedActivities.length;

  const handoffsWithSla = handoffs.filter(
    (h) => h.sla && h.sla.trim() !== ""
  ).length;

  const stagesWithRoles = stages.filter(
    (s) => stageAssignments.filter((sa) => sa.stageId === s.id).length > 0
  ).length;

  const severity: "green" | "yellow" | "red" =
    issueCount === 0 ? "green" : issueCount <= 3 ? "yellow" : "red";

  return {
    issueCount,
    slaRatio: `${handoffsWithSla}/${handoffs.length}`,
    staffingRatio: `${stagesWithRoles}/${stages.length}`,
    severity,
  };
}

// ════════════════════════════════════════════
// 10.4 Boundary Cross-Reference
// ════════════════════════════════════════════

export type BoundaryCrossRef = {
  item: string;
  excludedBy: string;
  ownedBy: string | null;
};

export function crossReferenceBoundaries(
  roles: TeamRole[]
): BoundaryCrossRef[] {
  const operational = roles.filter(
    (r) =>
      !r.overseesStageIds ||
      !Array.isArray(r.overseesStageIds) ||
      (r.overseesStageIds as string[]).length === 0
  );

  const results: BoundaryCrossRef[] = [];

  for (const role of operational) {
    const doesNotOwn = (role.doesNotOwn as string[]) ?? [];
    for (const excludedItem of doesNotOwn) {
      const excludedWords = excludedItem
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      let ownedBy: string | null = null;

      for (const otherRole of operational) {
        if (otherRole.id === role.id) continue;
        const owns = (otherRole.owns as OwnershipCategory[]) ?? [];
        for (const cat of owns) {
          for (const ownedItem of cat.items) {
            const ownedLower = ownedItem.toLowerCase();
            const match = excludedWords.some(
              (word) => ownedLower.includes(word)
            );
            if (match) {
              ownedBy = otherRole.jobTitle ?? "Unknown";
              break;
            }
          }
          if (ownedBy) break;
        }
        if (ownedBy) break;
      }

      results.push({
        item: excludedItem,
        excludedBy: role.jobTitle ?? "Unknown",
        ownedBy,
      });
    }
  }

  return results;
}

// ════════════════════════════════════════════
// 10.5 Belbin Activity Fit Analysis
// ════════════════════════════════════════════

export type BelbinActivityFit = {
  category: string;
  idealTypes: string[];
  bestFitRoles: TeamRole[];
  reason: string | null;
};

export function analyseBelbinActivityFit(
  categories: ActivityCategory[],
  roles: TeamRole[]
): BelbinActivityFit[] {
  return categories
    .filter((c) => (c.belbinIdeal as string[])?.length > 0)
    .map((cat) => {
      const ideal = (cat.belbinIdeal as string[]) ?? [];
      const bestFitRoles = roles.filter(
        (r) =>
          ideal.includes(r.belbinPrimary ?? "") ||
          ideal.includes(r.belbinSecondary ?? "")
      );
      return {
        category: cat.name,
        idealTypes: ideal,
        bestFitRoles,
        reason: cat.belbinFitReason ?? null,
      };
    });
}

// ════════════════════════════════════════════
// 10.6 Belbin Mismatch Detection
// ════════════════════════════════════════════

export type BelbinMismatch = {
  role: TeamRole;
  category: string;
  idealTypes: string[];
};

export function detectBelbinMismatches(
  categories: ActivityCategory[],
  activities: Activity[],
  activityAssignments: ActivityAssignment[],
  roles: TeamRole[]
): BelbinMismatch[] {
  const results: BelbinMismatch[] = [];

  for (const cat of categories) {
    const ideal = (cat.belbinIdeal as string[]) ?? [];
    if (ideal.length === 0) continue;

    // Find all activities in this category
    const catActivityIds = activities
      .filter((a) => a.categoryId === cat.id)
      .map((a) => a.id);

    // Find unique assigned role IDs
    const assignedRoleIds = new Set(
      activityAssignments
        .filter((aa) => catActivityIds.includes(aa.activityId))
        .map((aa) => aa.roleId)
    );

    // Check each assigned role
    for (const roleId of assignedRoleIds) {
      const role = roles.find((r) => r.id === roleId);
      if (!role) continue;

      const primaryMatch = ideal.includes(role.belbinPrimary ?? "");
      const secondaryMatch = ideal.includes(role.belbinSecondary ?? "");

      if (!primaryMatch && !secondaryMatch) {
        results.push({
          role,
          category: cat.name,
          idealTypes: ideal,
        });
      }
    }
  }

  return results;
}

// ════════════════════════════════════════════
// 10.7 Belbin Team Composition Analysis
// ════════════════════════════════════════════

export type BelbinCompositionRole = {
  key: string;
  label: string;
  primaryCount: number;
  secondaryCount: number;
  hasCoverage: boolean;
};

export type BelbinCompositionCategory = {
  category: BelbinCategory;
  roles: BelbinCompositionRole[];
  uncoveredRoles: string[];
  totalAssignments: number;
};

export function analyseBelbinComposition(
  roles: TeamRole[]
): BelbinCompositionCategory[] {
  const categories: BelbinCategory[] = ["Action", "People", "Thinking"];

  return categories.map((category) => {
    const belbinInCategory = Object.values(BELBIN_ROLES).filter(
      (b) => b.category === category
    );

    const roleData = belbinInCategory.map((belbin) => {
      const primaryCount = roles.filter(
        (r) => r.belbinPrimary === belbin.key
      ).length;
      const secondaryCount = roles.filter(
        (r) => r.belbinSecondary === belbin.key
      ).length;
      return {
        key: belbin.key,
        label: belbin.label,
        primaryCount,
        secondaryCount,
        hasCoverage: primaryCount > 0 || secondaryCount > 0,
      };
    });

    const uncoveredRoles = roleData
      .filter((r) => !r.hasCoverage)
      .map((r) => r.label);

    const totalAssignments = roleData.reduce(
      (sum, r) => sum + r.primaryCount + r.secondaryCount,
      0
    );

    return {
      category,
      roles: roleData,
      uncoveredRoles,
      totalAssignments,
    };
  });
}

// ════════════════════════════════════════════
// 10.8 Stretch Activity Gap Analysis
// ════════════════════════════════════════════

export type StretchGap = {
  role: TeamRole;
  activity: Activity | undefined;
  activityId: string;
};

export function findStretchGaps(
  roles: TeamRole[],
  progressions: RoleProgression[],
  activities: Activity[],
  activityAssignments: ActivityAssignment[]
): StretchGap[] {
  const gaps: StretchGap[] = [];

  for (const prog of progressions) {
    const role = roles.find((r) => r.id === prog.roleId);
    if (!role) continue;

    const growthIds = (prog.growthActivityIds as string[]) ?? [];
    for (const actId of growthIds) {
      const isAssigned = activityAssignments.some(
        (aa) => aa.activityId === actId && aa.roleId === role.id
      );
      if (!isAssigned) {
        gaps.push({
          role,
          activity: activities.find((a) => a.id === actId),
          activityId: actId,
        });
      }
    }
  }

  return gaps;
}

// ════════════════════════════════════════════
// 10.9 Activity Assignment Summary
// ════════════════════════════════════════════

export type ActivitySummary = {
  total: number;
  owned: number;
  shared: number;
  unassigned: number;
};

export function summariseActivityAssignments(
  activities: Activity[],
  activityAssignments: ActivityAssignment[]
): ActivitySummary {
  const total = activities.length;
  let owned = 0;
  let shared = 0;
  let unassigned = 0;

  for (const act of activities) {
    const count = activityAssignments.filter(
      (aa) => aa.activityId === act.id
    ).length;
    if (count === 0) unassigned++;
    else if (count === 1) owned++;
    else shared++;
  }

  return { total, owned, shared, unassigned };
}

// ════════════════════════════════════════════
// 10.10 Role Activity Coverage
// ════════════════════════════════════════════

export type RoleCoverage = {
  role: TeamRole;
  totalActivities: number;
  soloOwned: number;
  shared: number;
  categories: string[];
};

export function analyseRoleCoverage(
  roles: TeamRole[],
  activities: Activity[],
  activityAssignments: ActivityAssignment[],
  categories: ActivityCategory[]
): RoleCoverage[] {
  return roles.map((role) => {
    const assignedActivityIds = activityAssignments
      .filter((aa) => aa.roleId === role.id)
      .map((aa) => aa.activityId);

    const totalActivities = assignedActivityIds.length;

    const soloOwned = assignedActivityIds.filter((actId) => {
      const count = activityAssignments.filter(
        (aa) => aa.activityId === actId
      ).length;
      return count === 1;
    }).length;

    const shared = assignedActivityIds.filter((actId) => {
      const count = activityAssignments.filter(
        (aa) => aa.activityId === actId
      ).length;
      return count > 1;
    }).length;

    const catIds = new Set(
      assignedActivityIds
        .map((actId) => activities.find((a) => a.id === actId)?.categoryId)
        .filter(Boolean) as string[]
    );

    const categoryNames = [...catIds]
      .map((cid) => categories.find((c) => c.id === cid)?.name)
      .filter(Boolean) as string[];

    return { role, totalActivities, soloOwned, shared, categories: categoryNames };
  });
}
