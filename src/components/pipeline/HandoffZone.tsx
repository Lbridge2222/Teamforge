"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Badge } from "@/components/shared/Badge";
import { INPUT_CLASSES, TEXTAREA_CLASSES, BUTTON } from "@/lib/design-system";
import {
  ArrowRight,
  Clock,
  Warning,
  PencilSimple,
  Plus,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { Handoff, Stage } from "@/lib/types";

type HandoffZoneProps = {
  handoff: Handoff | null;
  fromStage: Stage;
  toStage: Stage;
};

export function HandoffZone({ handoff, fromStage, toStage }: HandoffZoneProps) {
  const updateHandoff = useWorkspaceStore((s) => s.updateHandoff);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(handoff?.notes ?? "");
  const [sla, setSla] = useState(handoff?.sla ?? "");
  const [slaOwner, setSlaOwner] = useState(handoff?.slaOwner ?? "");
  const [dataHandoff, setDataHandoff] = useState(handoff?.dataHandoff ?? "");
  const [tensions, setTensions] = useState<string[]>(
    (handoff?.tensions as string[]) ?? []
  );
  const [newTension, setNewTension] = useState("");

  function handleSave() {
    if (!handoff) return;
    const updates = {
      notes: notes || null,
      sla: sla || null,
      slaOwner: slaOwner || null,
      dataHandoff: dataHandoff || null,
      tensions,
    };
    updateHandoff(handoff.id, updates);
    setEditing(false);

    fetch(`/api/handoffs/${handoff.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  function addTension() {
    if (!newTension.trim()) return;
    setTensions((prev) => [...prev, newTension.trim()]);
    setNewTension("");
  }

  // Collapsed connector between board columns
  if (!editing) {
    return (
      <div
        className="w-12 shrink-0 flex flex-col items-center justify-center relative cursor-pointer group"
        onClick={() => handoff && setEditing(true)}
      >
        {/* Arrow connector */}
        <div className="flex items-center">
          <div className="w-3 h-px bg-gray-300" />
          <ArrowRight size={14} weight="bold" className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          <div className="w-3 h-px bg-gray-300" />
        </div>

        {/* SLA indicator dot */}
        {handoff && (
          <div className="absolute bottom-4">
            {handoff.sla ? (
              <div className="h-2 w-2 rounded-full bg-emerald-500" title={handoff.sla} />
            ) : (
              <div className="h-2 w-2 rounded-full bg-red-400" title="No SLA set" />
            )}
          </div>
        )}

        {/* Tension count */}
        {handoff && (handoff.tensions as string[])?.length > 0 && (
          <div className="absolute top-4">
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 tabular-nums">
              {(handoff.tensions as string[]).length}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Expanded handoff editor — overlay panel
  return (
    <div className="w-12 shrink-0 relative">
      <div className="flex items-center justify-center h-full">
        <div className="w-3 h-px bg-gray-300" />
        <ArrowRight size={14} weight="bold" className="text-blue-600" />
        <div className="w-3 h-px bg-gray-300" />
      </div>

      {/* Editor popover */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[320px] bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-3" style={{ marginTop: '40px' }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-gray-500">
            {fromStage.name} → {toStage.name}
          </span>
          <button onClick={() => setEditing(false)} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={14} weight="bold" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happens at this handoff?"
            className={`${TEXTAREA_CLASSES} text-xs`}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">SLA</label>
            <input
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              placeholder="e.g., 4hrs"
              className={`${INPUT_CLASSES} text-xs`}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Owner</label>
            <input
              value={slaOwner}
              onChange={(e) => setSlaOwner(e.target.value)}
              placeholder="Role"
              className={`${INPUT_CLASSES} text-xs`}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Data Handoff</label>
          <input
            value={dataHandoff}
            onChange={(e) => setDataHandoff(e.target.value)}
            placeholder="e.g., Lead → Opportunity"
            className={`${INPUT_CLASSES} text-xs`}
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tensions</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {tensions.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 text-[11px] font-medium"
              >
                {t}
                <button
                  onClick={() => setTensions((prev) => prev.filter((_, j) => j !== i))}
                  className="hover:text-amber-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            <input
              value={newTension}
              onChange={(e) => setNewTension(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTension())}
              placeholder="Add tension..."
              className={`${INPUT_CLASSES} text-xs flex-1`}
            />
            <button onClick={addTension} className={BUTTON.ghost + " !px-2 !py-1"}>
              <Plus size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className={BUTTON.primary + " !text-xs !px-3 !py-1.5"}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
