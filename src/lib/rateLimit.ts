import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Keep only timestamps within the last 15 minutes
      record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number; // Max allowed requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Extracts client IP address from standard proxy/CDN headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const rawIp =
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  // Strip any illegal characters to prevent rate limiter key pollution
  const sanitizedIp = rawIp.replace(/[^a-fA-F0-9.:]/g, "").slice(0, 45);
  return sanitizedIp || "127.0.0.1";
}

/**
 * Checks sliding window rate limit for a specific identifier.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps outside current window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, oldest + options.windowMs - now);
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: options.limit - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

/**
 * Standard 429 Too Many Requests response with Retry-After header.
 */
export function createRateLimitResponse(resetMs: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
  return NextResponse.json(
    {
      error: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
    }
  );
}
