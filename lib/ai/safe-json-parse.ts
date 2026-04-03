/**
 * Safely parse a JSON response from Gemini (or other LLMs).
 * Handles: clean JSON, markdown-fenced JSON, malformed JSON.
 */
export function safeParseGeminiResponse<T>(
  text: string,
  fallback: T,
  validator?: (parsed: unknown) => parsed is T
): T {
  if (!text || !text.trim()) return fallback;

  // Step 1: Try direct JSON.parse
  try {
    const parsed = JSON.parse(text);
    if (validator && !validator(parsed)) return fallback;
    return parsed as T;
  } catch {
    // Continue to step 2
  }

  // Step 2: Strip markdown fences and try again
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  if (stripped !== text.trim()) {
    try {
      const parsed = JSON.parse(stripped);
      if (validator && !validator(parsed)) return fallback;
      return parsed as T;
    } catch {
      // Continue to step 3
    }
  }

  // Step 3: Regex extract first JSON block (object or array)
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (validator && !validator(parsed)) return fallback;
      return parsed as T;
    } catch {
      // Fall through
    }
  }

  console.warn('[safeParseGeminiResponse] Could not parse response, using fallback');
  return fallback;
}
