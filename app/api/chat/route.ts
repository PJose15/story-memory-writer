import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';
import { rateLimit } from '@/lib/rate-limit';

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
### Active Canon Used
(Briefly list the established facts you relied on)

### Conflicts Detected
(If the user's request contradicts Confirmed Canon, warn them here. Otherwise, say "None detected")

### Safe Narrative Recommendations
(Your suggestions that respect the canon)

### Generated Text (Optional)
(Only if the user explicitly asked you to write or generate a scene/dialogue)
`;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { maxRequests: 10, windowMs: 60000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { storyContext, userInput, isBlockedRequest, language, chatHistory } = body;

    if (!storyContext || !userInput || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const historyText = Array.isArray(chatHistory) ? chatHistory.join('\n') : '';
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
      ? `\nRECENT CONVERSATION:\n${historyText}\n`
      : '';

    const contents = `
${storyContext}

${outputFormat}
${historyBlock}
USER REQUEST:
${userInput}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return NextResponse.json({
      text: response.text || 'I could not generate a response.',
      isBlockedMode: !!isBlockedRequest,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
