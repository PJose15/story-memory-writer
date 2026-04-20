import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, FinishReason } from '@google/genai';
import { rateLimit } from '@/lib/rate-limit';
import { AI_MODEL, SAFETY_SETTINGS, AI_CONFIG } from '@/lib/ai-config';
import { getErrorStatus, getErrorMessage } from '@/lib/api-error';
import { WORLD_BIBLE_CATEGORIES, type WorldBibleSection } from '@/lib/types/world-bible';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 3, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { chapters } = body;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'chapters must be a non-empty array' }, { status: 400 });
    }

    const validChapters = chapters.filter(
      (ch: unknown): ch is { title: string; content: string } =>
        typeof ch === 'object' && ch !== null &&
        typeof (ch as { title?: unknown }).title === 'string' &&
        (ch as { title: string }).title.trim().length > 0 &&
        typeof (ch as { content?: unknown }).content === 'string' &&
        (ch as { content: string }).content.trim().length > 0,
    );

    if (validChapters.length === 0) {
      return NextResponse.json(
        { error: 'No chapters with content to extract from. Write chapter text on the Manuscript page first.' },
        { status: 400 },
      );
    }

    const totalSize = validChapters.reduce(
      (sum, ch) => sum + ch.title.length + ch.content.length,
      0,
    );

    if (totalSize > 500_000) {
      return NextResponse.json(
        { error: 'Manuscript too long to extract in one pass (>500KB). Try extracting with fewer chapters.' },
        { status: 413 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const chapterText = validChapters
      .map((ch, i) => `--- Chapter ${i + 1}: ${ch.title} ---\n${ch.content}`)
      .join('\n\n');

    const prompt = `You are a worldbuilding analyst. Extract all worldbuilding details from the following manuscript chapters and organize them into exactly these categories: geography, history, magic-tech, politics, religion-culture, economy, languages, calendar.

For each piece of worldbuilding you find, create a section with:
- category: one of the 8 categories above
- title: a short descriptive title for this piece of lore
- content: detailed description in markdown, citing specific chapters when possible

Only include sections where you found actual content. Do not invent or speculate — extract only what is explicitly stated or strongly implied in the text.

<manuscript>
${chapterText}
</manuscript>`;

    const generateConfig = {
      model: AI_MODEL,
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS,
        temperature: AI_CONFIG.worldBible.temperature,
        maxOutputTokens: AI_CONFIG.worldBible.maxOutputTokens,
        // Disable "thinking" for gemini-2.5-flash: thinking tokens are billed
        // against maxOutputTokens and can consume the entire budget, leaving
        // an empty or truncated JSON body. Extraction is analytical, not
        // creative — we don't need reasoning tokens here.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: 'One of: geography, history, magic-tech, politics, religion-culture, economy, languages, calendar' },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING, description: 'Markdown content describing this worldbuilding element' },
                },
              },
            },
          },
        },
      },
    };

    // Retry 503 UNAVAILABLE (peak-load overflow) with exponential backoff.
    // Gemini regularly returns this during high-demand periods.
    let response;
    let lastError: unknown;
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        response = await ai.models.generateContent(generateConfig);
        break;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient = /\b503\b|UNAVAILABLE|overloaded|high demand/i.test(msg);
        if (!isTransient || attempt === MAX_ATTEMPTS - 1) throw err;
        const backoffMs = 800 * Math.pow(2, attempt);
        console.warn(`WorldBible: Gemini transient failure (attempt ${attempt + 1}/${MAX_ATTEMPTS}), retrying in ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    if (!response) {
      throw lastError ?? new Error('Gemini call failed after retries');
    }

    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (
      finishReason === FinishReason.SAFETY ||
      finishReason === FinishReason.PROHIBITED_CONTENT ||
      finishReason === FinishReason.BLOCKLIST
    ) {
      return NextResponse.json({ sections: [] });
    }

    const rawText = response.text;

    if (finishReason === FinishReason.MAX_TOKENS) {
      console.error('WorldBible: response hit MAX_TOKENS; truncated output.');
      return NextResponse.json(
        { error: 'Manuscript too long to extract in one pass. Try extracting with fewer chapters at a time.' },
        { status: 413 },
      );
    }

    if (!rawText) {
      console.error('WorldBible: empty response text. finishReason=', finishReason);
      return NextResponse.json(
        { error: `AI returned an empty response (finish reason: ${finishReason ?? 'unknown'}). Please try again.` },
        { status: 502 },
      );
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('WorldBible: Gemini returned invalid JSON:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: 'AI returned an invalid response. Please try again, or extract with fewer chapters.' },
        { status: 502 },
      );
    }

    const validCategories = new Set<string>(WORLD_BIBLE_CATEGORIES);
    const now = new Date().toISOString();
    const sections: WorldBibleSection[] = (Array.isArray(result.sections) ? result.sections : [])
      .filter(
        (s: Record<string, unknown>) =>
          typeof s.category === 'string' &&
          validCategories.has(s.category) &&
          typeof s.title === 'string' &&
          s.title.trim() &&
          typeof s.content === 'string' &&
          s.content.trim(),
      )
      .map((s: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        category: s.category as WorldBibleSection['category'],
        title: (s.title as string).trim(),
        content: (s.content as string).trim(),
        source: 'ai-extracted' as const,
        lastUpdated: now,
        canonStatus: 'draft' as const,
      }));

    return NextResponse.json({ sections });
  } catch (error: unknown) {
    console.error('WorldBible extraction error:', error);
    const rawMessage = getErrorMessage(error, 'Failed to extract worldbuilding');
    const isOverloaded = /\b503\b|UNAVAILABLE|overloaded|high demand/i.test(rawMessage);
    if (isOverloaded) {
      return NextResponse.json(
        { error: 'Gemini is experiencing high demand right now. Please wait a minute and try again.' },
        { status: 503 },
      );
    }
    const status = getErrorStatus(error);
    return NextResponse.json({ error: rawMessage }, { status });
  }
}
