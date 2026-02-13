// ════════════════════════════════════════════
// Clarity Builder — Client State Store
// ════════════════════════════════════════════

import { create } from "zustand";
import type {
  ClaritySession,
  ClarityProposal,
  ClarityComment,
  TeamRole,
  GapAnalysisItem,
  OverlapAnalysisItem,
} from "@/lib/types";

// ── Phase 1: Comparison enriched data ──
type ClarityScoreDimensions = {
  purposeAlignment: number;
  boundaryClarity: number;
  deliverableCompleteness: number;
  overlapRisk: number;
  accountabilityClarity: number;
};

type ClarityScore = {
  overall: number;
  dimensions: ClarityScoreDimensions;
  interpretation: string;
};

type RACIIssue = {
  domain: string;
  issue: string;
  currentState: string;
  recommendation: string;
};

type ConversationNeeded = {
  with: string;
  about: string;
  why: string;
};

type ManagerBrief = {
  topPriority: string;
  quickWins: string[];
  conversationsNeeded: ConversationNeeded[];
  doNothingRisk: string;
};

type ImplementationPlan = {
  estimatedTime: string;
  suggestedSequence: string;
  biggestRisk: string;
};

// ── Phase 2: Overlap enriched data ──
type OverlapItem = {
  item: string;
  roles: {
    roleId: string;
    roleTitle: string;
    ownershipType: "primary" | "contributor" | "unclear";
    evidence?: string;
  }[];
  severity: "critical" | "warning" | "info";
  overlapType?: string;
  interdependenceType?: string;
  weeklyFrictionCost?: string;
  recommendation: string;
  suggestedOwner: string;
  ownershipRationale?: string;
  conversationNeeded?: boolean;
};

type GapItem = {
  item: string;
  category?: string;
  severity?: string;
  likelyOwner: string;
  reason: string;
  riskIfUnowned?: string;
};

type WorkspaceHealth = {
  overallScore: number;
  activeOverlapCount: number;
  criticalGapCount: number;
  estimatedWeeklyFrictionHours: number;
  topRiskStatement: string;
};

type StructuralInsight = {
  type: string;
  description: string;
  affectedRoles: string[];
  recommendation: string;
  priority: "high" | "medium" | "low";
};

type OverlapManagerBrief = {
  fixFirst: string;
  quickWins: string[];
  conversationsNeeded: {
    between: string[];
    about: string;
    suggestedOutcome: string;
  }[];
};

// ── Phase 2: Handoff enriched data ──
type HandoffSuggestion = {
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

type HandoffHealth = {
  coveredHandoffs: number;
  uncoveredHandoffs: number;
  highestRiskHandoff: string;
  estimatedWeeklyWaitHours: number;
};

type ProcessInsight = {
  type: string;
  description: string;
  affectedStages: string[];
  recommendation: string;
};

export type ClarityStep =
  | "welcome"
  | "import"
  | "select-role"
  | "extracting"
  | "review-extraction"
  | "comparing"
  | "comparison"
  | "proposals"
  | "done";

type ClarityStore = {
  // Navigation
  step: ClarityStep;
  setStep: (step: ClarityStep) => void;

  // Current session
  session: (ClaritySession & { role?: TeamRole | null }) | null;
  setSession: (
    session: (ClaritySession & { role?: TeamRole | null }) | null
  ) => void;

  // Session list
  sessions: ClaritySession[];
  setSessions: (sessions: ClaritySession[]) => void;

  // Phase 1: Comparison intelligence
  clarityScore: ClarityScore | null;
  setClarityScore: (score: ClarityScore | null) => void;
  raciIssues: RACIIssue[];
  setRACIIssues: (issues: RACIIssue[]) => void;
  managerBrief: ManagerBrief | null;
  setManagerBrief: (brief: ManagerBrief | null) => void;
  implementationPlan: ImplementationPlan | null;
  setImplementationPlan: (plan: ImplementationPlan | null) => void;

  // Proposals
  proposals: ClarityProposal[];
  setProposals: (proposals: ClarityProposal[]) => void;
  updateProposal: (id: string, updates: Partial<ClarityProposal>) => void;

  // Comments
  comments: ClarityComment[];
  setComments: (comments: ClarityComment[]) => void;
  addComment: (comment: ClarityComment) => void;

  // Phase 2: Overlap detection (enriched)
  workspaceHealth: WorkspaceHealth | null;
  workspaceOverlaps: OverlapItem[];
  workspaceGaps: GapItem[];
  structuralInsights: StructuralInsight[];
  overlapManagerBrief: OverlapManagerBrief | null;
  handoffSuggestions: HandoffSuggestion[];
  handoffHealth: HandoffHealth | null;
  processInsights: ProcessInsight[];
  setWorkspaceOverlaps: (data: {
    workspaceHealth?: WorkspaceHealth;
    overlaps: OverlapItem[];
    gaps: GapItem[];
    structuralInsights?: StructuralInsight[];
    managerBrief?: OverlapManagerBrief;
  }) => void;
  setHandoffSuggestions: (data: {
    handoffHealth?: HandoffHealth;
    suggestions: HandoffSuggestion[];
    processInsights?: ProcessInsight[];
  }) => void;

  // Loading states
  isExtracting: boolean;
  isComparing: boolean;
  isApplying: string | null; // proposalId being applied
  isDetectingOverlaps: boolean;
  isSuggestingHandoffs: boolean;
  setIsExtracting: (v: boolean) => void;
  setIsComparing: (v: boolean) => void;
  setIsApplying: (v: string | null) => void;
  setIsDetectingOverlaps: (v: boolean) => void;
  setIsSuggestingHandoffs: (v: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
};

export const useClarityStore = create<ClarityStore>((set) => ({
  step: "welcome",
  setStep: (step) => set({ step }),

  session: null,
  setSession: (session) => set({ session }),

  sessions: [],
  setSessions: (sessions) => set({ sessions }),

  // Phase 1: Comparison intelligence
  clarityScore: null,
  setClarityScore: (clarityScore) => set({ clarityScore }),
  raciIssues: [],
  setRACIIssues: (raciIssues) => set({ raciIssues }),
  managerBrief: null,
  setManagerBrief: (managerBrief) => set({ managerBrief }),
  implementationPlan: null,
  setImplementationPlan: (implementationPlan) => set({ implementationPlan }),

  proposals: [],
  setProposals: (proposals) => set({ proposals }),
  updateProposal: (id, updates) =>
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  comments: [],
  setComments: (comments) => set({ comments }),
  addComment: (comment) =>
    set((state) => ({ comments: [...state.comments, comment] })),

  // Phase 2: enriched overlap data
  workspaceHealth: null,
  workspaceOverlaps: [],
  workspaceGaps: [],
  structuralInsights: [],
  overlapManagerBrief: null,
  handoffSuggestions: [],
  handoffHealth: null,
  processInsights: [],
  setWorkspaceOverlaps: (data) =>
    set({
      workspaceHealth: data.workspaceHealth ?? null,
      workspaceOverlaps: data.overlaps,
      workspaceGaps: data.gaps,
      structuralInsights: data.structuralInsights ?? [],
      overlapManagerBrief: data.managerBrief ?? null,
    }),
  setHandoffSuggestions: (data) =>
    set({
      handoffHealth: data.handoffHealth ?? null,
      handoffSuggestions: data.suggestions,
      processInsights: data.processInsights ?? [],
    }),

  isExtracting: false,
  isComparing: false,
  isApplying: null,
  isDetectingOverlaps: false,
  isSuggestingHandoffs: false,
  setIsExtracting: (v) => set({ isExtracting: v }),
  setIsComparing: (v) => set({ isComparing: v }),
  setIsApplying: (v) => set({ isApplying: v }),
  setIsDetectingOverlaps: (v) => set({ isDetectingOverlaps: v }),
  setIsSuggestingHandoffs: (v) => set({ isSuggestingHandoffs: v }),

  error: null,
  setError: (error) => set({ error }),

  reset: () =>
    set({
      step: "welcome",
      session: null,
      clarityScore: null,
      raciIssues: [],
      managerBrief: null,
      implementationPlan: null,
      proposals: [],
      comments: [],
      workspaceHealth: null,
      workspaceOverlaps: [],
      workspaceGaps: [],
      structuralInsights: [],
      overlapManagerBrief: null,
      handoffSuggestions: [],
      handoffHealth: null,
      processInsights: [],
      isExtracting: false,
      isComparing: false,
      isApplying: null,
      isDetectingOverlaps: false,
      isSuggestingHandoffs: false,
      error: null,
    }),
}));
