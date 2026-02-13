"use client";

// ════════════════════════════════════════════
// /w/[workspaceId]/clarity — Role Clarity Builder page
// ════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClarityBuilder } from "@/components/clarity/ClarityBuilder";
import { OwnershipResolver } from "@/components/clarity/OwnershipResolver";
import { useClarityStore } from "@/lib/store/clarity-store";

export default function ClarityPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [tab, setTab] = useState<"clarity" | "resolver">("clarity");
  const setSessions = useClarityStore((s) => s.setSessions);

  // Load existing sessions on mount
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/clarity`
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch {
        // Ignore load errors
      }
    }
    loadSessions();
  }, [workspaceId, setSessions]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("clarity")}
          className={`px-4 py-2 text-[13px] font-semibold transition-colors border-b-2 ${
            tab === "clarity"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Role Clarity Builder
        </button>
        <button
          onClick={() => setTab("resolver")}
          className={`px-4 py-2 text-[13px] font-semibold transition-colors border-b-2 ${
            tab === "resolver"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Friction & Ownership Resolver
        </button>
      </div>

      {/* Tab content */}
      {tab === "clarity" && (
        <ClarityBuilder workspaceId={workspaceId} />
      )}
      {tab === "resolver" && (
        <OwnershipResolver workspaceId={workspaceId} />
      )}
    </div>
  );
}
