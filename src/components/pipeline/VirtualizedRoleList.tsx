// ════════════════════════════════════════════
// Virtualized Role List — For large workspaces
// ════════════════════════════════════════════

"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { RoleChip } from "./RoleChip";
import type { TeamRole } from "@/lib/types";

type VirtualizedRoleListProps = {
  stageId: string;
  onRoleClick?: (roleId: string) => void;
  onRoleEdit?: (roleId: string) => void;
  maxVisible?: number; // Show first N, then "+X more"
};

/**
 * Optimized role list that doesn't render all roles at once
 * For large stages with many roles
 */
export function VirtualizedRoleList({
  stageId,
  onRoleClick,
  onRoleEdit,
  maxVisible = 20,
}: VirtualizedRoleListProps) {
  const { getRolesForStage } = useWorkspaceStore();
  const roles = useMemo(() => getRolesForStage(stageId), [stageId, getRolesForStage]);

  const visibleRoles = roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  if (roles.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No roles assigned to this stage
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleRoles.map((role) => (
        <RoleChip
          key={role.id}
          role={role}
          onClick={() => onRoleClick?.(role.id)}
          onEdit={() => onRoleEdit?.(role.id)}
        />
      ))}
      
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-500 text-center py-2">
          + {hiddenCount} more role{hiddenCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

/**
 * Virtualized grid layout for many items
 * Uses CSS Grid with auto-flow for efficient rendering
 */
type VirtualizedGridProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  columns?: number;
  gap?: number;
  maxItems?: number;
};

export function VirtualizedGrid<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 3,
  gap = 16,
  maxItems = 100,
}: VirtualizedGridProps<T>) {
  const visibleItems = items.slice(0, maxItems);
  const hiddenCount = items.length - maxItems;

  return (
    <>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: `${gap}px`,
        }}
      >
        {visibleItems.map((item, index) => (
          <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
        ))}
      </div>
      
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-500 text-center py-4 mt-4 border-t">
          + {hiddenCount} more item{hiddenCount !== 1 ? "s" : ""} (scroll to load)
        </div>
      )}
    </>
  );
}
