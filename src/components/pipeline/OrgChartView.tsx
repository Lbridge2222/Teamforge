"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { ROLE_COLORS, CARD_CLASSES } from "@/lib/design-system";
import { ColorDot } from "@/components/shared/Badge";
import { RoleDetailPanel } from "./RoleDetailPanel";
import { RoleEditorModal } from "./RoleEditorModal";
import { toast } from "@/components/shared/Toast";
import {
  Crown,
  User,
  Users,
  TreeStructure,
  DotsSixVertical,
} from "@phosphor-icons/react/dist/ssr";
import type { TeamRole, Stage } from "@/lib/types";

export function OrgChartView() {
  const {
    workspace,
    stages,
    roles,
    stageAssignments,
    removeRole,
  } = useWorkspaceStore();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const editingRole = roles.find((r) => r.id === editingRoleId) ?? null;

  // Build hierarchy data
  const leadershipRoles = roles.filter(
    (r) =>
      r.overseesStageIds &&
      Array.isArray(r.overseesStageIds) &&
      (r.overseesStageIds as string[]).length > 0
  );

  const stageMap = new Map(stages.map((s) => [s.id, s]));
  const assignedRoleIds = new Set(stageAssignments.map((sa) => sa.roleId));
  const leadershipRoleIds = new Set(leadershipRoles.map((r) => r.id));

  const unassignedRoles = roles.filter(
    (r) => !assignedRoleIds.has(r.id) && !leadershipRoleIds.has(r.id)
  );

  function getRolesForStage(stageId: string): TeamRole[] {
    const roleIds = stageAssignments
      .filter((sa) => sa.stageId === stageId)
      .map((sa) => sa.roleId);
    return roleIds
      .map((id) => roles.find((r) => r.id === id))
      .filter(Boolean) as TeamRole[];
  }

  // Group leadership roles by their oversight span
  const sortedLeadership = [...leadershipRoles].sort((a, b) => {
    const aIds = (a.overseesStageIds as string[]) ?? [];
    const bIds = (b.overseesStageIds as string[]) ?? [];
    // More stages overseen = higher up
    if (bIds.length !== aIds.length) return bIds.length - aIds.length;
    const aFirst = aIds.length > 0 ? (stageMap.get(aIds[0])?.sortOrder ?? 999) : 999;
    const bFirst = bIds.length > 0 ? (stageMap.get(bIds[0])?.sortOrder ?? 999) : 999;
    return aFirst - bFirst;
  });

  return (
    <div className="space-y-6">
      {/* Chart title */}
      <div className="flex items-center gap-2">
        <TreeStructure size={16} weight="bold" className="text-gray-500" />
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Organisation Chart
        </h3>
        <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-semibold tabular-nums">
          {roles.length} role{roles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Org chart tree */}
      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center min-w-fit">
          {/* Leadership tier */}
          {sortedLeadership.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-6 flex-wrap justify-center">
                {sortedLeadership.map((role) => (
                  <OrgNode
                    key={role.id}
                    role={role}
                    variant="leadership"
                    onClick={() => setSelectedRoleId(role.id)}
                  />
                ))}
              </div>

              {/* Vertical connector */}
              <div className="w-px h-8 bg-gray-300" />

              {/* Horizontal connector bar */}
              {stages.length > 1 && (
                <div
                  className="h-px bg-gray-300"
                  style={{
                    width: `${Math.max(stages.length * 220, 200)}px`,
                  }}
                />
              )}
            </div>
          )}

          {/* Stages tier */}
          {stages.length > 0 && (
            <div className="flex gap-0 justify-center">
              {stages.map((stage) => {
                const stageRoles = getRolesForStage(stage.id);
                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: 220 }}
                  >
                    {/* Vertical connector from bar */}
                    {sortedLeadership.length > 0 && (
                      <div className="w-px h-6 bg-gray-300" />
                    )}

                    {/* Stage header card */}
                    <div className="bg-gray-900 text-white rounded-lg px-4 py-2 text-center min-w-[180px]">
                      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                        Stage {stages.indexOf(stage) + 1}
                      </div>
                      <div className="text-[13px] font-semibold mt-0.5">
                        {stage.name}
                      </div>
                    </div>

                    {/* Vertical connector to roles */}
                    {stageRoles.length > 0 && (
                      <div className="w-px h-5 bg-gray-300" />
                    )}

                    {/* Roles in this stage */}
                    {stageRoles.length > 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        {stageRoles.map((role, i) => (
                          <div key={role.id} className="flex flex-col items-center">
                            {i > 0 && (
                              <div className="w-px h-2 bg-gray-200 mb-2" />
                            )}
                            <OrgNode
                              role={role}
                              variant="role"
                              onClick={() => setSelectedRoleId(role.id)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded px-3 py-2">
                        No roles
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Unassigned roles */}
          {unassignedRoles.length > 0 && (
            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 w-full">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Users size={14} weight="bold" className="text-gray-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Unassigned
                </span>
                <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-semibold tabular-nums">
                  {unassignedRoles.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {unassignedRoles.map((role) => (
                  <OrgNode
                    key={role.id}
                    role={role}
                    variant="unassigned"
                    onClick={() => setSelectedRoleId(role.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {roles.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <TreeStructure size={48} weight="bold" className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No roles yet</p>
              <p className="text-xs mt-1">
                Create roles in Pipeline view and they&apos;ll appear here
              </p>
            </div>
          )}
        </div>
      </div>

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
            removeRole(id);
            setSelectedRoleId(null);
            fetch(`/api/roles/${id}`, { method: "DELETE" });
          }}
        />
      )}

      {/* Role editor */}
      <RoleEditorModal
        role={editingRole}
        open={!!editingRole}
        onClose={() => setEditingRoleId(null)}
        onSave={async (id, data) => {
          if (id) {
            useWorkspaceStore.getState().updateRole(id, data);
            await fetch(`/api/roles/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
          }
          setEditingRoleId(null);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// OrgNode — individual card in the org chart
// ═══════════════════════════════════════════════

type OrgNodeProps = {
  role: TeamRole;
  variant: "leadership" | "role" | "unassigned";
  onClick: () => void;
};

function OrgNode({ role, variant, onClick }: OrgNodeProps) {
  const color = ROLE_COLORS[role.colorIndex % ROLE_COLORS.length];

  const variantStyles = {
    leadership:
      "border-2 border-amber-400 bg-amber-50 min-w-[200px] shadow-sm hover:shadow-md hover:border-amber-500",
    role: "border border-gray-200 bg-white min-w-[180px] shadow-sm hover:shadow-md hover:border-blue-400",
    unassigned:
      "border border-dashed border-gray-300 bg-gray-50 min-w-[160px] opacity-70 hover:opacity-100 hover:border-gray-400 hover:bg-white",
  };

  return (
    <button
      onClick={onClick}
      className={`${variantStyles[variant]} rounded-lg px-4 py-3 text-left transition-all cursor-pointer group relative`}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar dot */}
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: color.hex + "20" }}
        >
          {variant === "leadership" ? (
            <Crown size={14} weight="bold" style={{ color: color.hex }} />
          ) : (
            <User size={14} weight="bold" style={{ color: color.hex }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-gray-900 truncate">
            {role.jobTitle}
          </div>
          {role.corePurpose && (
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              {role.corePurpose}
            </div>
          )}
        </div>
      </div>

      {/* Belbin + budget indicators */}
      <div className="flex items-center gap-1.5 mt-2">
        {role.belbinPrimary && (
          <span className="text-[9px] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 font-medium text-gray-500">
            {role.belbinPrimary}
          </span>
        )}
        {role.budgetLevel && role.budgetLevel !== "none" && (
          <span className="text-[9px] bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 font-medium text-blue-600">
            ${role.budgetLevel}
          </span>
        )}
      </div>
    </button>
  );
}
