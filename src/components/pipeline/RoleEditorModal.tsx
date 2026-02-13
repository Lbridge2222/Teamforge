"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/shared/Modal";
import {
  LABEL_CLASSES,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
  SELECT_CLASSES,
  BUTTON,
  ROLE_COLORS,
} from "@/lib/design-system";
import { BELBIN_ROLES } from "@/lib/frameworks/belbin";
import { ColorDot, Tag, Badge } from "@/components/shared/Badge";
import {
  Plus,
  Trash,
  X,
  FloppyDisk,
  PaintBucket,
} from "@phosphor-icons/react/dist/ssr";
import type {
  TeamRole,
  OwnershipCategory,
  SystemOwnership,
  BudgetLevel,
} from "@/lib/types";

type RoleEditorModalProps = {
  role: TeamRole | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: Partial<TeamRole>) => void;
};

const BUDGET_OPTIONS: { value: BudgetLevel; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Holds and controls budget allocation" },
  { value: "manager", label: "Manager", description: "Manages a portion of someone else's budget" },
  { value: "awareness", label: "Awareness", description: "Needs to know budget context, no control" },
  { value: "none", label: "None", description: "No budget involvement" },
];

const BELBIN_OPTIONS = Object.values(BELBIN_ROLES).map((r) => ({
  value: r.key,
  label: r.label,
  category: r.category,
}));

export function RoleEditorModal({
  role,
  open,
  onClose,
  onSave,
}: RoleEditorModalProps) {
  // ═══ Form State ═══
  const [jobTitle, setJobTitle] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [corePurpose, setCorePurpose] = useState("");
  const [cyclePosition, setCyclePosition] = useState("");
  const [cardSummary, setCardSummary] = useState("");
  const [keyDeliverables, setKeyDeliverables] = useState<string[]>(["", "", ""]);
  const [owns, setOwns] = useState<OwnershipCategory[]>([]);
  const [doesNotOwn, setDoesNotOwn] = useState<string[]>([]);
  const [contributesTo, setContributesTo] = useState<string[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [strengthProfile, setStrengthProfile] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("none");
  const [budgetNotes, setBudgetNotes] = useState("");
  const [belbinPrimary, setBelbinPrimary] = useState("");
  const [belbinSecondary, setBelbinSecondary] = useState("");
  const [notes, setNotes] = useState("");
  const [systemOwnership, setSystemOwnership] = useState<SystemOwnership | null>(null);

  // ═══ Temp inputs for list fields ═══
  const [newDoesNotOwn, setNewDoesNotOwn] = useState("");
  const [newContributesTo, setNewContributesTo] = useState("");
  const [newOutput, setNewOutput] = useState("");
  const [newStrength, setNewStrength] = useState("");

  // ═══ Hydrate from role ═══
  useEffect(() => {
    if (role) {
      setJobTitle(role.jobTitle ?? "");
      setColorIndex(role.colorIndex ?? 0);
      setCorePurpose(role.corePurpose ?? "");
      setCyclePosition(role.cyclePosition ?? "");
      setCardSummary(role.cardSummary ?? "");
      setKeyDeliverables(
        role.keyDeliverables && Array.isArray(role.keyDeliverables)
          ? [...(role.keyDeliverables as string[]), "", "", ""].slice(0, 3)
          : ["", "", ""]
      );
      setOwns((role.owns as OwnershipCategory[]) ?? []);
      setDoesNotOwn((role.doesNotOwn as string[]) ?? []);
      setContributesTo((role.contributesTo as string[]) ?? []);
      setOutputs((role.outputs as string[]) ?? []);
      setStrengthProfile((role.strengthProfile as string[]) ?? []);
      setBudgetLevel((role.budgetLevel as BudgetLevel) ?? "none");
      setBudgetNotes(role.budgetNotes ?? "");
      setBelbinPrimary(role.belbinPrimary ?? "");
      setBelbinSecondary(role.belbinSecondary ?? "");
      setNotes(role.notes ?? "");
      setSystemOwnership((role.systemOwnership as SystemOwnership) ?? null);
    } else {
      // New role defaults
      setJobTitle("");
      setColorIndex(0);
      setCorePurpose("");
      setCyclePosition("");
      setCardSummary("");
      setKeyDeliverables(["", "", ""]);
      setOwns([]);
      setDoesNotOwn([]);
      setContributesTo([]);
      setOutputs([]);
      setStrengthProfile([]);
      setBudgetLevel("none");
      setBudgetNotes("");
      setBelbinPrimary("");
      setBelbinSecondary("");
      setNotes("");
      setSystemOwnership(null);
    }
  }, [role, open]);

  const handleSave = useCallback(() => {
    const data: Partial<TeamRole> = {
      jobTitle: jobTitle.trim() || "Untitled Role",
      colorIndex,
      corePurpose: corePurpose || null,
      cyclePosition: cyclePosition || null,
      cardSummary: cardSummary || null,
      keyDeliverables: keyDeliverables.filter((d) => d.trim()) as any,
      owns: owns as any,
      doesNotOwn: doesNotOwn as any,
      contributesTo: contributesTo as any,
      outputs: outputs as any,
      strengthProfile: strengthProfile as any,
      budgetLevel: budgetLevel as any,
      budgetNotes: budgetNotes || null,
      belbinPrimary: belbinPrimary || null,
      belbinSecondary: belbinSecondary || null,
      notes: notes || null,
      systemOwnership: systemOwnership as any,
    };
    onSave(role?.id ?? null, data);
  }, [
    role,
    jobTitle,
    colorIndex,
    corePurpose,
    cyclePosition,
    cardSummary,
    keyDeliverables,
    owns,
    doesNotOwn,
    contributesTo,
    outputs,
    strengthProfile,
    budgetLevel,
    budgetNotes,
    belbinPrimary,
    belbinSecondary,
    notes,
    systemOwnership,
    onSave,
  ]);

  // ═══ Ownership category helpers ═══
  function addCategory() {
    setOwns((prev) => [...prev, { title: "", items: [] }]);
  }

  function updateCategoryTitle(index: number, title: string) {
    setOwns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, title } : c))
    );
  }

  function removeCategoryItem(catIndex: number, itemIndex: number) {
    setOwns((prev) =>
      prev.map((c, i) =>
        i === catIndex
          ? { ...c, items: c.items.filter((_, j) => j !== itemIndex) }
          : c
      )
    );
  }

  function addCategoryItem(catIndex: number, item: string) {
    if (!item.trim()) return;
    setOwns((prev) =>
      prev.map((c, i) =>
        i === catIndex ? { ...c, items: [...c.items, item.trim()] } : c
      )
    );
  }

  function removeCategory(index: number) {
    setOwns((prev) => prev.filter((_, i) => i !== index));
  }

  // ═══ List field add helper ═══
  function addToList(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    clearInput: React.Dispatch<React.SetStateAction<string>>
  ) {
    if (!value.trim()) return;
    setter((prev) => [...prev, value.trim()]);
    clearInput("");
  }

  function removeFromList(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {role ? "Edit Role" : "Create New Role"}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className={BUTTON.ghost}>
              Cancel
            </button>
            <button onClick={handleSave} className={BUTTON.primary}>
              <FloppyDisk size={16} weight="bold" />
              {role ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* ═══ BASICS ═══ */}
          <FormSection title="Basics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Job Title</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Sales Development Representative"
                  className={INPUT_CLASSES}
                  autoFocus
                />
              </div>

              <div>
                <label className={LABEL_CLASSES}>Colour</label>
                <div className="flex gap-2 items-center mt-1">
                  {ROLE_COLORS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setColorIndex(i)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        colorIndex === i
                          ? "border-gray-900 scale-105"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASSES}>Core Purpose</label>
              <textarea
                value={corePurpose}
                onChange={(e) => setCorePurpose(e.target.value)}
                placeholder="What is this role's reason for existing?"
                className={TEXTAREA_CLASSES}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Cycle Position</label>
                <input
                  value={cyclePosition}
                  onChange={(e) => setCyclePosition(e.target.value)}
                  placeholder="e.g., Top-of-funnel acquisition"
                  className={INPUT_CLASSES}
                />
              </div>
              <div>
                <label className={LABEL_CLASSES}>Card Summary</label>
                <input
                  value={cardSummary}
                  onChange={(e) => setCardSummary(e.target.value)}
                  placeholder="One-line summary for cards"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASSES}>
                Key Deliverables (up to 3)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {keyDeliverables.map((d, i) => (
                  <input
                    key={i}
                    value={d}
                    onChange={(e) =>
                      setKeyDeliverables((prev) =>
                        prev.map((v, j) => (j === i ? e.target.value : v))
                      )
                    }
                    placeholder={`Deliverable ${i + 1}`}
                    className={INPUT_CLASSES + " text-sm"}
                  />
                ))}
              </div>
            </div>
          </FormSection>

          {/* ═══ OWNERSHIP ═══ */}
          <FormSection title="Ownership">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL_CLASSES + " !mb-0"}>
                  Ownership Categories
                </label>
                <button
                  onClick={addCategory}
                  className={BUTTON.ghost + " !text-xs !px-2 !py-1"}
                >
                  <Plus size={12} weight="bold" />
                  Add Category
                </button>
              </div>
              <div className="space-y-3">
                {owns.map((cat, catIdx) => (
                  <OwnershipCategoryEditor
                    key={catIdx}
                    category={cat}
                    onTitleChange={(t) => updateCategoryTitle(catIdx, t)}
                    onRemoveItem={(i) => removeCategoryItem(catIdx, i)}
                    onAddItem={(item) => addCategoryItem(catIdx, item)}
                    onRemove={() => removeCategory(catIdx)}
                  />
                ))}
                {owns.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No ownership categories defined yet.
                  </p>
                )}
              </div>
            </div>

            {/* Does Not Own */}
            <ListEditor
              label="Does NOT Own"
              items={doesNotOwn}
              onAdd={(v) => addToList(setDoesNotOwn, v, setNewDoesNotOwn)}
              onRemove={(i) => removeFromList(setDoesNotOwn, i)}
              inputValue={newDoesNotOwn}
              onInputChange={setNewDoesNotOwn}
              placeholder="e.g., Pricing decisions"
              variant="danger"
            />

            {/* Contributes To */}
            <ListEditor
              label="Contributes To"
              items={contributesTo}
              onAdd={(v) =>
                addToList(setContributesTo, v, setNewContributesTo)
              }
              onRemove={(i) => removeFromList(setContributesTo, i)}
              inputValue={newContributesTo}
              onInputChange={setNewContributesTo}
              placeholder="e.g., Marketing alignment"
              variant="neutral"
            />

            {/* Outputs */}
            <ListEditor
              label="Outputs"
              items={outputs}
              onAdd={(v) => addToList(setOutputs, v, setNewOutput)}
              onRemove={(i) => removeFromList(setOutputs, i)}
              inputValue={newOutput}
              onInputChange={setNewOutput}
              placeholder="e.g., Weekly pipeline report"
              variant="info"
            />
          </FormSection>

          {/* ═══ STRENGTH & FRAMEWORKS ═══ */}
          <FormSection title="Strength & Frameworks">
            <ListEditor
              label="Strength Profile"
              items={strengthProfile}
              onAdd={(v) =>
                addToList(setStrengthProfile, v, setNewStrength)
              }
              onRemove={(i) => removeFromList(setStrengthProfile, i)}
              inputValue={newStrength}
              onInputChange={setNewStrength}
              placeholder="e.g., Relationship builder"
              variant="info"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Belbin Primary</label>
                <select
                  value={belbinPrimary}
                  onChange={(e) => setBelbinPrimary(e.target.value)}
                  className={SELECT_CLASSES}
                >
                  <option value="">Select...</option>
                  <optgroup label="Action-Oriented">
                    {BELBIN_OPTIONS.filter((o) => o.category === "Action").map(
                      (o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="People-Oriented">
                    {BELBIN_OPTIONS.filter((o) => o.category === "People").map(
                      (o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="Thinking-Oriented">
                    {BELBIN_OPTIONS.filter(
                      (o) => o.category === "Thinking"
                    ).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASSES}>Belbin Secondary</label>
                <select
                  value={belbinSecondary}
                  onChange={(e) => setBelbinSecondary(e.target.value)}
                  className={SELECT_CLASSES}
                >
                  <option value="">Select...</option>
                  <optgroup label="Action-Oriented">
                    {BELBIN_OPTIONS.filter((o) => o.category === "Action").map(
                      (o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="People-Oriented">
                    {BELBIN_OPTIONS.filter((o) => o.category === "People").map(
                      (o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="Thinking-Oriented">
                    {BELBIN_OPTIONS.filter(
                      (o) => o.category === "Thinking"
                    ).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </FormSection>

          {/* ═══ BUDGET ═══ */}
          <FormSection title="Budget Relationship">
            <div>
              <label className={LABEL_CLASSES}>Budget Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBudgetLevel(opt.value)}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      budgetLevel === opt.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-bold text-gray-800">
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASSES}>Budget Notes</label>
              <textarea
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                placeholder="Additional context about budget involvement..."
                className={TEXTAREA_CLASSES}
                rows={2}
              />
            </div>
          </FormSection>

          {/* ═══ SYSTEM OWNERSHIP ═══ */}
          <FormSection title="System Object Ownership">
            {systemOwnership ? (
              <SystemOwnershipEditor
                value={systemOwnership}
                onChange={setSystemOwnership}
                onRemove={() => setSystemOwnership(null)}
              />
            ) : (
              <button
                onClick={() =>
                  setSystemOwnership({
                    primaryObject: "",
                    objectDescription: "",
                    ownsUntil: "",
                    handsOffTo: "",
                    handoffTrigger: "",
                    whatLivesHere: [],
                    whatDoesNotLiveHere: [],
                  })
                }
                className={BUTTON.secondary + " !text-sm"}
              >
                <Plus size={14} weight="bold" />
                Add System Ownership
              </button>
            )}
          </FormSection>

          {/* ═══ NOTES ═══ */}
          <FormSection title="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Free text notes, context, tensions..."
              className={TEXTAREA_CLASSES}
              rows={4}
            />
          </FormSection>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-2 mb-4">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function OwnershipCategoryEditor({
  category,
  onTitleChange,
  onRemoveItem,
  onAddItem,
  onRemove,
}: {
  category: OwnershipCategory;
  onTitleChange: (title: string) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: (item: string) => void;
  onRemove: () => void;
}) {
  const [newItem, setNewItem] = useState("");
  const isProposed = category.title.toLowerCase().includes("(proposed)");

  return (
    <div
      className={`rounded-md border p-3 ${
        isProposed
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          value={category.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder='Category title (add "(proposed)" for pending changes)'
          className="flex-1 text-sm font-bold bg-transparent border-0 focus:outline-none text-gray-800 placeholder:text-gray-400"
        />
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash size={14} weight="bold" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {category.items.map((item, i) => (
          <Tag
            key={i}
            onRemove={() => onRemoveItem(i)}
            variant={isProposed ? "warning" : "success"}
          >
            {item}
          </Tag>
        ))}
      </div>

      <div className="flex gap-1">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddItem(newItem);
              setNewItem("");
            }
          }}
          placeholder="Add item..."
          className={INPUT_CLASSES + " !text-xs !py-1.5 flex-1"}
        />
        <button
          onClick={() => {
            onAddItem(newItem);
            setNewItem("");
          }}
          className={BUTTON.ghost + " !px-2 !py-1"}
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onAdd,
  onRemove,
  inputValue,
  onInputChange,
  placeholder,
  variant = "default",
}: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <div>
      <label className={LABEL_CLASSES}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <Tag key={i} onRemove={() => onRemove(i)} variant={variant}>
            {item}
          </Tag>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-gray-400 italic">
            None added yet
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(inputValue);
            }
          }}
          placeholder={placeholder}
          className={INPUT_CLASSES + " !text-sm flex-1"}
        />
        <button
          onClick={() => onAdd(inputValue)}
          className={BUTTON.ghost + " !px-2 !py-1.5"}
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function SystemOwnershipEditor({
  value,
  onChange,
  onRemove,
}: {
  value: SystemOwnership;
  onChange: (v: SystemOwnership) => void;
  onRemove: () => void;
}) {
  const [newDoesNotLive, setNewDoesNotLive] = useState("");

  function update(patch: Partial<SystemOwnership>) {
    onChange({ ...value, ...patch });
  }

  function addWhatLivesHere() {
    update({
      whatLivesHere: [
        ...value.whatLivesHere,
        { title: "", items: [] },
      ],
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">
          System Object Details
        </span>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-xs font-bold"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASSES}>Primary Object</label>
          <input
            value={value.primaryObject}
            onChange={(e) => update({ primaryObject: e.target.value })}
            placeholder='e.g., Opportunity (Salesforce)'
            className={INPUT_CLASSES + " text-sm"}
          />
        </div>
        <div>
          <label className={LABEL_CLASSES}>Hands Off To</label>
          <input
            value={value.handsOffTo}
            onChange={(e) => update({ handsOffTo: e.target.value })}
            placeholder="e.g., Customer Success Manager"
            className={INPUT_CLASSES + " text-sm"}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASSES}>Object Description</label>
        <textarea
          value={value.objectDescription}
          onChange={(e) => update({ objectDescription: e.target.value })}
          placeholder="What this object represents..."
          className={TEXTAREA_CLASSES + " text-sm"}
          rows={2}
        />
      </div>

      <div>
        <label className={LABEL_CLASSES}>Owns Until</label>
        <input
          value={value.ownsUntil}
          onChange={(e) => update({ ownsUntil: e.target.value })}
          placeholder="e.g., Opportunity closed-won and CS handoff complete"
          className={INPUT_CLASSES + " text-sm"}
        />
      </div>

      <div>
        <label className={LABEL_CLASSES}>Handoff Trigger</label>
        <input
          value={value.handoffTrigger}
          onChange={(e) => update({ handoffTrigger: e.target.value })}
          placeholder="e.g., Closed-won + implementation kickoff scheduled"
          className={INPUT_CLASSES + " text-sm"}
        />
      </div>

      {/* What lives here */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={LABEL_CLASSES + " !mb-0"}>
            What Lives Here
          </label>
          <button
            onClick={addWhatLivesHere}
            className={BUTTON.ghost + " !text-xs !px-2 !py-1"}
          >
            <Plus size={12} weight="bold" />
          </button>
        </div>
        {value.whatLivesHere.map((cat, i) => (
          <OwnershipCategoryEditor
            key={i}
            category={cat}
            onTitleChange={(t) =>
              update({
                whatLivesHere: value.whatLivesHere.map((c, j) =>
                  j === i ? { ...c, title: t } : c
                ),
              })
            }
            onRemoveItem={(itemIdx) =>
              update({
                whatLivesHere: value.whatLivesHere.map((c, j) =>
                  j === i
                    ? { ...c, items: c.items.filter((_, k) => k !== itemIdx) }
                    : c
                ),
              })
            }
            onAddItem={(item) =>
              update({
                whatLivesHere: value.whatLivesHere.map((c, j) =>
                  j === i ? { ...c, items: [...c.items, item] } : c
                ),
              })
            }
            onRemove={() =>
              update({
                whatLivesHere: value.whatLivesHere.filter((_, j) => j !== i),
              })
            }
          />
        ))}
      </div>

      {/* What does NOT live here */}
      <div>
        <label className={LABEL_CLASSES}>What Does NOT Live Here</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.whatDoesNotLiveHere.map((item, i) => (
            <Tag
              key={i}
              onRemove={() =>
                update({
                  whatDoesNotLiveHere: value.whatDoesNotLiveHere.filter(
                    (_, j) => j !== i
                  ),
                })
              }
              variant="danger"
            >
              {item}
            </Tag>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={newDoesNotLive}
            onChange={(e) => setNewDoesNotLive(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newDoesNotLive.trim()) {
                  update({
                    whatDoesNotLiveHere: [
                      ...value.whatDoesNotLiveHere,
                      newDoesNotLive.trim(),
                    ],
                  });
                  setNewDoesNotLive("");
                }
              }
            }}
            placeholder="e.g., Case notes"
            className={INPUT_CLASSES + " !text-sm flex-1"}
          />
          <button
            onClick={() => {
              if (newDoesNotLive.trim()) {
                update({
                  whatDoesNotLiveHere: [
                    ...value.whatDoesNotLiveHere,
                    newDoesNotLive.trim(),
                  ],
                });
                setNewDoesNotLive("");
              }
            }}
            className={BUTTON.ghost + " !px-2 !py-1.5"}
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
