"use client";

// ════════════════════════════════════════════
// Forge Wrapper — Client boundary for Forge components
// Renders the slide-out panel + floating button
// ════════════════════════════════════════════

import { ForgePanel } from "./ForgePanel";
import { ForgeFloatingButton } from "./ForgeTrigger";

export function ForgeWrapper() {
  return (
    <>
      <ForgePanel />
      <ForgeFloatingButton />
    </>
  );
}
