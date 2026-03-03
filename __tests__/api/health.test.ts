import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns status ok and a timestamp', async () => {
    const res = GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('number');
    expect(body.timestamp).toBeLessThanOrEqual(Date.now());
  });
});
