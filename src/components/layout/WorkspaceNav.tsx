"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FunnelSimple,
  ListChecks,
  Ladder,
  ChartBar,
  ShieldCheck,
  GearSix,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { ForgeTrigger } from "@/components/forge/ForgeTrigger";

const TABS = [
  { key: "pipeline", label: "Pipeline", icon: FunnelSimple },
  { key: "activities", label: "Activities", icon: ListChecks },
  { key: "career", label: "Career", icon: Ladder },
  { key: "clarity", label: "Clarity", icon: ShieldCheck },
  { key: "diagnostics", label: "Diagnostics", icon: ChartBar },
];

export function WorkspaceNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const activeTab = TABS.find((t) => pathname.includes(`/${t.key}`))?.key ?? "pipeline";

  return (
    <div className="sticky top-12 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          {/* Left: back + workspace name */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <h2 className="text-[13px] font-semibold text-gray-900 truncate max-w-[200px]">
              {workspace?.name ?? "Loading..."}
            </h2>
          </div>

          {/* Center: tabs */}
          <nav className="flex items-center gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/w/${workspaceId}/${tab.key}`}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <Icon size={14} weight={isActive ? "fill" : "bold"} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: forge + settings */}
          <div className="flex items-center gap-1.5">
            <ForgeTrigger />
            <Link
              href={`/w/${workspaceId}/settings`}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <GearSix size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
