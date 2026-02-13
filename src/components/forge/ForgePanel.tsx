"use client";

// ════════════════════════════════════════════
// The Forge — Main Chat Panel
// Slide-out conversational AI interface
// ════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  PaperPlaneTilt,
  Lightning,
  ArrowClockwise,
  Trash,
  Robot,
  CircleNotch,
  Sparkle,
  Fire,
} from "@phosphor-icons/react/dist/ssr";
import { useForgeStore } from "@/lib/store/forge-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { ForgeMessageBubble } from "./ForgeMessageBubble";
import { ForgeQuickPrompts } from "./ForgeQuickPrompts";
import { BUTTON } from "@/lib/design-system";
import { v4 as uuid } from "uuid";

export function ForgePanel() {
  const {
    isOpen,
    close,
    messages,
    addMessage,
    conversationId,
    setConversationId,
    isStreaming,
    setIsStreaming,
    setError,
    clearConversation,
    updateLastAssistantMessage,
  } = useForgeStore();

  const workspace = useWorkspaceStore((s) => s.workspace);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !workspace || isStreaming) return;

      const userMessage = {
        id: uuid(),
        role: "user" as const,
        content: content.trim(),
      };

      addMessage(userMessage);
      setInput("");
      setIsStreaming(true);
      setError(null);

      // Add placeholder assistant message
      const assistantId = uuid();
      addMessage({ id: assistantId, role: "assistant", content: "" });

      const allMessages = [
        ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
        userMessage,
      ].map((m) => ({ role: m.role, content: m.content }));

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/forge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages,
            workspaceId: workspace.id,
            conversationId,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Forge error: ${res.status}`);
        }

        // Get conversation ID from response headers
        const newConvoId = res.headers.get("X-Forge-Conversation-Id");
        if (newConvoId && !conversationId) {
          setConversationId(newConvoId);
        }

        // Stream the response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // toTextStreamResponse returns plain text chunks
          accumulated += chunk;
          updateLastAssistantMessage(accumulated);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to reach The Forge"
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      workspace,
      isStreaming,
      messages,
      conversationId,
      addMessage,
      setIsStreaming,
      setError,
      setConversationId,
      updateLastAssistantMessage,
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleNewChat = () => {
    clearConversation();
  };

  // Refresh workspace data after AI modifications
  const refreshWorkspace = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`);
      if (res.ok) {
        const data = await res.json();
        useWorkspaceStore.getState().setAll(data);
      }
    } catch {
      // Silent refresh failure
    }
  }, [workspace]);

  // Auto-refresh workspace when streaming ends and there were tool calls
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.content) {
        // Refresh after AI response completes in case tools modified data
        refreshWorkspace();
      }
    }
  }, [isStreaming, messages, refreshWorkspace]);

  const hasMessages = messages.filter((m) => m.role !== "system").length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={close}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-gray-950 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Fire size={18} weight="fill" className="text-white" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-white tracking-wide">
                THE FORGE
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">
                AI Team Architect
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              title="New conversation"
            >
              <ArrowClockwise size={16} weight="bold" />
            </button>
            <button
              onClick={close}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
              {/* Forge emblem */}
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/30">
                  <Fire size={32} weight="fill" className="text-white" />
                </div>
                <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-gray-950 flex items-center justify-center">
                  <Sparkle size={8} weight="fill" className="text-white" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Ask The Forge
                </h3>
                <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
                  I&apos;m your AI team architect — part psychologist, part
                  career designer, part HR strategist. I can design roles,
                  analyse your org, and build your pipeline.
                </p>
              </div>

              {/* Quick prompts */}
              <ForgeQuickPrompts onSelect={sendMessage} />
            </div>
          ) : (
            <>
              {messages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((msg) => (
                  <ForgeMessageBubble key={msg.id} message={msg} />
                ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-[11px] text-orange-400/70">
                  <CircleNotch
                    size={12}
                    weight="bold"
                    className="animate-spin"
                  />
                  <span>The Forge is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-3">
          {hasMessages && !isStreaming && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
              <ForgeQuickPrompts onSelect={sendMessage} compact />
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask The Forge anything..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 pr-12 text-[13px] text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20 transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-500/20 p-2 text-orange-400 hover:bg-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <PaperPlaneTilt size={14} weight="fill" />
              </button>
            )}
          </form>

          <p className="mt-1.5 text-[9px] text-gray-700 text-center">
            The Forge can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  );
}
