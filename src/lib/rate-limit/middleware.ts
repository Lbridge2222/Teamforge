// ════════════════════════════════════════════
// Rate Limiting Middleware
// Uses Upstash Redis for distributed rate limiting
// Alternative: In-memory LRU cache for simpler setup
// ════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ════════════════════════════════════════════
// IN-MEMORY RATE LIMITER (Development/Small Scale)
// ════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      // New window
      const resetAt = now + windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return { success: true, remaining: limit - 1, resetAt };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      success: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

// ════════════════════════════════════════════
// RATE LIMIT CONFIGURATIONS
// ════════════════════════════════════════════

export interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Time window in milliseconds
}

export const RATE_LIMITS = {
  // General API endpoints
  api: {
    limit: 100,
    window: 60 * 1000, // 100 requests per minute
  },

  // AI/Forge endpoints (more expensive)
  forge: {
    limit: 20,
    window: 60 * 1000, // 20 requests per minute
  },

  // Auth endpoints (prevent brute force)
  auth: {
    limit: 5,
    window: 60 * 1000, // 5 requests per minute
  },

  // Write operations
  write: {
    limit: 30,
    window: 60 * 1000, // 30 writes per minute
  },

  // Expensive read operations (full workspace data)
  expensiveRead: {
    limit: 30,
    window: 60 * 1000, // 30 per minute
  },
} as const;

// ════════════════════════════════════════════
// RATE LIMIT MIDDLEWARE
// ════════════════════════════════════════════

/**
 * Get identifier for rate limiting
 * Preference: authenticated userId > IP address > fallback
 */
function getRateLimitIdentifier(request: NextRequest, prefix: string): string {
  // Try to get user ID from auth header or session
  // This would need to be implemented based on your auth system
  const userId = request.headers.get("x-user-id");
  
  if (userId) {
    return `${prefix}:user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `${prefix}:ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 * Returns NextResponse with 429 if limit exceeded
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<NextResponse | null> {
  const id = identifier || getRateLimitIdentifier(request, "api");
  
  const result = await rateLimiter.check(id, config.limit, config.window);

  // Add rate limit headers
  const headers = {
    "X-RateLimit-Limit": config.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }

  return null; // No rate limit violation
}

/**
 * Wrapper function for API routes
 * Usage in route handler:
 * 
 * export async function POST(request: NextRequest) {
 *   const rateLimitError = await checkRateLimit(request, RATE_LIMITS.forge);
 *   if (rateLimitError) return rateLimitError;
 *   
 *   // ... your handler code
 * }
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifierPrefix?: string
): Promise<NextResponse | null> {
  const identifier = identifierPrefix
    ? getRateLimitIdentifier(request, identifierPrefix)
    : undefined;

  return applyRateLimit(request, config, identifier);
}

// ════════════════════════════════════════════
// UPSTASH REDIS RATE LIMITER (Production)
// ════════════════════════════════════════════

/**
 * For production, use Upstash Redis for distributed rate limiting
 * 
 * Installation:
 * npm install @upstash/redis @upstash/ratelimit
 * 
 * Setup in .env:
 * UPSTASH_REDIS_REST_URL=your-url
 * UPSTASH_REDIS_REST_TOKEN=your-token
 */

/*
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for different use cases
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

export const forgeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:forge",
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

// Usage in route:
export async function checkRateLimitRedis(
  request: NextRequest,
  limiter: Ratelimit
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(request, "api");
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }

  return null;
}
*/
