// ════════════════════════════════════════════
// Performance Optimization Hook — Detect performance issues
// ════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { logger } from "@/lib/errors";

/**
 * Hook to monitor component render performance
 * Useful for detecting performance bottlenecks in production
 */
export function useRenderPerformance(componentName: string, enabled = false) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;

    if (renderTime > 100) {
      logger.warn(`Slow render detected: ${componentName}`, {
        componentName,
        renderTime,
        renderCount: renderCount.current,
      });
    }

    startTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook to detect when a workspace is "large" and should use optimizations
 */
export function useWorkspaceSize() {
  return {
    isLarge: false, // TODO: Implement based on workspace data
    shouldVirtualize: false,
    shouldPaginate: false,
  };
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for rate-limiting operations
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, interval - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, interval]);

  return throttledValue;
}

import React from "react";
