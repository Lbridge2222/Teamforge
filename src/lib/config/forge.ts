// ════════════════════════════════════════════
// Forge Configuration — Quick prompts and AI settings
// ════════════════════════════════════════════

export type QuickPromptCategory = "analysis" | "creation" | "search" | "diagnostics";

export type QuickPrompt = {
  id: string;
  text: string;
  category: QuickPromptCategory;
  icon?: string;
};

/**
 * Default quick prompts for The Forge
 * These can be customized per workspace or org
 */
export const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "analyze-structure",
    text: "Analyse my team structure",
    category: "analysis",
  },
  {
    id: "create-role",
    text: "Help me create a new role",
    category: "creation",
  },
  {
    id: "find-gaps",
    text: "What gaps do you see?",
    category: "diagnostics",
  },
  {
    id: "suggest-pipeline",
    text: "Suggest a pipeline for my team",
    category: "creation",
  },
  {
    id: "search-role",
    text: "Search for a Product Manager role",
    category: "search",
  },
  {
    id: "belbin-balance",
    text: "How's our Belbin balance?",
    category: "diagnostics",
  },
];

/**
 * Forge AI model configuration
 */
export const FORGE_AI_CONFIG = {
  provider: process.env.AI_MODEL_PROVIDER || "gemini",
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.95,
  topK: 40,
} as const;

/**
 * Get quick prompts for a workspace
 * In the future, this could load custom prompts from DB
 */
export function getQuickPrompts(
  workspaceId?: string,
  customPrompts?: QuickPrompt[]
): QuickPrompt[] {
  // For now, return defaults
  // TODO: Load workspace-specific prompts from database
  return customPrompts || DEFAULT_QUICK_PROMPTS;
}

/**
 * System prompt configuration
 * Extract parts for easier customization
 */
export const SYSTEM_PROMPT_CONFIG = {
  identity: {
    name: "The Forge",
    role: "AI team architect",
    expertise: [
      "team psychologist",
      "career designer",
      "HR strategist",
    ],
    personality:
      "confident expertise but approachable warmth — like the best consultant someone's ever worked with",
  },

  frameworks: [
    "Belbin",
    "Radical Candor (Rock Star/Superstar)",
    "Hackman & Oldham's Job Characteristics",
    "RAPID decision rights",
    "Daniel Pink's Drive",
    "Lencioni's Working Genius",
  ],

  capabilities: [
    "Design Roles",
    "Analyse the Workspace",
    "Scrape & Research Roles",
    "Career Architecture",
    "Team Psychology",
    "Pipeline Design",
    "Create Things",
  ],

  tone: [
    "Direct, clear, insightful — never corporate jargon",
    "Reference frameworks naturally",
    "Use metaphors from forging, crafting, building",
    "When something is wrong, say so clearly",
    "Brief by default, expand only when asked",
    "Use markdown formatting",
  ],
} as const;
