import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}

// --- Upstash Redis rate limiter (production / Vercel) ---
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`;
  if (upstashLimiters.has(key)) return upstashLimiters.get(key)!;

  const windowSec = Math.ceil(windowMs / 1000);
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    prefix: 'ratelimit',
  });

  upstashLimiters.set(key, limiter);
  return limiter;
}

// --- In-memory rate limiter (local development) ---
const memoryStore = new Map<string, number[]>();
const MAX_STORE_KEYS = 10000;
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupMemoryStore(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, timestamps] of memoryStore) {
    const valid = timestamps.filter(t => now - t < windowMs);
    if (valid.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, valid);
    }
  }

  // Hard cap: if still too large, drop oldest entries
  if (memoryStore.size > MAX_STORE_KEYS) {
    const excess = memoryStore.size - MAX_STORE_KEYS;
    const keys = memoryStore.keys();
    for (let i = 0; i < excess; i++) {
      const { value } = keys.next();
      if (value) memoryStore.delete(value);
    }
  }
}

function memoryRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  cleanupMemoryStore(windowMs);
  const now = Date.now();
  const timestamps = (memoryStore.get(key) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    memoryStore.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);
  return true;
}

/**
 * Check rate limit for a request.
 * Uses Upstash Redis in production (when UPSTASH env vars are set),
 * falls back to in-memory for local development.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 */
export async function rateLimit(
  req: NextRequest,
  { maxRequests = 10, windowMs = 60000 }: { maxRequests?: number; windowMs?: number } = {}
): Promise<NextResponse | null> {
  const ip = getClientIP(req);
  const key = `${ip}:${req.nextUrl.pathname}`;

  if (hasUpstash) {
    const limiter = getUpstashLimiter(maxRequests, windowMs);
    const { success } = await limiter.limit(key);
    if (!success) return rateLimitResponse();
  } else {
    const allowed = memoryRateLimit(key, maxRequests, windowMs);
    if (!allowed) return rateLimitResponse();
  }

  return null;
}
