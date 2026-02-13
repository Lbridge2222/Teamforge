"use client";

// ════════════════════════════════════════════
// The Forge — Trigger Button
// Floating action button to open the Forge panel
// ════════════════════════════════════════════

import { Fire, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useForgeStore } from "@/lib/store/forge-store";

export function ForgeTrigger() {
  const { toggle, isOpen, messages, isStreaming } = useForgeStore();
  const hasMessages = messages.filter((m) => m.role !== "system").length > 0;

  return (
    <button
      onClick={toggle}
      className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
        isOpen
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
          : "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/20 hover:border-orange-500/40"
      }`}
    >
      <Fire
        size={14}
        weight="fill"
        className={isStreaming ? "animate-pulse" : ""}
      />
      <span className="hidden sm:inline">The Forge</span>

      {/* Notification dot */}
      {isStreaming && (
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
        </span>
      )}
    </button>
  );
}

// ── Floating Forge Button (alternative for mobile/bottom-right) ──
export function ForgeFloatingButton() {
  const { toggle, isOpen, isStreaming } = useForgeStore();

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
        isOpen
          ? "bg-gray-800 text-gray-400 scale-90"
          : "bg-gradient-to-br from-orange-500 to-amber-600 text-white hover:shadow-orange-500/40 hover:scale-105"
      }`}
    >
      <Fire
        size={22}
        weight="fill"
        className={isStreaming ? "animate-pulse" : ""}
      />

      {/* Glow ring */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
      )}
    </button>
  );
}
