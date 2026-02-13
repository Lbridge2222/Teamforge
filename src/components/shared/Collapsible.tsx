"use client";

import { useState, type ReactNode } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react/dist/ssr";

type CollapsibleProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  headerRight,
  className = "",
  align = "center",
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`items-center w-full py-1.5 min-h-[44px] hover:bg-gray-50/50 transition-colors group rounded-t-md select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-200 ${
          align === "center"
            ? "grid grid-cols-[1fr_auto_1fr]"
            : "flex justify-between pl-4"
        } ${isOpen ? "border-b border-gray-100" : "rounded-b-md"}`}
      >
        {align === "center" && (
          <div className="flex justify-start px-2"></div>
        )}

        {/* Title */}
        <div
          className={`flex items-center pointer-events-none ${
            align === "center" ? "justify-center" : "justify-start"
          }`}
        >
          <div className="pointer-events-auto">
            <span className="text-[15px] font-semibold text-gray-900">
              {title}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-1 pr-2">
          {headerRight && (
            <div
              className="flex items-center mr-1"
              onClick={(e) => e.stopPropagation()}
            >
              {headerRight}
            </div>
          )}
          <div className="p-1 rounded text-gray-400 group-hover:text-gray-600 transition-colors">
            {isOpen ? (
              <CaretDown size={14} weight="bold" />
            ) : (
              <CaretRight size={14} weight="bold" />
            )}
          </div>
        </div>
      </div>
      {isOpen && <div className="mt-0">{children}</div>}
    </div>
  );
}
