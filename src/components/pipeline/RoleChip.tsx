"use client";

import { useDraggable } from "@dnd-kit/core";
import { ColorDot, Badge } from "@/components/shared/Badge";
import { ROLE_COLORS } from "@/lib/design-system";
import { Database, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import type { TeamRole } from "@/lib/types";

type RoleChipProps = {
  role: TeamRole;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
};

export function RoleChip({ role, onClick, onEdit, compact = false }: RoleChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({ id: role.id });

  const hasProposedChanges = role.owns?.some((cat) =>
    cat.title.toLowerCase().includes("(proposed)")
  );
  const hasSystemOwnership = !!role.systemOwnership;
  const deliverables = (role.keyDeliverables ?? []).slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 cursor-pointer transition-all ${
        isDragging
          ? "opacity-40 scale-[0.98]"
          : "hover:border-gray-300 hover:shadow-sm"
      }`}
      onClick={onClick}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 -ml-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <DotsSixVertical size={14} weight="bold" />
      </button>

      {/* Colour dot */}
      <ColorDot colorIndex={role.colorIndex} size="sm" />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-900 truncate">
            {role.jobTitle}
          </span>
          {hasSystemOwnership && (
            <Database size={10} weight="bold" className="text-blue-500 shrink-0" />
          )}
        </div>
        {!compact && deliverables.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {deliverables.map((d, i) => (
              <span
                key={i}
                className="inline-block rounded bg-gray-50 border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Proposed changes indicator */}
      {hasProposedChanges && (
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      )}
    </div>
  );
}
