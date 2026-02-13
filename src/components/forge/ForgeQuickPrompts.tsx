"use client";

// ════════════════════════════════════════════
// The Forge — Quick Prompts
// Contextual suggestion chips
// ════════════════════════════════════════════

import { Lightning, MagnifyingGlass, ChartBar, UsersThree, Lightbulb, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import { useForgeStore } from "@/lib/store/forge-store";

const PROMPT_ICONS: Record<string, React.ReactNode> = {
  "Analyse": <ChartBar size={11} weight="bold" />,
  "Help": <Lightbulb size={11} weight="bold" />,
  "What": <ChartBar size={11} weight="bold" />,
  "Suggest": <TreeStructure size={11} weight="bold" />,
  "Search": <MagnifyingGlass size={11} weight="bold" />,
  "How": <UsersThree size={11} weight="bold" />,
};

function iconForPrompt(text: string) {
  for (const [prefix, icon] of Object.entries(PROMPT_ICONS)) {
    if (text.startsWith(prefix)) return icon;
  }
  return <Lightning size={11} weight="bold" />;
}

export function ForgeQuickPrompts({
  onSelect,
  compact = false,
}: {
  onSelect: (prompt: string) => void;
  compact?: boolean;
}) {
  const quickPrompts = useForgeStore((s) => s.quickPrompts);

  if (compact) {
    return (
      <>
        {quickPrompts.slice(0, 3).map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.text)}
            className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-gray-700/50 bg-gray-800/30 px-2.5 py-1 text-[10px] text-gray-400 hover:border-orange-500/30 hover:text-orange-300 transition-colors"
          >
            {iconForPrompt(prompt.text)}
            <span className="truncate max-w-[120px]">{prompt.text}</span>
          </button>
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-[360px]">
      {quickPrompts.map((prompt) => (
        <button
          key={prompt.id}
          onClick={() => onSelect(prompt.text)}
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2.5 text-left text-[11px] text-gray-400 hover:border-orange-500/30 hover:bg-gray-800/50 hover:text-orange-300 transition-all group"
        >
          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-md bg-gray-800 text-gray-500 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-colors">
            {iconForPrompt(prompt.text)}
          </span>
          <span className="leading-tight">{prompt.text}</span>
        </button>
      ))}
    </div>
  );
}
