import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, FinishReason } from '@google/genai';
import { buildMicroPromptSystemPrompt, buildMicroPromptContent, validateMicroPromptResponse } from '@/lib/prompts/micro-prompt';
import { rateLimit } from '@/lib/rate-limit';
import { AI_MODEL, SAFETY_SETTINGS } from '@/lib/ai-config';
import { getErrorStatus } from '@/lib/api-error';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 60, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { recentText, genre, protagonistName, blockType, storyContext } = body;

    if (typeof recentText !== 'string' || recentText.trim().length < 20) {
      return NextResponse.json(
        { error: 'recentText must be at least 20 characters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildMicroPromptSystemPrompt();

    // Send last 600 words for better scene context
    const words = recentText.trim().split(/\s+/);
    const truncatedText = words.slice(-600).join(' ');

    const prompt = buildMicroPromptContent({
      recentText: truncatedText,
      storyContext,
      genre,
      protagonistName,
      blockType,
    });

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        safetySettings: SAFETY_SETTINGS,
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });

    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (
      finishReason === FinishReason.SAFETY ||
      finishReason === FinishReason.PROHIBITED_CONTENT ||
      finishReason === FinishReason.BLOCKLIST
    ) {
      return NextResponse.json({ prompt: '' });
    }

    const rawText = (response.text || '').trim();
    const validated = validateMicroPromptResponse(rawText);

    // Return validated prompt, or empty if garbage (never show garbage to user)
    return NextResponse.json({ prompt: validated || '' });
  } catch (error: unknown) {
    console.error('Micro-prompt API error:', error);
    const status = getErrorStatus(error);
    // On rate limit (429) or other errors, return empty prompt silently
    // so the UI doesn't show an error — the writer should not be interrupted
    if (status === 429) {
      return NextResponse.json({ prompt: '' });
    }
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status });
  }
}
