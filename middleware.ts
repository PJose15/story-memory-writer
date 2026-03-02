import { NextRequest, NextResponse } from 'next/server';

/**
 * Protect API routes from cross-origin abuse.
 * Allows requests from the same origin (checked via Origin or Referer header)
 * and server-side requests (no Origin header, e.g. Next.js SSR).
 */
export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Server-side or same-origin requests without Origin header are allowed
  if (!origin && !referer) {
    return NextResponse.next();
  }

  const host = req.headers.get('host') || '';

  // Check Origin header
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        return NextResponse.next();
      }
    } catch {
      // Invalid origin URL — block
    }
  }

  // Fallback: check Referer header
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) {
        return NextResponse.next();
      }
    } catch {
      // Invalid referer URL — block
    }
  }

  // Allow localhost in development
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
        return NextResponse.next();
      }
    } catch {
      // Invalid URL
    }
  }

  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

export const config = {
  matcher: '/api/:path*',
};
