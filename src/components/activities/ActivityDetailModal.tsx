"use client";

import { useMemo } from "react";
import { Modal } from "@/components/shared/Modal";
import { Badge, ColorDot } from "@/components/shared/Badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { BelbinIcon } from "@/components/shared/BelbinIcon";
import { ListBullets, Users, Tag as TagIcon } from "@phosphor-icons/react/dist/ssr";
import type { Activity } from "@/lib/types";

type ActivityDetailModalProps = {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
};

export function ActivityDetailModal({
  activity,
  open,
  onClose,
}: ActivityDetailModalProps) {
  const roles = useWorkspaceStore((s) => s.roles);
  const stages = useWorkspaceStore((s) => s.stages);
  const categories = useWorkspaceStore((s) => s.categories);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);

  const category = useMemo(
    () => (activity ? categories.find((c) => c.id === activity.categoryId) : null),
    [activity, categories]
  );

  const stage = useMemo(
    () => (activity?.stageId ? stages.find((s) => s.id === activity.stageId) : null),
    [activity, stages]
  );

  const assignedRoles = useMemo(() => {
    if (!activity) return [];
    const roleIds = activityAssignments
      .filter((aa) => aa.activityId === activity.id)
      .map((aa) => aa.roleId);
    return roleIds.map((rid) => roles.find((r) => r.id === rid)).filter(Boolean);
  }, [activity, activityAssignments, roles]);

  const belbinIdeal = useMemo(
    () => ((category?.belbinIdeal as string[]) ?? []),
    [category]
  );

  if (!activity) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {activity.name}
          </h2>
          {category && (
            <p className="text-sm text-gray-500 mt-0.5">
              Category: {category.name}
            </p>
          )}
        </div>

        {/* Stage & Category */}
        <div className="flex items-center gap-2">
          {category && (
            <Badge variant="default">{category.name}</Badge>
          )}
          {stage && (
            <Badge variant="neutral">{stage.name}</Badge>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-bold text-gray-500 mb-1">Notes</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {activity.notes}
            </p>
          </div>
        )}

        {/* Belbin Ideal Fit */}
        {belbinIdeal.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-bold text-blue-700 mb-2">
              Belbin Best Fit
            </div>
            <div className="flex flex-wrap gap-2">
              {belbinIdeal.map((key) => {
                const b = BELBIN_ROLES[key];
                return b ? (
                  <Badge key={key} variant="info" className="flex items-center gap-1">
                    <BelbinIcon roleKey={key} className="w-3.5 h-3.5" weight="fill" />
                    {b.label}
                  </Badge>
                ) : null;
              })}
            </div>
            {category?.belbinFitReason && (
              <p className="text-xs text-blue-600 mt-2">
                {category.belbinFitReason}
              </p>
            )}
          </div>
        )}

        {/* Assigned Roles */}
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} weight="bold" className="text-gray-500" />
            <span className="text-xs font-bold text-gray-500">
              Assigned Roles
            </span>
            <Badge variant="neutral" className="ml-auto">
              {assignedRoles.length}
            </Badge>
          </div>

          {assignedRoles.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No roles assigned
            </div>
          ) : (
            <div className="space-y-2">
              {assignedRoles.map((role) => {
                if (!role) return null;
                
                // Check Belbin fit
                const hasFit = belbinIdeal.length > 0 && (
                  belbinIdeal.includes(role.belbinPrimary ?? "") ||
                  belbinIdeal.includes(role.belbinSecondary ?? "")
                );

                return (
                  <div
                    key={role.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded bg-gray-50"
                  >
                    <ColorDot colorIndex={role.colorIndex ?? 0} size="sm" />
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {role.jobTitle}
                    </span>
                    {hasFit && (
                      <Badge variant="success" className="text-[10px]">
                        ✓ FIT
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
