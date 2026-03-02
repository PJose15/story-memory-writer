import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up entries older than 5 minutes (covers any windowMs up to 300s)
const MAX_ENTRY_AGE = 300000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < MAX_ENTRY_AGE);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, MAX_ENTRY_AGE);

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit for a request.
 * Returns null if allowed, or a NextResponse with 429 if rate limited.
 */
export function rateLimit(
  req: NextRequest,
  { maxRequests = 10, windowMs = 60000 }: { maxRequests?: number; windowMs?: number } = {}
): NextResponse | null {
  const ip = getClientIP(req);
  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const entry = store.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return null;
}
