"use client";

import { useDroppable } from "@dnd-kit/core";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { RoleChip } from "./RoleChip";
import { Collapsible } from "@/components/shared/Collapsible";
import { Tray, Info } from "@phosphor-icons/react/dist/ssr";

type UnassignedRolesProps = {
  onSelectRole: (id: string) => void;
  onEditRole: (id: string) => void;
};

export function UnassignedRoles({
  onSelectRole,
  onEditRole,
}: UnassignedRolesProps) {
  const getUnassignedRoles = useWorkspaceStore((s) => s.getUnassignedRoles);
  const unassigned = getUnassignedRoles();

  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div ref={setNodeRef}>
      <Collapsible
        title={
          <div className="flex items-center gap-2">
            <Tray size={14} weight="bold" />
            <span>Unassigned Roles</span>
            <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-semibold tabular-nums">
              {unassigned.length}
            </span>
          </div>
        }
        defaultOpen={unassigned.length > 0}
      >
        <div
          className={`min-h-[48px] rounded-md border border-dashed p-3 transition-colors ${
            isOver
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          {unassigned.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-3 text-gray-400">
              <Info size={14} weight="bold" />
              <span className="text-xs">
                All roles assigned. Drag a role here to unassign.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unassigned.map((role) => (
                <RoleChip
                  key={role.id}
                  role={role}
                  onClick={() => onSelectRole(role.id)}
                  onEdit={() => onEditRole(role.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
