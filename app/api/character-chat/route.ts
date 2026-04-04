import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getErrorStatus } from '@/lib/api-error';

export const maxDuration = 30;

const VALID_MODES = ['exploration', 'scene', 'confrontation'];

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 15, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { characterName, message, mode, systemPrompt, messages, generateInsight } = body;

    if (typeof characterName !== 'string' || characterName.trim().length === 0) {
      return NextResponse.json(
        { error: 'characterName is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: 'Message too large (max 10000 characters)' },
        { status: 413 }
      );
    }

    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be one of: exploration, scene, confrontation' },
        { status: 400 }
      );
    }

    if (typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'systemPrompt is required and must be non-empty' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Build conversation history
    const apiMessages: Array<{ role: string; content: string }> = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'character')) {
          apiMessages.push({
            role: m.role === 'character' ? 'assistant' : 'user',
            content: m.content,
          });
        }
      }
    }
    apiMessages.push({ role: 'user', content: message.trim() });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.6,
          system: systemPrompt,
          messages: apiMessages,
        }),
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Chat request timed out' }, { status: 504 });
      }
      throw fetchError;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return NextResponse.json({ error: 'Rate limited by AI provider' }, { status: 429 });
      }
      return NextResponse.json({ error: 'AI provider error' }, { status });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text?.trim() || '';

    const result: { reply: string; insight?: string } = { reply };

    // Generate insight if requested and enough messages
    if (generateInsight && Array.isArray(messages) && messages.length >= 5) {
      try {
        const insightResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            temperature: 0.3,
            system: 'You are a literary analyst. Extract character insights from conversations.',
            messages: [
              {
                role: 'user',
                content: `Analyze this conversation and extract ONE key insight about the character "${characterName}":\n\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\nuser: ${message}\nassistant: ${reply}`,
              },
            ],
          }),
        });

        if (insightResponse.ok) {
          const insightData = await insightResponse.json();
          result.insight = insightData.content?.[0]?.text?.trim() || undefined;
        }
      } catch {
        // Insight generation is optional — don't fail the main response
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Character chat API error:', error);
    const status = getErrorStatus(error);
    return NextResponse.json({ error: 'Failed to generate character response' }, { status });
  }
}
