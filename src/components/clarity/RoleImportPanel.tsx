"use client";

// ════════════════════════════════════════════
// RoleImportPanel — Paste or URL input for AI extraction
// ════════════════════════════════════════════

import { useState } from "react";
import { useClarityStore } from "@/lib/store/clarity-store";
import {
  ClipboardText,
  Link as LinkIcon,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { INPUT_CLASSES, TEXTAREA_CLASSES } from "@/lib/design-system";

export function RoleImportPanel({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setStep = useClarityStore((s) => s.setStep);
  const setSession = useClarityStore((s) => s.setSession);
  const isExtracting = useClarityStore((s) => s.isExtracting);
  const setIsExtracting = useClarityStore((s) => s.setIsExtracting);

  async function handleSubmit() {
    setError(null);

    if (mode === "paste" && text.trim().length < 20) {
      setError("Please paste at least a few sentences from the job spec.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setIsExtracting(true);
    setStep("extracting");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/clarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: mode,
          inputText: mode === "paste" ? text : undefined,
          inputUrl: mode === "url" ? url : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details ?? data.error ?? "Extraction failed");
      }

      const session = await res.json();
      setSession(session);
      setStep("review-extraction");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStep("import");
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Import a Job Specification
        </h2>
        <p className="text-[13px] text-gray-500">
          Paste the job description text or provide a URL. AI will
          extract responsibilities, deliverables, and ownership domains.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("paste")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            mode === "paste"
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ClipboardText size={14} weight="bold" />
          Paste Text
        </button>
        <button
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            mode === "url"
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LinkIcon size={14} weight="bold" />
          From URL
        </button>
      </div>

      {/* Input */}
      {mode === "paste" ? (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Job Specification Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={12}
            className={`${TEXTAREA_CLASSES} w-full`}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {text.length > 0 ? `${text.length} characters` : ""}
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Job Posting URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/jobs/product-manager"
            className={`${INPUT_CLASSES} w-full`}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Works with most job boards (LinkedIn, Indeed, Greenhouse, etc.)
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Warning size={16} weight="bold" className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isExtracting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isExtracting ? (
          <>
            <SpinnerGap size={16} weight="bold" className="animate-spin" />
            Extracting…
          </>
        ) : (
          "Extract with AI"
        )}
      </button>
    </div>
  );
}
