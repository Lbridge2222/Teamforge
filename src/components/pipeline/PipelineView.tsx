"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { BUTTON, INPUT_CLASSES } from "@/lib/design-system";
import { LeadershipLayer } from "./LeadershipLayer";
import { PipelineStage } from "./PipelineStage";
import { HandoffZone } from "./HandoffZone";
import { UnassignedRoles } from "./UnassignedRoles";
import { RoleDetailPanel } from "./RoleDetailPanel";
import { RoleEditorModal } from "./RoleEditorModal";
import { toast } from "@/components/shared/Toast";
import { RoleTemplateBrowser } from "./RoleTemplateBrowser";
import { OrgChartView } from "./OrgChartView";
import { ColorDot } from "@/components/shared/Badge";
import { Plus, BookOpen, FunnelSimple, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import type { TeamRole } from "@/lib/types";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export function PipelineView() {
  const {
    workspace,
    stages,
    handoffs,
    addStage,
    assignRoleToStage,
    unassignRoleFromStage,
    roles,
    removeRole,
    activityAssignments,
  } = useWorkspaceStore();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [showAddStage, setShowAddStage] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pipeline" | "orgchart">("pipeline");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const editingRole = roles.find((r) => r.id === editingRoleId) ?? null;

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim() || !workspace) return;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStageName.trim(),
          sortOrder: stages.length,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create stage");
      }
      
      addStage(data.stage);
      setNewStageName("");
      setShowAddStage(false);
      toast.success("Stage created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create stage";
      toast.error(message);
      console.error("Create stage error:", err);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const roleId = active.id as string;
    const targetStageId = over.id as string;

    const currentAssignment = useWorkspaceStore
      .getState()
      .stageAssignments.find((sa) => sa.roleId === roleId);

    if (targetStageId === "unassigned") {
      if (currentAssignment) {
        unassignRoleFromStage(currentAssignment.stageId, roleId);
        fetch(`/api/stages/${currentAssignment.stageId}/assign`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId }),
        });
      }
      return;
    }

    if (currentAssignment?.stageId === targetStageId) return;

    if (currentAssignment) {
      unassignRoleFromStage(currentAssignment.stageId, roleId);
      fetch(`/api/stages/${currentAssignment.stageId}/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
    }

    assignRoleToStage({
      id: `temp-${Date.now()}`,
      stageId: targetStageId,
      roleId,
      sortOrder: 0,
    });
    fetch(`/api/stages/${targetStageId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
  }

  const draggedRole = activeDragId
    ? roles.find((r) => r.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("pipeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all ${
                  viewMode === "pipeline"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FunnelSimple size={13} weight="bold" />
                Pipeline
              </button>
              <button
                onClick={() => setViewMode("orgchart")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all ${
                  viewMode === "orgchart"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <TreeStructure size={13} weight="bold" />
                Org Chart
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200" />

            <span className="text-[12px] text-gray-400">
              {roles.length} role{roles.length !== 1 ? "s" : ""} &middot; {stages.length} stage{stages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className={BUTTON.secondary}
            >
              <BookOpen size={16} weight="bold" />
              Import from Library
            </button>
            <button
              onClick={() => setShowCreateRole(true)}
              className={BUTTON.primary}
            >
              <Plus size={16} weight="bold" />
              New Role
            </button>
          </div>
        </div>

        {viewMode === "orgchart" ? (
          <OrgChartView />
        ) : (
          <>
        {/* Unassigned roles tray */}
        <UnassignedRoles
          onSelectRole={setSelectedRoleId}
          onEditRole={setEditingRoleId}
        />

        {/* Leadership oversight */}
        <LeadershipLayer
          onSelectRole={setSelectedRoleId}
          onEditRole={setEditingRoleId}
        />

        {/* ═══ Horizontal Board ═══ */}
        <div className="board-scroll pb-4">
          <div className="flex gap-0 items-stretch min-h-[420px]">
            {stages.map((stage, index) => {
              const handoff =
                index < stages.length - 1
                  ? handoffs.find(
                      (h) =>
                        h.fromStageId === stage.id &&
                        h.toStageId === stages[index + 1]?.id
                    )
                  : null;

              return (
                <div key={stage.id} className="flex items-stretch">
                  <PipelineStage
                    stage={stage}
                    index={index}
                    onSelectRole={setSelectedRoleId}
                    onEditRole={setEditingRoleId}
                  />
                  {index < stages.length - 1 && (
                    <HandoffZone
                      handoff={handoff ?? null}
                      fromStage={stage}
                      toStage={stages[index + 1]}
                    />
                  )}
                </div>
              );
            })}

            {/* Add stage column */}
            <div className="flex items-stretch">
              {showAddStage ? (
                <div className="w-[280px] bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col justify-center">
                  <form onSubmit={handleCreateStage} className="space-y-3">
                    <input
                      type="text"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Stage name..."
                      className={INPUT_CLASSES}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button type="submit" className={BUTTON.primary + " flex-1"}>
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddStage(false);
                          setNewStageName("");
                        }}
                        className={BUTTON.ghost}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddStage(true)}
                  className="w-[280px] bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <Plus size={24} weight="bold" />
                  <span className="text-sm font-semibold">Add Stage</span>
                </button>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedRole && (
          <div className="flex items-center gap-2 bg-white border border-blue-600 rounded-md px-3 py-2 shadow-lg w-[260px]">
            <ColorDot colorIndex={draggedRole.colorIndex} size="sm" />
            <span className="text-sm font-bold truncate text-gray-900">
              {draggedRole.jobTitle}
            </span>
          </div>
        )}
      </DragOverlay>

      {/* Detail panel */}
      {selectedRole && (
        <RoleDetailPanel
          role={selectedRole}
          open={true}
          onClose={() => setSelectedRoleId(null)}
          onEdit={() => {
            setEditingRoleId(selectedRole.id);
            setSelectedRoleId(null);
          }}
          onDelete={(id) => {
            // Check if role has activities assigned
            const activityCount = activityAssignments.filter(
              (aa) => aa.roleId === id
            ).length;
            
            if (activityCount > 0) {
              const confirmed = confirm(
                `⚠️ Warning: This role owns ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}.\n\nDeleting this role will unassign all activities, leaving them without an owner.\n\nContinue?`
              );
              if (!confirmed) return;
            }

            removeRole(id);
            setSelectedRoleId(null);
            fetch(`/api/roles/${id}`, { method: "DELETE" });
          }}
        />
      )}

      {/* Role editor modal */}
      <RoleEditorModal
        role={editingRole}
        open={showCreateRole || !!editingRole}
        onClose={() => {
          setShowCreateRole(false);
          setEditingRoleId(null);
        }}
        onSave={async (id, data) => {
          if (id) {
            useWorkspaceStore.getState().updateRole(id, data);
            await fetch(`/api/roles/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
          } else {
            const res = await fetch(`/api/workspaces/${workspace?.id}/roles`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data, workspaceId: workspace?.id }),
            });
            if (res.ok) {
              const { role: newRole } = await res.json();
              useWorkspaceStore.getState().addRole(newRole);
            }
          }
          setShowCreateRole(false);
          setEditingRoleId(null);
        }}
      />

      {/* Role Template Browser */}
      {workspace && (
        <RoleTemplateBrowser
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
          workspaceId={workspace.id}
          onImported={async () => {
            try {
              const res = await fetch(`/api/workspaces/${workspace.id}`);
              if (res.ok) {
                const data = await res.json();
                useWorkspaceStore.getState().setAll(data);
              }
            } catch {
              window.location.reload();
            }
            toast.success("Roles imported from template library!");
          }}
        />
      )}
    </DndContext>
  );
}
