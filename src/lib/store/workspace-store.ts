import { create } from "zustand";
import type {
  Workspace,
  Stage,
  TeamRole,
  Handoff,
  ActivityCategory,
  Activity,
  ActivityAssignment,
  StageRoleAssignment,
  RoleProgression,
} from "@/lib/types";

type WorkspaceStore = {
  // Data
  workspace: Workspace | null;
  stages: Stage[];
  roles: TeamRole[];
  handoffs: Handoff[];
  categories: ActivityCategory[];
  activities: Activity[];
  activityAssignments: ActivityAssignment[];
  stageAssignments: StageRoleAssignment[];
  progressions: RoleProgression[];
  loading: boolean;
  
  // Cache management
  version: number;
  lastUpdated: number | null;
  error: string | null;

  // Actions
  setAll: (data: {
    workspace: Workspace;
    stages: Stage[];
    roles: TeamRole[];
    handoffs: Handoff[];
    categories: ActivityCategory[];
    activities: Activity[];
    activityAssignments: ActivityAssignment[];
    stageAssignments: StageRoleAssignment[];
    progressions: RoleProgression[];
  }) => void;
  
  // Cache management actions
  invalidate: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Stage actions
  addStage: (stage: Stage) => void;
  updateStage: (id: string, updates: Partial<Stage>) => void;
  removeStage: (id: string) => void;

  // Role actions
  addRole: (role: TeamRole) => void;
  updateRole: (id: string, updates: Partial<TeamRole>) => void;
  removeRole: (id: string) => void;

  // Stage-role assignment actions
  assignRoleToStage: (assignment: StageRoleAssignment) => void;
  unassignRoleFromStage: (stageId: string, roleId: string) => void;

  // Handoff actions
  addHandoff: (handoff: Handoff) => void;
  updateHandoff: (id: string, updates: Partial<Handoff>) => void;
  removeHandoff: (id: string) => void;

  // Category actions
  addCategory: (category: ActivityCategory) => void;
  updateCategory: (id: string, updates: Partial<ActivityCategory>) => void;
  removeCategory: (id: string) => void;

  // Activity actions
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;

  // Activity assignment actions
  setActivityAssignments: (activityId: string, roleIds: string[]) => void;
  addActivityAssignment: (assignment: ActivityAssignment) => void;
  removeActivityAssignment: (id: string) => void;

  // Progression actions
  addProgression: (progression: RoleProgression) => void;
  updateProgression: (id: string, updates: Partial<RoleProgression>) => void;
  removeProgression: (id: string) => void;

  // Derived data helpers
  getRolesForStage: (stageId: string) => TeamRole[];
  getUnassignedRoles: () => TeamRole[];
  getLeadershipRoles: () => TeamRole[];
  getAssignmentsForActivity: (activityId: string) => ActivityAssignment[];
  getProgressionForRole: (roleId: string) => RoleProgression | undefined;
};

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: null,
  stages: [],
  roles: [],
  handoffs: [],
  categories: [],
  activities: [],
  activityAssignments: [],
  stageAssignments: [],
  progressions: [],
  loading: true,
  version: 0,
  lastUpdated: null,
  error: null,

  invalidate: () =>
    set((s) => ({
      version: s.version + 1,
      lastUpdated: null,
    })),

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setAll: (data) =>
    set({
      ...data,
      stages: data.stages ?? [],
      roles: data.roles ?? [],
      handoffs: data.handoffs ?? [],
      categories: data.categories ?? [],
      activities: data.activities ?? [],
      activityAssignments: data.activityAssignments ?? [],
      stageAssignments: data.stageAssignments ?? [],
      progressions: data.progressions ?? [],
      loading: false,
      version: get().version + 1,
      lastUpdated: Date.now(),
      error: null,
    }),

  // ── Stages ──
  addStage: (stage) =>
    set((s) => ({ stages: [...s.stages, stage].sort((a, b) => a.sortOrder - b.sortOrder) })),
  updateStage: (id, updates) =>
    set((s) => ({
      stages: s.stages
        .map((st) => (st.id === id ? { ...st, ...updates } : st))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  removeStage: (id) =>
    set((s) => ({
      stages: s.stages.filter((st) => st.id !== id),
      stageAssignments: s.stageAssignments.filter((sa) => sa.stageId !== id),
      handoffs: s.handoffs.filter((h) => h.fromStageId !== id && h.toStageId !== id),
    })),

  // ── Roles ──
  addRole: (role) => set((s) => ({ roles: [...s.roles, role] })),
  updateRole: (id, updates) =>
    set((s) => ({
      roles: s.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  removeRole: (id) =>
    set((s) => ({
      roles: s.roles.filter((r) => r.id !== id),
      stageAssignments: s.stageAssignments.filter((sa) => sa.roleId !== id),
      activityAssignments: s.activityAssignments.filter((aa) => aa.roleId !== id),
    })),

  // ── Stage-Role Assignments ──
  assignRoleToStage: (assignment) =>
    set((s) => ({
      stageAssignments: [...s.stageAssignments, assignment],
    })),
  unassignRoleFromStage: (stageId, roleId) =>
    set((s) => ({
      stageAssignments: s.stageAssignments.filter(
        (sa) => !(sa.stageId === stageId && sa.roleId === roleId)
      ),
    })),

  // ── Handoffs ──
  addHandoff: (handoff) => set((s) => ({ handoffs: [...s.handoffs, handoff] })),
  updateHandoff: (id, updates) =>
    set((s) => ({
      handoffs: s.handoffs.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),
  removeHandoff: (id) =>
    set((s) => ({ handoffs: s.handoffs.filter((h) => h.id !== id) })),

  // ── Categories ──
  addCategory: (category) =>
    set((s) => ({
      categories: [...s.categories, category].sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  updateCategory: (id, updates) =>
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCategory: (id) =>
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

  // ── Activities ──
  addActivity: (activity) => set((s) => ({ activities: [...s.activities, activity] })),
  updateActivity: (id, updates) =>
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeActivity: (id) =>
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== id),
      activityAssignments: s.activityAssignments.filter((aa) => aa.activityId !== id),
    })),

  // ── Activity Assignments ──
  setActivityAssignments: (activityId, roleIds) =>
    set((s) => ({
      activityAssignments: [
        ...s.activityAssignments.filter((aa) => aa.activityId !== activityId),
        ...roleIds.map((roleId) => ({
          id: `temp-${activityId}-${roleId}`,
          activityId,
          roleId,
        })),
      ],
    })),
  addActivityAssignment: (assignment) =>
    set((s) => ({
      activityAssignments: [...s.activityAssignments, assignment],
    })),
  removeActivityAssignment: (id) =>
    set((s) => ({
      activityAssignments: s.activityAssignments.filter((aa) => aa.id !== id),
    })),

  // ── Progressions ──
  addProgression: (progression) =>
    set((s) => ({ progressions: [...s.progressions, progression] })),
  updateProgression: (id, updates) =>
    set((s) => ({
      progressions: s.progressions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removeProgression: (id) =>
    set((s) => ({ progressions: s.progressions.filter((p) => p.id !== id) })),

  // ── Derived Data ──
  getRolesForStage: (stageId) => {
    const state = get();
    const roleIds = state.stageAssignments
      .filter((sa) => sa.stageId === stageId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((sa) => sa.roleId);
    return roleIds
      .map((id) => state.roles.find((r) => r.id === id))
      .filter(Boolean) as TeamRole[];
  },

  getUnassignedRoles: () => {
    const state = get();
    const assignedRoleIds = new Set(state.stageAssignments.map((sa) => sa.roleId));
    return state.roles.filter(
      (r) => !assignedRoleIds.has(r.id) && (!r.overseesStageIds || r.overseesStageIds.length === 0)
    );
  },

  getLeadershipRoles: () => {
    const state = get();
    return state.roles.filter(
      (r) => r.overseesStageIds && r.overseesStageIds.length > 0
    );
  },

  getAssignmentsForActivity: (activityId) => {
    return get().activityAssignments.filter((aa) => aa.activityId === activityId);
  },

  getProgressionForRole: (roleId) => {
    return get().progressions.find((p) => p.roleId === roleId);
  },
}));
