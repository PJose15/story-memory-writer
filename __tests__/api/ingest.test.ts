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
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER',
    },
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

// Mock pdf-parse and mammoth — we test validation, not parsing
vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: 'Parsed PDF text' }),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Parsed DOCX text' }),
  },
}));

const { POST } = await import('@/app/api/ingest/route');

function makeFormRequest(
  files: { name: string; content: string; type?: string }[],
  language = 'English'
): NextRequest {
  const formData = new FormData();
  formData.set('language', language);
  for (const f of files) {
    const blob = new Blob([f.content], { type: f.type || 'text/plain' });
    formData.append('files', new File([blob], f.name));
  }
  return new NextRequest('http://localhost:3000/api/ingest', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/ingest', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockGenerateContent.mockReset();
  });

  it('rejects request with no files', async () => {
    const formData = new FormData();
    formData.set('language', 'English');
    const req = new NextRequest('http://localhost:3000/api/ingest', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/No files/);
  });

  it('rejects unsupported file extension', async () => {
    const res = await POST(makeFormRequest([{ name: 'script.js', content: 'var x = 1;' }]));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unsupported format/);
  });

  it('rejects too many files', async () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `file${i}.txt`,
      content: 'text',
    }));
    const res = await POST(makeFormRequest(files));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Too many files/);
  });

  it('processes a valid .txt file successfully', async () => {
    const extractedData = {
      project: { title: 'Test', genre: ['fiction'] },
      chapters: [],
      characters: [],
      scenes: [],
      character_states: [],
      relationships: [],
      active_conflicts: [],
      timeline_events: [],
      world_rules: [],
      locations: [],
      themes: [],
      canon_items: [],
      ambiguities: [],
      open_loops: [],
      foreshadowing_elements: [],
    };

    mockGenerateContent.mockResolvedValue({
      candidates: [{ finishReason: 'STOP' }],
      text: JSON.stringify(extractedData),
    });

    const res = await POST(
      makeFormRequest([{ name: 'manuscript.txt', content: 'Chapter 1\nOnce upon a time...' }])
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fileParsingStatus).toHaveLength(1);
    expect(body.fileParsingStatus[0].status).toBe('success');
    expect(body.extractedData.project.title).toBe('Test');
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await POST(
      makeFormRequest([{ name: 'story.txt', content: 'Some text' }])
    );
    expect(res.status).toBe(500);
  });

  it('handles .md files the same as .txt', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ finishReason: 'STOP' }],
      text: JSON.stringify({ project: {}, chapters: [] }),
    });

    const res = await POST(
      makeFormRequest([{ name: 'notes.md', content: '# Chapter 1\nSome notes' }])
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fileParsingStatus[0].status).toBe('success');
  });
});
