import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock rate-limit to always allow
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock @google/genai
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  const MockGoogleGenAI = class {
    models = { generateContent: mockGenerateContent };
  };
  return {
    GoogleGenAI: MockGoogleGenAI,
    FinishReason: {
      SAFETY: 'SAFETY',
      PROHIBITED_CONTENT: 'PROHIBITED_CONTENT',
      BLOCKLIST: 'BLOCKLIST',
      MAX_TOKENS: 'MAX_TOKENS',
    },
  };
});

vi.mock('@/lib/ai-config', () => ({
  AI_MODEL: 'test-model',
  SAFETY_SETTINGS: [],
}));

vi.mock('@/lib/prompts/writing-assistant', () => ({
  buildWritingAssistantPrompt: vi.fn().mockReturnValue('system-prompt'),
}));

const { POST } = await import('@/app/api/chat/route');

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockGenerateContent.mockReset();
  });

  it('rejects missing userInput', async () => {
    const res = await POST(makeRequest({ language: 'English' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/userInput/);
  });

  it('rejects empty userInput', async () => {
    const res = await POST(makeRequest({ userInput: '  ', language: 'English' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing language', async () => {
    const res = await POST(makeRequest({ userInput: 'hello' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/language/);
  });

  it('rejects payload exceeding 500KB', async () => {
    const res = await POST(
      makeRequest({
        userInput: 'hello',
        language: 'English',
        storyContext: 'x'.repeat(500_001),
      })
    );
    expect(res.status).toBe(413);
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await POST(
      makeRequest({ userInput: 'hello', language: 'English', storyContext: '' })
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/API key/);
  });

  it('returns generated text on success', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ finishReason: 'STOP' }],
      text: 'AI response here',
    });

    const res = await POST(
      makeRequest({
        userInput: 'What should happen next?',
        language: 'English',
        storyContext: 'Chapter 1...',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe('AI response here');
    expect(body.isBlockedMode).toBe(false);
  });

  it('returns blocked response when safety filter triggers', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ finishReason: 'SAFETY' }],
      text: '',
    });

    const res = await POST(
      makeRequest({
        userInput: 'test',
        language: 'English',
        storyContext: '',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocked).toBe(true);
  });

  it('appends truncation notice on MAX_TOKENS', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ finishReason: 'MAX_TOKENS' }],
      text: 'partial response',
    });

    const res = await POST(
      makeRequest({
        userInput: 'test',
        language: 'English',
        storyContext: '',
      })
    );
    const body = await res.json();
    expect(body.text).toContain('truncated');
  });
});
