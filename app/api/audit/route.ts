import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 10, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { storyContext, userInput, language } = body;

    if (typeof userInput !== 'string' || !userInput.trim()) {
      return NextResponse.json({ error: 'Missing required field: userInput' }, { status: 400 });
    }
    if (typeof language !== 'string' || !language.trim()) {
      return NextResponse.json({ error: 'Missing required field: language' }, { status: 400 });
    }

    const totalLength = (storyContext?.length || 0) + (userInput?.length || 0);
    if (totalLength > 500000) {
      return NextResponse.json({ error: 'Request payload too large (max 500KB of text)' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildWritingAssistantPrompt(language);

    const prompt = `
${storyContext}

Perform a Continuity Audit on the following requested idea/scene:
"${userInput}"

Analyze it against the established canon. Detect contradictions, broken character logic, timeline inconsistencies, tone mismatch, unresolved setup ignored, emotional continuity gaps, and lore/world rule conflicts.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "'Clear', 'Warnings', or 'Contradictions'" },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING, description: "'Low', 'Medium', or 'High'" },
                  description: { type: Type.STRING },
                  affectedElements: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            suggestedCorrections: { type: Type.ARRAY, items: { type: Type.STRING } },
            safeVersion: { type: Type.STRING, description: 'A safe version that respects canon' }
          }
        }
      }
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json({ status: 'Clear', risks: [], suggestedCorrections: [], safeVersion: '' });
    }
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('Audit: Gemini returned invalid JSON:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'AI returned an invalid response. Please try again.' }, { status: 502 });
    }
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Audit API error:', error);
    const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600
      ? error.status : 500;
    return NextResponse.json({ error: 'Failed to perform audit' }, { status });
  }
}
