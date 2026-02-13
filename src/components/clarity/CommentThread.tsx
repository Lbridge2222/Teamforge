"use client";

// ════════════════════════════════════════════
// CommentThread — Comment or approve role changes
// ════════════════════════════════════════════

import { useState } from "react";
import { useClarityStore } from "@/lib/store/clarity-store";
import {
  ChatCircle,
  ThumbsUp,
  ThumbsDown,
  PaperPlaneTilt,
} from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES, INPUT_CLASSES } from "@/lib/design-system";

export function CommentThread({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const session = useClarityStore((s) => s.session);
  const comments = useClarityStore((s) => s.comments);
  const addComment = useClarityStore((s) => s.addComment);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!session) return null;

  async function handleSubmit(isApproval: number = 0) {
    if (!text.trim() && isApproval === 0) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/clarity/${session!.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text.trim() || (isApproval === 1 ? "Approved" : "Rejected"),
            isApproval,
          }),
        }
      );

      if (res.ok) {
        const comment = await res.json();
        addComment(comment);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`${CARD_CLASSES} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <ChatCircle size={16} weight="bold" className="text-gray-500" />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 rounded-md bg-gray-50 p-2.5"
            >
              {c.isApproval === 1 ? (
                <ThumbsUp
                  size={14}
                  weight="fill"
                  className="text-emerald-500 mt-0.5"
                />
              ) : c.isApproval === -1 ? (
                <ThumbsDown
                  size={14}
                  weight="fill"
                  className="text-red-500 mt-0.5"
                />
              ) : (
                <ChatCircle
                  size={14}
                  weight="bold"
                  className="text-gray-400 mt-0.5"
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-gray-700">
                    {c.userEmail ?? "Team member"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(c.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-[12px] text-gray-600 mt-0.5">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className={`${INPUT_CLASSES} flex-1`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(0);
            }
          }}
        />
        <button
          onClick={() => handleSubmit(0)}
          disabled={sending || !text.trim()}
          className="rounded-md bg-gray-900 p-2 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          <PaperPlaneTilt size={14} weight="bold" />
        </button>
        <button
          onClick={() => handleSubmit(1)}
          disabled={sending}
          title="Approve these changes"
          className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
        >
          <ThumbsUp size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
