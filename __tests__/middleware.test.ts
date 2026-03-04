import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  function makeRequest(headerValues: Record<string, string> = {}) {
    const req = new NextRequest('http://localhost/api/test');
    vi.spyOn(req.headers, 'get').mockImplementation(
      (name: string) => headerValues[name.toLowerCase()] ?? null
    );
    return req;
  }

  async function loadMiddleware() {
    return await import('@/middleware');
  }

  it('allows requests with no Origin or Referer (server-side/SSR)', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({ host: 'myapp.com' }));
    expect(res.status).not.toBe(403);
  });

  it('allows same-origin request (Origin host matches Host header)', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      origin: 'https://myapp.com',
    }));
    expect(res.status).not.toBe(403);
  });

  it('allows same-origin via Referer fallback when Origin is absent', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      referer: 'https://myapp.com/some-page',
    }));
    expect(res.status).not.toBe(403);
  });

  it('blocks cross-origin request (different Origin host) with 403', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      origin: 'https://evil.com',
    }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('blocks malformed Origin URL with 403', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      origin: 'not-a-url',
    }));
    expect(res.status).toBe(403);
  });

  it('blocks malformed Referer URL with 403', async () => {
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      referer: 'not-a-url',
    }));
    expect(res.status).toBe(403);
  });

  it('allows localhost Origin in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      origin: 'http://localhost:3000',
    }));
    expect(res.status).not.toBe(403);
  });

  it('blocks localhost Origin in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { middleware } = await loadMiddleware();
    const res = middleware(makeRequest({
      host: 'myapp.com',
      origin: 'http://localhost:3000',
    }));
    expect(res.status).toBe(403);
  });

  it('config.matcher equals /api/:path*', async () => {
    const { config } = await loadMiddleware();
    expect(config.matcher).toBe('/api/:path*');
  });
});
