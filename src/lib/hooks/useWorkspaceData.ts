// ════════════════════════════════════════════
// Workspace Data Hook — Manages workspace loading with caching
// ════════════════════════════════════════════

import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { workspaceApi, unwrapResponse } from "@/lib/api";
import { toast } from "@/components/shared/Toast";

/**
 * Hook to load and manage workspace data with proper cache invalidation
 * 
 * @param workspaceId - The ID of the workspace to load
 * @param options - Configuration options
 * @returns Loading state and error
 */
export function useWorkspaceData(
  workspaceId: string | null,
  options?: {
    refetchInterval?: number;
    onError?: (error: string) => void;
  }
) {
  const {
    setAll,
    loading,
    error,
    setError,
    setLoading,
    version,
    invalidate,
  } = useWorkspaceStore();

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadWorkspace() {
      try {
        setLoading(true);
        setError(null);

        const response = await workspaceApi.getWorkspace(workspaceId!);

        if (cancelled) return;

        if (!response.success) {
          setError(response.error.message);
          options?.onError?.(response.error.message);
          toast.error("Failed to load workspace");
          return;
        }

        setAll(response.data);
      } catch (err) {
        if (cancelled) return;
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load workspace";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    // Optional: Set up polling for live updates
    let intervalId: NodeJS.Timeout | undefined;
    if (options?.refetchInterval) {
      intervalId = setInterval(() => {
        loadWorkspace();
      }, options.refetchInterval);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [workspaceId, version]); // Re-fetch when version changes (cache invalidation)

  return {
    loading,
    error,
    invalidate, // Expose invalidate function to trigger refresh
  };
}

/**
 * Trigger a full workspace refresh
 */
export function useInvalidateWorkspace() {
  const invalidate = useWorkspaceStore((s) => s.invalidate);
  return invalidate;
}
