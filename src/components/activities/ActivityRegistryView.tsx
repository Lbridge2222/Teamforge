"use client";

import { useState, useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { BUTTON, CARD_CLASSES, INPUT_CLASSES, SELECT_CLASSES, LABEL_CLASSES } from "@/lib/design-system";
import { SummaryBar } from "./SummaryBar";
import { ActivityCategoryCard } from "./ActivityCategoryCard";
import { RoleCoverageSummary } from "./RoleCoverageSummary";
import { Modal } from "@/components/shared/Modal";
import {
  Plus,
  FolderPlus,
} from "@phosphor-icons/react/dist/ssr";
import { v4 as uuid } from "uuid";

type FilterType = "all" | "owned" | "shared" | "unowned" | "stretch";

export function ActivityRegistryView() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const categories = useWorkspaceStore((s) => s.categories);
  const activities = useWorkspaceStore((s) => s.activities);
  const activityAssignments = useWorkspaceStore((s) => s.activityAssignments);
  const stages = useWorkspaceStore((s) => s.stages);
  const progressions = useWorkspaceStore((s) => s.progressions);
  const addCategory = useWorkspaceStore((s) => s.addCategory);
  const addActivity = useWorkspaceStore((s) => s.addActivity);

  const [filter, setFilter] = useState<FilterType>("all");
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityCategoryId, setNewActivityCategoryId] = useState("");
  const [newActivityStageId, setNewActivityStageId] = useState("");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // ═══ Computed stats ═══
  const stats = useMemo(() => {
    const total = activities.length;
    let owned = 0;
    let shared = 0;
    let unowned = 0;

    activities.forEach((a) => {
      const assignmentCount = activityAssignments.filter(
        (aa) => aa.activityId === a.id
      ).length;
      if (assignmentCount === 0) unowned++;
      else if (assignmentCount === 1) owned++;
      else shared++;
    });

    // Calculate stretch: activities that appear in any progression's growthActivityIds
    const stretchActivityIds = new Set<string>();
    progressions.forEach((prog) => {
      const growthActivityIds = (prog.growthActivityIds as string[]) ?? [];
      growthActivityIds.forEach((actId) => stretchActivityIds.add(actId));
    });
    const stretch = stretchActivityIds.size;

    return { total, owned, shared, unowned, stretch };
  }, [activities, activityAssignments, progressions]);

  // ═══ Filtered activities ═══
  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    if (filter === "stretch") {
      // Filter to activities that are stretch goals
      const stretchActivityIds = new Set<string>();
      progressions.forEach((prog) => {
        const growthActivityIds = (prog.growthActivityIds as string[]) ?? [];
        growthActivityIds.forEach((actId) => stretchActivityIds.add(actId));
      });
      return activities.filter((a) => stretchActivityIds.has(a.id));
    }
    return activities.filter((a) => {
      const count = activityAssignments.filter(
        (aa) => aa.activityId === a.id
      ).length;
      if (filter === "unowned") return count === 0;
      if (filter === "owned") return count === 1;
      if (filter === "shared") return count >= 2;
      return true;
    });
  }, [activities, activityAssignments, progressions, filter]);

  // ═══ Group by category ═══
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories]);

  // ═══ Handlers ═══
  async function handleCreateCategory() {
    if (!newCategoryName.trim() || !workspace) return;
    const id = uuid();
    const cat = {
      id,
      workspaceId: workspace.id,
      name: newCategoryName.trim(),
      sortOrder: categories.length,
      belbinIdeal: [],
      belbinFitReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addCategory(cat);
    setShowNewCategory(false);
    setNewCategoryName("");

    fetch(`/api/workspaces/${workspace.id}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cat.name, sortOrder: cat.sortOrder }),
    });
  }

  async function handleCreateActivity() {
    if (!newActivityName.trim() || !newActivityCategoryId || !workspace) return;
    const id = uuid();
    const activity = {
      id,
      workspaceId: workspace.id,
      name: newActivityName.trim(),
      categoryId: newActivityCategoryId,
      stageId: newActivityStageId || null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addActivity(activity);
    setShowNewActivity(false);
    setNewActivityName("");
    setNewActivityCategoryId("");
    setNewActivityStageId("");
    setExpandedActivityId(id);

    fetch(`/api/workspaces/${workspace.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: activity.name,
        categoryId: activity.categoryId,
        stageId: activity.stageId,
      }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <SummaryBar
        stats={stats}
        filter={filter}
        onFilterChange={setFilter}
        onNewActivity={() => setShowNewActivity(true)}
      />

      {/* New Activity Form */}
      {showNewActivity && (
        <div className={`${CARD_CLASSES} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-gray-700">
              New Activity
            </span>
            <button
              onClick={() => setShowNewActivity(false)}
              className="text-gray-400 hover:text-gray-600 text-[12px] font-semibold"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateActivity()}
                placeholder="Activity name"
                className={INPUT_CLASSES}
                autoFocus
              />
            </div>
            <div>
              <select
                value={newActivityCategoryId}
                onChange={(e) => setNewActivityCategoryId(e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="">Category...</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={newActivityStageId}
                onChange={(e) => setNewActivityStageId(e.target.value)}
                className={SELECT_CLASSES + " flex-1"}
              >
                <option value="">Stage (optional)</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateActivity}
                disabled={!newActivityName.trim() || !newActivityCategoryId}
                className={BUTTON.primary + " shrink-0"}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Categories */}
      {sortedCategories.map((category) => {
        const catActivities = filteredActivities.filter(
          (a) => a.categoryId === category.id
        );
        return (
          <ActivityCategoryCard
            key={category.id}
            category={category}
            activities={catActivities}
            expandedActivityId={expandedActivityId}
            onToggleExpand={(id) =>
              setExpandedActivityId((prev) => (prev === id ? null : id))
            }
          />
        );
      })}

      {/* New Category Button */}
      {showNewCategory ? (
        <div className="flex gap-2 items-center">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleCreateCategory()
            }
            placeholder="Category name..."
            className={INPUT_CLASSES + " max-w-xs"}
            autoFocus
          />
          <button onClick={handleCreateCategory} className={BUTTON.primary + " !text-sm"}>
            Create
          </button>
          <button
            onClick={() => {
              setShowNewCategory(false);
              setNewCategoryName("");
            }}
            className={BUTTON.ghost + " !text-sm"}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewCategory(true)}
          className={BUTTON.secondary}
        >
          <FolderPlus size={16} weight="bold" />
          New Activity Bucket
        </button>
      )}

      {/* Role Coverage Summary */}
      <RoleCoverageSummary />
    </div>
  );
}
