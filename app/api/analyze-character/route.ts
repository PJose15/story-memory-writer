import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildCharacterAnalysisSystemPrompt, buildCharacterAnalysisPrompt } from '@/lib/prompts/character-analysis';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 10, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { character, language } = body;

    if (!character || typeof character !== 'object') {
      return NextResponse.json({ error: 'Missing required field: character' }, { status: 400 });
    }
    if (typeof character.name !== 'string' || !character.name.trim()) {
      return NextResponse.json({ error: 'Missing required field: character.name' }, { status: 400 });
    }
    if (typeof language !== 'string' || !language.trim()) {
      return NextResponse.json({ error: 'Missing required field: language' }, { status: 400 });
    }

    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 500000) {
      return NextResponse.json({ error: 'Request payload too large (max 500KB)' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildCharacterAnalysisSystemPrompt(language);
    const prompt = buildCharacterAnalysisPrompt({
      language,
      name: character.name,
      role: character.role || '',
      coreIdentity: character.coreIdentity || '',
      currentState: character.currentState,
      stateHistory: character.stateHistory || [],
      relationships: character.relationships || [],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return NextResponse.json({ analysis: response.text || '' });

  } catch (error: any) {
    console.error('Character analysis API error:', error);
    const message = error?.message || 'Failed to analyze character';
    const status = error?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
