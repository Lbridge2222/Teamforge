"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle, ArrowCounterClockwise, House } from "@phosphor-icons/react";
import { CARD_CLASSES, BUTTON } from "@/lib/design-system";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className={`${CARD_CLASSES} p-8 max-w-md text-center space-y-4`}>
        <div className="h-12 w-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center">
          <WarningCircle size={24} weight="bold" className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className={BUTTON.primary}>
            <ArrowCounterClockwise size={16} weight="bold" />
            Try Again
          </button>
          <Link href="/dashboard" className={BUTTON.secondary}>
            <House size={16} weight="bold" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
