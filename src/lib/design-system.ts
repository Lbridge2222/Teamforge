// ════════════════════════════════════════════
// DESIGN SYSTEM — Flat OS Design Tokens
// Flat, bold, no-shadow aesthetic inspired by IvyOS
// Clean borders, color-blocked sections, crisp type hierarchy
// ════════════════════════════════════════════

// Brand palette
export const COLORS = {
  primary: "#2563EB",     // blue-600 — actions, links
  secondary: "#10B981",   // emerald-500 — success, health
  warning: "#F59E0B",     // amber-500 — attention
  danger: "#EF4444",      // red-500 — problems
  surface: "#F8F8F8",     // warm gray — page background
  card: "#FFFFFF",        // white — card/panel backgrounds
  border: "#E2E2E2",      // neutral border
  text: "#1A1A1A",        // near-black — primary text
  textMuted: "#717171",   // mid-gray — secondary text
} as const;

// 8 role colours — bolder, more saturated for flat design
export const ROLE_COLORS = [
  { hex: "#2563EB", name: "Blue",    bg: "bg-blue-600",    text: "text-blue-600",    dot: "bg-blue-600" },
  { hex: "#059669", name: "Emerald", bg: "bg-emerald-600", text: "text-emerald-600", dot: "bg-emerald-600" },
  { hex: "#DC2626", name: "Red",     bg: "bg-red-600",     text: "text-red-600",     dot: "bg-red-600" },
  { hex: "#7C3AED", name: "Violet",  bg: "bg-violet-600",  text: "text-violet-600",  dot: "bg-violet-600" },
  { hex: "#D97706", name: "Amber",   bg: "bg-amber-600",   text: "text-amber-600",   dot: "bg-amber-600" },
  { hex: "#DB2777", name: "Pink",    bg: "bg-pink-600",     text: "text-pink-600",    dot: "bg-pink-600" },
  { hex: "#0891B2", name: "Cyan",    bg: "bg-cyan-600",     text: "text-cyan-600",    dot: "bg-cyan-600" },
  { hex: "#EA580C", name: "Orange",  bg: "bg-orange-600",   text: "text-orange-600",  dot: "bg-orange-600" },
] as const;

// Tier colours for career architecture — flat blocks
export const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  entry:    { bg: "bg-emerald-100",  text: "text-emerald-900", label: "Entry" },
  mid:      { bg: "bg-emerald-200", text: "text-emerald-900", label: "Mid" },
  senior:   { bg: "bg-amber-100",    text: "text-amber-900",   label: "Senior" },
  lead:     { bg: "bg-amber-200",   text: "text-amber-900",   label: "Lead" },
  head:     { bg: "bg-red-100",      text: "text-red-900",     label: "Head" },
  director: { bg: "bg-blue-100",     text: "text-blue-900",    label: "Director" },
};

// Growth track badges
export const GROWTH_TRACK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  steep:  { bg: "bg-amber-100",    text: "text-amber-900",   label: "Superstar — Steep Growth" },
  steady: { bg: "bg-emerald-100",  text: "text-emerald-900", label: "Rock Star — Steady Growth" },
  either: { bg: "bg-gray-100",     text: "text-gray-700",    label: "Either Track" },
};

// Autonomy bar segments
export const AUTONOMY_LEVELS = ["low", "moderate", "high", "full"] as const;

// ═══ Flat Card Classes — no shadows, single border, tight radius ═══
export const CARD_CLASSES =
  "bg-white border border-gray-200 rounded-lg";

export const CARD_CLASSES_HOVER =
  "bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-150";

export const CARD_CLASSES_ACTIVE =
  "bg-white border-2 border-blue-600 rounded-lg";

// Badge classes — flat pill, tight
export const BADGE_CLASSES =
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-tight";

// Button variants — flat, no shadows
export const BUTTON = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors",
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-red-700 active:bg-red-800 transition-colors",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors",
};

// Input classes — flat, subtle focus ring
export const INPUT_CLASSES =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";

export const TEXTAREA_CLASSES =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[80px]";

export const SELECT_CLASSES =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer";

export const LABEL_CLASSES =
  "block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5";
