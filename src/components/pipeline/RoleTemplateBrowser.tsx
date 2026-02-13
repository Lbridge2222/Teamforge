"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/shared/Modal";
import {
  BUTTON,
  CARD_CLASSES,
  CARD_CLASSES_HOVER,
  CARD_CLASSES_ACTIVE,
  INPUT_CLASSES,
  BADGE_CLASSES,
  TIER_COLORS,
} from "@/lib/design-system";
import {
  MagnifyingGlass,
  Check,
  UserPlus,
  Briefcase,
  Lightning,
  SpinnerGap,
} from "@phosphor-icons/react/dist/ssr";

type RoleTemplate = {
  id: string;
  department: string;
  jobTitle: string;
  corePurpose: string | null;
  keyDeliverables: string[];
  strengthProfile: string[];
  belbinPrimary: string | null;
  belbinSecondary: string | null;
  tier: string | null;
  budgetLevel: string;
  activities: { category: string; items: string[] }[];
  tags: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onImported: () => void;
};

export function RoleTemplateBrowser({
  open,
  onClose,
  workspaceId,
  onImported,
}: Props) {
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/role-templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates ?? []);
        setDepartments(data.departments ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    let results = templates;
    if (selectedDept) {
      results = results.filter((t) => t.department === selectedDept);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (t) =>
          t.jobTitle.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.corePurpose?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.includes(q))
      );
    }
    return results;
  }, [templates, selectedDept, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, RoleTemplate[]>();
    for (const t of filtered) {
      const list = map.get(t.department) ?? [];
      list.push(t);
      map.set(t.department, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const t of filtered) next.add(t.id);
      return next;
    });
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleImport() {
    if (selectedIds.size === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/role-templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          templateIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error();
      const { imported } = await res.json();
      onImported();
      onClose();
      setSelectedIds(new Set());
      setSearch("");
      setSelectedDept(null);
    } catch {
      console.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  const totalActivities = useMemo(() => {
    let count = 0;
    for (const t of templates) {
      if (selectedIds.has(t.id)) {
        for (const cat of t.activities ?? []) {
          count += cat.items.length;
        }
      }
    }
    return count;
  }, [selectedIds, templates]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Role Templates"
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Search & filter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, departments, tags..."
              className={INPUT_CLASSES + " !pl-9"}
            />
          </div>
          <select
            value={selectedDept ?? ""}
            onChange={(e) => setSelectedDept(e.target.value || null)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Selection bar */}
        <div className="flex items-center justify-between py-2 px-1 text-xs text-gray-500 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">
              {selectedIds.size} selected
            </span>
            {selectedIds.size > 0 && (
              <span className="text-gray-400">
                ({totalActivities} activities)
              </span>
            )}
            <button
              onClick={selectAllVisible}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Select all visible ({filtered.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={deselectAll}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-gray-400">
            {filtered.length} of {templates.length} roles
          </span>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <SpinnerGap
                size={32}
                weight="bold"
                className="text-gray-400 animate-spin"
              />
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Briefcase size={40} weight="bold" className="mx-auto mb-2 opacity-50" />
              <p className="font-medium">No roles found</p>
              <p className="text-xs mt-1">Try a different search or department</p>
            </div>
          ) : (
            grouped.map(([dept, roles]) => (
              <div key={dept}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {dept}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {roles.length} role{roles.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {roles.map((t) => {
                    const selected = selectedIds.has(t.id);
                    const tierInfo = t.tier
                      ? TIER_COLORS[t.tier]
                      : null;
                    const actCount =
                      t.activities?.reduce(
                        (sum, c) => sum + c.items.length,
                        0
                      ) ?? 0;

                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleSelect(t.id)}
                        className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                          selected
                            ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {t.jobTitle}
                              </span>
                              {tierInfo && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierInfo.bg} ${tierInfo.text}`}
                                >
                                  {tierInfo.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {t.corePurpose}
                            </p>
                          </div>
                          <div
                            className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              selected
                                ? "bg-blue-600"
                                : "border border-gray-300"
                            }`}
                          >
                            {selected && (
                              <Check
                                size={12}
                                weight="bold"
                                className="text-white"
                              />
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {actCount > 0 && (
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                              {actCount} activities
                            </span>
                          )}
                          {t.belbinPrimary && (
                            <span className="text-[10px] font-medium text-violet-500 bg-violet-50 rounded-full px-2 py-0.5">
                              {t.belbinPrimary}
                            </span>
                          )}
                          {t.budgetLevel !== "none" && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                              Budget: {t.budgetLevel}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <button onClick={onClose} className={BUTTON.ghost}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || importing}
            className={BUTTON.primary + " min-w-[160px]"}
          >
            {importing ? (
              <>
                <SpinnerGap
                  size={16}
                  weight="bold"
                  className="animate-spin"
                />
                Importing...
              </>
            ) : (
              <>
                <UserPlus size={16} weight="bold" />
                Import {selectedIds.size} Role{selectedIds.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
