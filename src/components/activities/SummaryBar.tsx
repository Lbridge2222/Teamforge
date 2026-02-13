"use client";

import { BUTTON } from "@/lib/design-system";
import { Plus } from "@phosphor-icons/react/dist/ssr";

type SummaryBarProps = {
  stats: {
    total: number;
    owned: number;
    shared: number;
    unowned: number;
    stretch: number;
  };
  filter: "all" | "owned" | "shared" | "unowned" | "stretch";
  onFilterChange: (filter: "all" | "owned" | "shared" | "unowned" | "stretch") => void;
  onNewActivity: () => void;
};

const FILTERS = [
  { key: "all" as const, label: "All", color: "bg-gray-600", activeColor: "bg-gray-800 text-white" },
  { key: "owned" as const, label: "Owned", color: "bg-emerald-500", activeColor: "bg-emerald-600 text-white" },
  { key: "shared" as const, label: "Shared", color: "bg-amber-500", activeColor: "bg-amber-500 text-white" },
  { key: "unowned" as const, label: "Unowned", color: "bg-red-500", activeColor: "bg-red-500 text-white" },
  { key: "stretch" as const, label: "Stretch", color: "bg-blue-500", activeColor: "bg-blue-500 text-white" },
];

export function SummaryBar({ stats, filter, onFilterChange, onNewActivity }: SummaryBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex items-center gap-6">
          <StatPill label="Total" value={stats.total} color="text-gray-900" />
          <div className="w-px h-5 bg-gray-200" />
          <StatPill label="Owned" value={stats.owned} color="text-emerald-600" />
          <StatPill label="Shared" value={stats.shared} color="text-amber-600" />
          <StatPill label="Unowned" value={stats.unowned} color="text-red-500" />
          <StatPill label="Stretch" value={stats.stretch} color="text-blue-600" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={onNewActivity} className={BUTTON.primary + " !text-sm"}>
            <Plus size={14} weight="bold" />
            New Activity
          </button>

          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {FILTERS.map((f) => {
              const count = f.key === "all" ? stats.total : stats[f.key];
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => onFilterChange(f.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    isActive
                      ? f.activeColor + ""
                      : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                      isActive ? "bg-white/30" : "bg-gray-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
