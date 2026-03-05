import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, FinishReason } from '@google/genai';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';
import { rateLimit } from '@/lib/rate-limit';
import { AI_MODEL, SAFETY_SETTINGS } from '@/lib/ai-config';
import { getErrorStatus } from '@/lib/api-error';

export const maxDuration = 60;

function buildOutputFormat(isBlockedRequest: boolean): string {
  if (isBlockedRequest) {
    return `
BLOCKED MODE ACTIVATED:
The user has indicated they are experiencing writer's block. You must act as a smart narrative partner to help them regain momentum.

Analyze the most recent chapter/scene, unresolved conflicts, emotional state of the active arc, and story promises.
Diagnose the reason for the block before offering solutions.

OUTPUT FORMAT:
Please structure your response with the following sections (use Markdown headings):
### Current Narrative State
(Summarize where the story currently stands based on the latest chapter and active conflicts)

### Diagnosis: Why You Might Be Blocked
(Identify the likely type of block: plot block, scene transition block, emotional clarity block, pacing block, or character motivation block, and explain why)

### 3-5 Coherent Next Paths
(Propose 3 to 5 possible next moves. Distinguish clearly between:
- Safe continuation
- Escalation option
- Emotional/deeper character option
- Revelation/discovery option
- Risky but plausible option
Explain why each path fits the canon and current story state)

### Best Recommended Next Move
(Your top recommendation for regaining momentum)

### Scene Starter (Optional)
(Only provide a scene starter if the user explicitly asked for it)
`;
  }

  return `
OUTPUT FORMAT:
Please structure your response with the following sections (use Markdown headings):
### Context Used
(List the specific story elements you are referencing — character names, chapter titles, conflicts, timeline events, etc. Be specific so the user can verify your sources.)

### Information Gaps
(List any information that would be helpful but is missing from your context. If you have everything you need, say "None — full context available for this query.")

### Conflicts Detected
(If the user's request contradicts Confirmed Canon, warn them here. Otherwise, say "None detected")

### Safe Narrative Recommendations
(Your suggestions that respect the canon. Clearly distinguish between facts from the context and your own creative suggestions.)

### Generated Text (Optional)
(Only if the user explicitly asked you to write or generate a scene/dialogue)
`;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 10, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { userInput, isBlockedRequest, language, chatHistory } = body;
    const storyContext = typeof body.storyContext === 'string' ? body.storyContext : '';

    if (typeof userInput !== 'string' || !userInput.trim()) {
      return NextResponse.json({ error: 'Missing required field: userInput' }, { status: 400 });
    }
    if (typeof language !== 'string' || !language.trim()) {
      return NextResponse.json({ error: 'Missing required field: language' }, { status: 400 });
    }

    // Validate and sanitize chat history entries
    const sanitizedHistory = Array.isArray(chatHistory)
      ? chatHistory.filter((item): item is string => typeof item === 'string').map(s => s.slice(0, 1500))
      : [];
    const historyText = sanitizedHistory.join('\n');
    const totalLength = (storyContext?.length || 0) + (userInput?.length || 0) + historyText.length;
    if (totalLength > 500000) {
      return NextResponse.json({ error: 'Request payload too large (max 500KB of text)' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildWritingAssistantPrompt(language);
    const outputFormat = buildOutputFormat(!!isBlockedRequest);

    const historyBlock = historyText
      ? `\n<conversation_history>\n${historyText}\n</conversation_history>\n`
      : '';

    const contents = `<story_context>
${storyContext}
</story_context>

${outputFormat}
${historyBlock}
<user_request>
${userInput}
</user_request>`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    // Check if the response was blocked or truncated
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason === FinishReason.SAFETY || finishReason === FinishReason.PROHIBITED_CONTENT || finishReason === FinishReason.BLOCKLIST) {
      return NextResponse.json({
        text: 'The AI could not generate a response for this request. Try rephrasing your input or adjusting the scene context.',
        isBlockedMode: !!isBlockedRequest,
        blocked: true,
      });
    }

    let text = response.text || '';
    if (finishReason === FinishReason.MAX_TOKENS && text) {
      text += '\n\n---\n*Response was truncated due to length. Ask me to continue if needed.*';
    }

    return NextResponse.json({
      text: text || 'I could not generate a response.',
      isBlockedMode: !!isBlockedRequest,
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const status = getErrorStatus(error);
    const message = status === 429
      ? 'AI quota exceeded. Please wait a few minutes and try again, or upgrade your API key.'
      : 'Failed to generate response';
    return NextResponse.json({ error: message }, { status });
  }
}
