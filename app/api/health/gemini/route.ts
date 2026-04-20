import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AI_MODEL } from '@/lib/ai-config';

export const maxDuration = 30;

/**
 * Diagnostic endpoint: confirms GEMINI_API_KEY is set and reachable.
 * Hit this in your browser when extract-world-bible is failing —
 * the response tells you exactly what's wrong with the Gemini setup.
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const keyPresent = Boolean(apiKey);
  const keyPrefix = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-2)}` : null;

  if (!keyPresent) {
    return NextResponse.json(
      {
        ok: false,
        keyPresent: false,
        model: AI_MODEL,
        error: 'GEMINI_API_KEY is not set in this environment.',
        hint: 'Set GEMINI_API_KEY in your hosting provider (Vercel project settings / AI Studio secrets / .env.local for local dev) and redeploy.',
      },
      { status: 500 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: 'Reply with the single word: OK',
      config: {
        temperature: 0,
        maxOutputTokens: 32,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim() ?? '';
    const finishReason = response.candidates?.[0]?.finishReason ?? null;

    return NextResponse.json({
      ok: text.length > 0,
      keyPresent: true,
      keyPrefix,
      model: AI_MODEL,
      finishReason,
      sampleResponse: text.slice(0, 100),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'UnknownError';
    return NextResponse.json(
      {
        ok: false,
        keyPresent: true,
        keyPrefix,
        model: AI_MODEL,
        errorName: name,
        error: message,
      },
      { status: 500 },
    );
  }
}
