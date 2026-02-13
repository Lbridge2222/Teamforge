"use client";

import { useDroppable } from "@dnd-kit/core";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { RoleChip } from "./RoleChip";
import { Badge } from "@/components/shared/Badge";
import { Database, Trash, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import type { Stage } from "@/lib/types";
import { useState } from "react";
import { toast } from "@/components/shared/Toast";

type PipelineStageProps = {
  stage: Stage;
  index: number;
  onSelectRole: (roleId: string) => void;
  onEditRole: (roleId: string) => void;
};

export function PipelineStage({
  stage,
  index,
  onSelectRole,
  onEditRole,
}: PipelineStageProps) {
  const getRolesForStage = useWorkspaceStore((s) => s.getRolesForStage);
  const updateStage = useWorkspaceStore((s) => s.updateStage);
  const removeStage = useWorkspaceStore((s) => s.removeStage);
  const roles = getRolesForStage(stage.id);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);

  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const systemObjects = roles
    .filter((r) => r.systemOwnership)
    .map((r) => (r.systemOwnership as any)?.primaryObject)
    .filter(Boolean);

  async function handleRename() {
    if (!editName.trim() || editName.trim() === stage.name) {
      setEditing(false);
      return;
    }
    updateStage(stage.id, { name: editName.trim() });
    setEditing(false);
    fetch(`/api/stages/${stage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete stage "${stage.name}"? Roles will be unassigned.`)) return;
    removeStage(stage.id);
    fetch(`/api/stages/${stage.id}`, { method: "DELETE" });
    toast.success("Stage deleted");
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] shrink-0 flex flex-col bg-white border border-gray-200 rounded-lg transition-colors ${
        isOver ? "border-blue-600 bg-blue-50" : ""
      }`}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-5 w-5 rounded bg-gray-200/80 flex items-center justify-center text-[10px] font-bold text-gray-500 tabular-nums">
              {index + 1}
            </span>

            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setEditName(stage.name);
                  }
                }}
                className="text-[13px] font-semibold text-gray-900 border-b-2 border-blue-600 bg-transparent outline-none px-0.5 w-full"
                autoFocus
              />
            ) : (
              <h3 className="text-[13px] font-semibold text-gray-900 truncate">{stage.name}</h3>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[10px] font-medium text-gray-400 mr-1 tabular-nums">
              {roles.length}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <PencilSimple size={12} weight="bold" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              <Trash size={12} weight="bold" />
            </button>
          </div>
        </div>

        {systemObjects.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Database size={10} weight="bold" className="text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-500">{systemObjects.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Column body */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {roles.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-md w-full">
              Drop roles here
            </div>
          </div>
        ) : (
          roles.map((role) => (
            <RoleChip
              key={role.id}
              role={role}
              onClick={() => onSelectRole(role.id)}
              onEdit={() => onEditRole(role.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
