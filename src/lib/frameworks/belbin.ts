// ════════════════════════════════════════════
// BELBIN TEAM ROLES — Reference Data
// Published academic work by Meredith Belbin
// ════════════════════════════════════════════

export type BelbinCategory = "Action" | "People" | "Thinking";

export type BelbinRole = {
  key: string;
  label: string;
  category: BelbinCategory;
  strength: string;
  allowableWeakness: string;
};

export const BELBIN_ROLES: Record<string, BelbinRole> = {
  // ── ACTION-ORIENTED ──
  shaper: {
    key: "shaper",
    label: "Shaper",
    category: "Action",
    strength:
      "Challenging, dynamic, thrives on pressure. Drives momentum and overcomes obstacles.",
    allowableWeakness:
      "Can be provocative and impatient. May hurt feelings.",
  },
  implementer: {
    key: "implementer",
    label: "Implementer",
    category: "Action",
    strength:
      "Disciplined, reliable, efficient. Turns ideas into practical actions.",
    allowableWeakness:
      "Can be inflexible. Slow to respond to new possibilities.",
  },
  completer_finisher: {
    key: "completer_finisher",
    label: "Completer Finisher",
    category: "Action",
    strength:
      "Painstaking, conscientious. Finds errors. Polishes and perfects.",
    allowableWeakness: "Can be a worrier. Reluctant to delegate.",
  },

  // ── PEOPLE-ORIENTED ──
  coordinator: {
    key: "coordinator",
    label: "Coordinator",
    category: "People",
    strength:
      "Mature, confident, trusting. Clarifies goals, delegates well, promotes decision-making.",
    allowableWeakness:
      "Can be seen as manipulative. Delegates personal work.",
  },
  teamworker: {
    key: "teamworker",
    label: "Teamworker",
    category: "People",
    strength:
      "Co-operative, perceptive, diplomatic. Listens, builds, averts friction.",
    allowableWeakness:
      "Can be indecisive in crunch situations. Avoids confrontation.",
  },
  resource_investigator: {
    key: "resource_investigator",
    label: "Resource Investigator",
    category: "People",
    strength:
      "Outgoing, enthusiastic, communicative. Explores opportunities and develops contacts.",
    allowableWeakness:
      "Can be over-optimistic. Loses interest once initial enthusiasm passes.",
  },

  // ── THINKING-ORIENTED ──
  plant: {
    key: "plant",
    label: "Plant",
    category: "Thinking",
    strength:
      "Creative, imaginative, free-thinking. Generates ideas and solves difficult problems.",
    allowableWeakness:
      "Ignores incidentals. Too preoccupied to communicate effectively.",
  },
  monitor_evaluator: {
    key: "monitor_evaluator",
    label: "Monitor Evaluator",
    category: "Thinking",
    strength:
      "Sober, strategic, discerning. Sees all options and judges accurately.",
    allowableWeakness:
      "Can lack drive and ability to inspire others. Overly critical.",
  },
  specialist: {
    key: "specialist",
    label: "Specialist",
    category: "Thinking",
    strength:
      "Single-minded, self-starting, dedicated. Provides knowledge in a narrow area.",
    allowableWeakness:
      "Contributes on a narrow front only. Dwells on technicalities.",
  },
};

export const BELBIN_ROLES_LIST = Object.values(BELBIN_ROLES);

export const BELBIN_BY_CATEGORY: Record<BelbinCategory, BelbinRole[]> = {
  Action: BELBIN_ROLES_LIST.filter((r) => r.category === "Action"),
  People: BELBIN_ROLES_LIST.filter((r) => r.category === "People"),
  Thinking: BELBIN_ROLES_LIST.filter((r) => r.category === "Thinking"),
};

// Category colours for UI
export const BELBIN_CATEGORY_COLORS: Record<BelbinCategory, string> = {
  Action: "bg-red-100 text-red-800 border-red-300",
  People: "bg-amber-100 text-amber-800 border-amber-300",
  Thinking: "bg-violet-100 text-violet-800 border-violet-300",
};
