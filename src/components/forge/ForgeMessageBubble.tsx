"use client";

// ════════════════════════════════════════════
// The Forge — Message Bubble
// Renders a single chat message with markdown
// ════════════════════════════════════════════

import { Robot, User } from "@phosphor-icons/react/dist/ssr";
import type { ForgeMessage } from "@/lib/store/forge-store";

export function ForgeMessageBubble({ message }: { message: ForgeMessage }) {
  const isUser = message.role === "user";
  const isEmpty = !message.content?.trim();

  if (isEmpty) return null;

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md ${
          isUser
            ? "bg-blue-500/20 text-blue-400"
            : "bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400"
        }`}
      >
        {isUser ? (
          <User size={13} weight="bold" />
        ) : (
          <Robot size={13} weight="fill" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
          isUser
            ? "bg-blue-600/20 text-blue-100 border border-blue-500/10"
            : "bg-gray-800/60 text-gray-200 border border-gray-700/50"
        }`}
      >
        <ForgeMarkdown content={message.content} />
      </div>
    </div>
  );
}

// ── Simple Markdown Renderer ──
// Handles: **bold**, *italic*, `code`, ```blocks```, headers, lists, links
function ForgeMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = "";

  function processInline(text: string, key: string): React.ReactNode {
    // Process inline markdown
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partIndex = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(
            <span key={`${key}-${partIndex++}`}>
              {processBasicInline(remaining.slice(0, codeMatch.index))}
            </span>
          );
        }
        parts.push(
          <code
            key={`${key}-${partIndex++}`}
            className="rounded bg-gray-700/60 px-1.5 py-0.5 text-[11px] text-orange-300 font-mono"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(
          codeMatch.index + codeMatch[0].length
        );
        continue;
      }

      // No more inline code — process the rest
      parts.push(
        <span key={`${key}-${partIndex++}`}>
          {processBasicInline(remaining)}
        </span>
      );
      break;
    }

    return parts;
  }

  function processBasicInline(text: string): React.ReactNode {
    // Bold
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `line-${i}`;

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={key}
            className="my-2 rounded-lg bg-black/40 border border-gray-800 p-3 overflow-x-auto"
          >
            <code className="text-[11px] text-emerald-300 font-mono leading-relaxed">
              {codeBuffer.join("\n")}
            </code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={key} className="mt-3 mb-1 text-[12px] font-bold text-white">
          {processInline(line.slice(4), key)}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3
          key={key}
          className="mt-3 mb-1 text-[13px] font-bold text-orange-300"
        >
          {processInline(line.slice(3), key)}
        </h3>
      );
      continue;
    }

    // Lists
    if (line.match(/^[-*•] /)) {
      elements.push(
        <div key={key} className="flex gap-1.5 ml-1">
          <span className="text-orange-500/60 mt-px">•</span>
          <span>{processInline(line.slice(2), key)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={key} className="flex gap-1.5 ml-1">
            <span className="text-orange-500/60 font-mono text-[10px] mt-0.5 w-4 text-right">
              {match[1]}.
            </span>
            <span>{processInline(match[2], key)}</span>
          </div>
        );
        continue;
      }
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={key} className="h-2" />);
      continue;
    }

    // Regular text
    elements.push(
      <p key={key} className="leading-relaxed">
        {processInline(line, key)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}
