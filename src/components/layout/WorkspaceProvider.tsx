"use client";

import { useEffect, type ReactNode } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

export function WorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const setAll = useWorkspaceStore((s) => s.setAll);
  const loading = useWorkspaceStore((s) => s.loading);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (!res.ok) throw new Error("Failed to load workspace");
        const data = await res.json();
        setAll(data);
      } catch (error) {
        console.error("Failed to load workspace:", error);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
