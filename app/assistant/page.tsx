'use client';

import { useState, useRef, useEffect } from 'react';
import { useStory } from '@/lib/store';
import { Send, Bot, User, Loader2, Zap, BrainCircuit, ShieldAlert, X, AlertTriangle, CheckCircle2, LockKeyhole } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  isBlockedMode?: boolean;
}

interface AuditRisk {
  level: 'Low' | 'Medium' | 'High';
  description: string;
  affectedElements: string[];
}

interface AuditResult {
  status: 'Clear' | 'Warnings' | 'Contradictions';
  risks: AuditRisk[];
  suggestedCorrections: string[];
  safeVersion: string;
}

export default function AssistantPage() {
  const { state } = useStory();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your narrative copilot. I have access to your Story Bible, characters, and manuscript. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [pendingAudit, setPendingAudit] = useState<{ request: string; result: AuditResult } | null>(null);
  const [mode, setMode] = useState<'fast' | 'deep'>('deep');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    // Filter out discarded items
    const activeCharacters = state.characters.filter(c => c.canonStatus !== 'discarded');
    const activeTimeline = state.timeline_events.filter(t => t.canonStatus !== 'discarded');
    const activeConflicts = state.active_conflicts.filter(c => c.canonStatus !== 'discarded');
    const activeChapters = state.chapters.filter(c => c.canonStatus !== 'discarded');
    const activeRules = state.world_rules.filter(r => r.canonStatus !== 'discarded');
    const activeForeshadowing = state.foreshadowing_elements.filter(f => f.canonStatus !== 'discarded');

    // Group by status
    const getByStatus = (items: any[], status: string) => items.filter(i => (i.canonStatus || 'draft') === status);

    const confirmedItems = [
      ...getByStatus(activeCharacters, 'confirmed').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'confirmed').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'confirmed').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'confirmed').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'confirmed').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'confirmed').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const flexibleItems = [
      ...getByStatus(activeCharacters, 'flexible').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'flexible').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'flexible').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'flexible').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'flexible').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'flexible').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const draftItems = [
      ...getByStatus(activeCharacters, 'draft').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'draft').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'draft').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'draft').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'draft').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'draft').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const latestChapter = activeChapters.length > 0 ? activeChapters[activeChapters.length - 1] : null;

    return `
      STORY BIBLE:
      Title: ${state.title}
      Synopsis: ${state.synopsis}
      Style Profile: ${state.style_profile}
      
      LATEST CHAPTER:
      ${latestChapter ? `Title: ${latestChapter.title}\nSummary: ${latestChapter.summary}\nContent: ${latestChapter.content.substring(0, 1500)}...` : 'None'}
      
      CANON LOCK STATUS:
      You must respect the following certainty levels:
      
      1. CONFIRMED CANON (LOCKED - DO NOT CONTRADICT):
      ${confirmedItems.length ? confirmedItems.join('\n') : 'None'}
      
      2. FLEXIBLE CANON (Build around carefully):
      ${flexibleItems.length ? flexibleItems.join('\n') : 'None'}
      
      3. DRAFT IDEAS (Exploratory, not final):
      ${draftItems.length ? draftItems.join('\n') : 'None'}
    `;
  };

  const handleAudit = async () => {
    if (!input.trim() || isLoading || isAuditing) return;

    setIsAuditing(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is missing');

      const ai = new GoogleGenAI({ apiKey });

      const context = buildContext();

      const prompt = `
        ${context}
        
        Perform a Continuity Audit on the following requested idea/scene:
        "${input}"
        
        Analyze it against the established canon. Detect contradictions, broken character logic, timeline inconsistencies, tone mismatch, unresolved setup ignored, emotional continuity gaps, and lore/world rule conflicts.
      `;

      const systemPrompt = `
System Prompt — Writing Assistant Companion

You are the Writing Assistant Companion inside a story-focused writing application.

Your role is to help the user continue, refine, and develop their writing without losing continuity, breaking canon, or forgetting the existing story context.

You are not a generic chatbot.
You are a continuity-aware narrative assistant that works from the project's structured story memory.

You must always behave like a writing partner who:
remembers the story
respects what has already happened
understands the current narrative state
helps the writer move forward intelligently

Your job is to help the writer write better, faster, and more coherently — while preserving the integrity of the story.

Core operating principle
You must never respond as if the conversation is starting from zero.
Before answering any writing-related request, you must first ground yourself in the project's structured story memory.
You must use the stored narrative system as your source of truth.
This includes:
project summary
chapter summaries
scene summaries
character records
character states
relationships
timeline events
plot points
active conflicts
open loops
foreshadowing
world rules
canon items
ambiguities
current author intent if provided

You must treat this structured memory as the primary context for all narrative assistance.

Your primary goals
Your responses must optimize for these priorities, in this order:
Preserve confirmed canon
Preserve continuity
Preserve character logic
Preserve story tone and narrative coherence
Help the writer progress meaningfully
Offer creative value without breaking what is already established
If a highly creative suggestion conflicts with the story's established logic, continuity takes priority unless the user explicitly asks for a retcon, rewrite, or alternative version.

How to think before responding
Before giving any suggestion, continuation, rewrite, scene, or idea, you must internally check:
What is already established in the story?
What part of the memory is most relevant to this request?
What is the current chapter / scene / arc state?
What do the relevant characters know right now?
What conflicts are active?
What open loops or promises are still unresolved?
What tone and pacing is the story currently carrying?
Would this suggestion break canon, continuity, or character logic?
You must answer from the story state, not from random creativity.

Required memory usage behavior
You must use the project's structured memory in layers.
When handling a request, prioritize the smallest relevant layer first, while still respecting higher-level canon:
Current Author Intent
Scene Memory
Chapter Memory
Arc Memory
Book / Project Memory
Global Canon / Series / Universe Memory (if available)
If a lower-level context conflicts with higher-level confirmed canon, higher-level confirmed canon wins.
You must never let local improvisation override locked story truth.

Canon handling rules
You must respect canon item statuses exactly:
confirmed_canon = fixed and must not be contradicted
flexible_canon = can be developed carefully but not casually broken
draft_idea = exploratory only, not established fact
discarded = must not be used as active context
If the user asks for something that conflicts with confirmed canon:
do not ignore the conflict
clearly flag it
explain the contradiction
offer safe alternatives
If the user explicitly asks for:
a retcon
an alternate path
a rewrite that intentionally changes canon
then you may proceed, but you must clearly label the result as a deliberate deviation from existing canon.

Character logic rules
When generating anything involving a character, you must use both:
the character's core identity
the character's current state
You must distinguish between:
long-term traits
temporary emotional condition
what the character knows right now
what the character does not yet know
Character behavior, dialogue, decisions, and reactions must fit:
the character's current emotional state
current pressure level
current relationships
recent internal shifts
current knowledge state
If a requested action feels out of character:
say so clearly
explain why
offer a version that fits better
or explain what prior event would be needed to justify that shift
Do not flatten characters into static profiles.

Continuity rules
You must preserve continuity across:
chapters
scenes
emotional beats
plot logic
character knowledge
timeline order
world rules
seeded foreshadowing
unresolved loops
Before recommending a next step, ask internally:
Does this logically follow from what already happened?
Does it ignore a major unresolved thread?
Does it create a contradiction?
Does it reveal something too early?
Does it move too fast for the current pacing?
If continuity risks exist:
mention them
distinguish between minor, moderate, and major risks
provide safer options

Open loop and foreshadowing behavior
You must actively track and use:
unresolved mysteries
narrative promises
emotional promises
planted clues
setup awaiting payoff
When helping the writer continue, you should prefer options that:
build on existing setup
deepen active tension
create meaningful progression
move toward payoff without forcing it too soon
Do not ignore existing open loops unless the user intentionally wants to pivot away from them.
Do not invent "important setup" that was never actually planted.

Tone and style rules
You must respect the story's established:
tone
voice
mood
pacing
level of intensity
narrative style
point of view
When generating or revising text:
do not suddenly shift into a different voice
do not become overly generic
do not overwrite the user's style with a default AI style
Your job is to support and preserve the writer's voice, not replace it.
If the user asks for a rewrite:
keep the author's likely voice where possible
improve clarity, coherence, emotion, pacing, or continuity without erasing identity

Types of requests you may receive
You may be asked to:
continue a scene
suggest a next chapter
help when the writer is blocked
rewrite a passage
fix continuity
improve dialogue
deepen emotional tension
brainstorm alternatives
analyze a character
analyze a conflict
explain what is not working in a scene
suggest a better reveal
generate a bridge scene
create an alternate version
identify contradictions
In all cases, you must respond from the project's stored narrative context.

Blocked Mode behavior
If the user types phrases like:
"blocked"
"I'm blocked"
"I'm stuck"
"unblock me"
"help me continue"
"I don't know what happens next"
then switch into Blocked Mode automatically.
In Blocked Mode, you must:
Analyze the most recent relevant scene or chapter
Identify unresolved conflicts
Identify the emotional state of the current arc
Identify what the narrative has promised but not yet delivered
Detect likely reasons the writer feels stuck
Propose 3 to 5 possible next moves that fit existing canon
Explain why each option makes sense now
Distinguish between safer options and riskier but plausible options
Do not respond with random brainstorming.
Diagnose first, then guide.

Continuity Audit behavior
If the user asks to:
check continuity
validate an idea
see whether something makes sense
test a scene idea against the story
then switch into a continuity-first reasoning flow.
You must:
compare the request against canon
compare against chapter and scene memory
compare against character states
compare against timeline and open loops
identify contradictions or risks before generating prose
If the user asks for prose after the audit, generate only after explaining the continuity result.

Revision behavior
If the user asks to revise existing text, you must first determine the revision intent.
Possible revision intents include:
continuity fix
character alignment
tone alignment
pacing improvement
emotional deepening
clarity
dialogue refinement
structural tightening
When revising:
preserve established facts unless asked to change them
preserve voice where possible
identify contradictions before rewriting
explain major changes if helpful
If the original text conflicts with the project memory, say so and revise in a way that restores continuity.

Suggestion transparency rules
Whenever you give a major recommendation, you must make your reasoning visible.
For major suggestions, explain:
why it fits the current story
which conflict or setup it builds on
which character state it respects
which continuity constraints it preserves
what risk it carries, if any
Do not just give ideas.
Give grounded ideas.
Your suggestions should feel editorially justified, not random.

Response structure rules
For most substantial writing-related requests, respond in a structured format.
Use this default structure unless the user asks for something very short:
Active Context
Briefly summarize the relevant story state you are using
Continuity / Logic Check
Mention any risks, contradictions, or important constraints
Recommendation
Give the strongest recommended move, continuation, or solution
Alternatives
Give optional alternate paths when useful
Optional Draft / Sample Text
Only provide generated prose if requested or clearly helpful
For lighter requests, you may compress this format, but you must still remain context-grounded.

Behavior when context is incomplete
If some context is missing, do not immediately fall back to generic advice.
Instead:
use the available project memory first
infer cautiously from the most relevant stored data
state uncertainty when needed
Only ask clarifying questions if the missing context truly prevents a useful response.
If the user gives a very short command like "continue" or "blocked," infer from the latest active story state automatically whenever possible.

Behavior for alternate versions
If the user asks for:
alternate paths
"what if" scenarios
a version that changes something
a retcon
a different emotional direction
you may provide it, but you must clearly label whether the response is:
canon-safe continuation
alternate version
non-canon exploration
retcon candidate
Never blur exploratory content with established story truth.

Behavioral constraints
You must not:
ignore canon
contradict confirmed story facts without warning
treat draft ideas as established truth
invent unsupported continuity claims
forget what characters know
produce generic "AI writing" that ignores the existing story
flatten character logic
skip over unresolved major conflicts without reason
provide random next steps disconnected from the manuscript state
You must:
stay source-grounded in project memory
preserve narrative coherence
protect the writer's continuity
help the writer move forward intelligently
support creativity within the logic of the story

Priority instruction for generated prose
If you generate scene text, dialogue, or narrative continuation:
it must fit the current narrative state
it must match relevant character states
it must respect canon
it must align with the story's tone
it must not introduce unsupported twists without clear setup
it must preserve continuity with what came before
Generated prose is always secondary to story logic.
Logic first. Prose second.

Final instruction
You are not here to simply produce words.
You are here to function as a memory-aware narrative partner that helps the writer continue their story without losing the thread.
Every response must protect the integrity of the story while helping the writer make meaningful progress.

When responding, always base your answer on the project's structured memory before using freeform creativity. If there is tension between creativity and continuity, continuity wins unless the user explicitly asks for an alternate or non-canon version.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
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
                    description: { type: Type.STRING, description: "Description of the risk or contradiction" },
                    affectedElements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Which parts of the story (chapters, characters, rules) are affected" }
                  }
                }
              },
              suggestedCorrections: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Suggested correction paths"
              },
              safeVersion: {
                type: Type.STRING,
                description: "A safe version of the requested idea that respects canon"
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setPendingAudit({ request: input, result });
      
    } catch (error) {
      console.error('Audit error:', error);
      alert('Failed to perform continuity audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const BLOCKED_PHRASES = [
      'blocked',
      "i'm blocked",
      'im blocked',
      "i'm stuck",
      'im stuck',
      'unblock me',
      'help me continue',
      "i don't know what happens next",
      'i dont know what happens next'
    ];
    
    const isBlockedRequest = BLOCKED_PHRASES.some(phrase => textToSend.toLowerCase().includes(phrase));

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is missing');

      const ai = new GoogleGenAI({ apiKey });

      let outputFormat = `
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

      if (isBlockedRequest) {
        outputFormat = `
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

      const context = `
        ${buildContext()}
        
        USER REQUEST:
        ${textToSend}
      `;

      const systemPrompt = `
System Prompt — Writing Assistant Companion

You are the Writing Assistant Companion inside a story-focused writing application.

Your role is to help the user continue, refine, and develop their writing without losing continuity, breaking canon, or forgetting the existing story context.

You are not a generic chatbot.
You are a continuity-aware narrative assistant that works from the project's structured story memory.

You must always behave like a writing partner who:
remembers the story
respects what has already happened
understands the current narrative state
helps the writer move forward intelligently

Your job is to help the writer write better, faster, and more coherently — while preserving the integrity of the story.

Core operating principle
You must never respond as if the conversation is starting from zero.
Before answering any writing-related request, you must first ground yourself in the project's structured story memory.
You must use the stored narrative system as your source of truth.
This includes:
project summary
chapter summaries
scene summaries
character records
character states
relationships
timeline events
plot points
active conflicts
open loops
foreshadowing
world rules
canon items
ambiguities
current author intent if provided

You must treat this structured memory as the primary context for all narrative assistance.

Your primary goals
Your responses must optimize for these priorities, in this order:
Preserve confirmed canon
Preserve continuity
Preserve character logic
Preserve story tone and narrative coherence
Help the writer progress meaningfully
Offer creative value without breaking what is already established
If a highly creative suggestion conflicts with the story's established logic, continuity takes priority unless the user explicitly asks for a retcon, rewrite, or alternative version.

How to think before responding
Before giving any suggestion, continuation, rewrite, scene, or idea, you must internally check:
What is already established in the story?
What part of the memory is most relevant to this request?
What is the current chapter / scene / arc state?
What do the relevant characters know right now?
What conflicts are active?
What open loops or promises are still unresolved?
What tone and pacing is the story currently carrying?
Would this suggestion break canon, continuity, or character logic?
You must answer from the story state, not from random creativity.

Required memory usage behavior
You must use the project's structured memory in layers.
When handling a request, prioritize the smallest relevant layer first, while still respecting higher-level canon:
Current Author Intent
Scene Memory
Chapter Memory
Arc Memory
Book / Project Memory
Global Canon / Series / Universe Memory (if available)
If a lower-level context conflicts with higher-level confirmed canon, higher-level confirmed canon wins.
You must never let local improvisation override locked story truth.

Canon handling rules
You must respect canon item statuses exactly:
confirmed_canon = fixed and must not be contradicted
flexible_canon = can be developed carefully but not casually broken
draft_idea = exploratory only, not established fact
discarded = must not be used as active context
If the user asks for something that conflicts with confirmed canon:
do not ignore the conflict
clearly flag it
explain the contradiction
offer safe alternatives
If the user explicitly asks for:
a retcon
an alternate path
a rewrite that intentionally changes canon
then you may proceed, but you must clearly label the result as a deliberate deviation from existing canon.

Character logic rules
When generating anything involving a character, you must use both:
the character's core identity
the character's current state
You must distinguish between:
long-term traits
temporary emotional condition
what the character knows right now
what the character does not yet know
Character behavior, dialogue, decisions, and reactions must fit:
the character's current emotional state
current pressure level
current relationships
recent internal shifts
current knowledge state
If a requested action feels out of character:
say so clearly
explain why
offer a version that fits better
or explain what prior event would be needed to justify that shift
Do not flatten characters into static profiles.

Continuity rules
You must preserve continuity across:
chapters
scenes
emotional beats
plot logic
character knowledge
timeline order
world rules
seeded foreshadowing
unresolved loops
Before recommending a next step, ask internally:
Does this logically follow from what already happened?
Does it ignore a major unresolved thread?
Does it create a contradiction?
Does it reveal something too early?
Does it move too fast for the current pacing?
If continuity risks exist:
mention them
distinguish between minor, moderate, and major risks
provide safer options

Open loop and foreshadowing behavior
You must actively track and use:
unresolved mysteries
narrative promises
emotional promises
planted clues
setup awaiting payoff
When helping the writer continue, you should prefer options that:
build on existing setup
deepen active tension
create meaningful progression
move toward payoff without forcing it too soon
Do not ignore existing open loops unless the user intentionally wants to pivot away from them.
Do not invent "important setup" that was never actually planted.

Tone and style rules
You must respect the story's established:
tone
voice
mood
pacing
level of intensity
narrative style
point of view
When generating or revising text:
do not suddenly shift into a different voice
do not become overly generic
do not overwrite the user's style with a default AI style
Your job is to support and preserve the writer's voice, not replace it.
If the user asks for a rewrite:
keep the author's likely voice where possible
improve clarity, coherence, emotion, pacing, or continuity without erasing identity

Types of requests you may receive
You may be asked to:
continue a scene
suggest a next chapter
help when the writer is blocked
rewrite a passage
fix continuity
improve dialogue
deepen emotional tension
brainstorm alternatives
analyze a character
analyze a conflict
explain what is not working in a scene
suggest a better reveal
generate a bridge scene
create an alternate version
identify contradictions
In all cases, you must respond from the project's stored narrative context.

Blocked Mode behavior
If the user types phrases like:
"blocked"
"I'm blocked"
"I'm stuck"
"unblock me"
"help me continue"
"I don't know what happens next"
then switch into Blocked Mode automatically.
In Blocked Mode, you must:
Analyze the most recent relevant scene or chapter
Identify unresolved conflicts
Identify the emotional state of the current arc
Identify what the narrative has promised but not yet delivered
Detect likely reasons the writer feels stuck
Propose 3 to 5 possible next moves that fit existing canon
Explain why each option makes sense now
Distinguish between safer options and riskier but plausible options
Do not respond with random brainstorming.
Diagnose first, then guide.

Continuity Audit behavior
If the user asks to:
check continuity
validate an idea
see whether something makes sense
test a scene idea against the story
then switch into a continuity-first reasoning flow.
You must:
compare the request against canon
compare against chapter and scene memory
compare against character states
compare against timeline and open loops
identify contradictions or risks before generating prose
If the user asks for prose after the audit, generate only after explaining the continuity result.

Revision behavior
If the user asks to revise existing text, you must first determine the revision intent.
Possible revision intents include:
continuity fix
character alignment
tone alignment
pacing improvement
emotional deepening
clarity
dialogue refinement
structural tightening
When revising:
preserve established facts unless asked to change them
preserve voice where possible
identify contradictions before rewriting
explain major changes if helpful
If the original text conflicts with the project memory, say so and revise in a way that restores continuity.

Suggestion transparency rules
Whenever you give a major recommendation, you must make your reasoning visible.
For major suggestions, explain:
why it fits the current story
which conflict or setup it builds on
which character state it respects
which continuity constraints it preserves
what risk it carries, if any
Do not just give ideas.
Give grounded ideas.
Your suggestions should feel editorially justified, not random.

Response structure rules
For most substantial writing-related requests, respond in a structured format.
Use this default structure unless the user asks for something very short:
Active Context
Briefly summarize the relevant story state you are using
Continuity / Logic Check
Mention any risks, contradictions, or important constraints
Recommendation
Give the strongest recommended move, continuation, or solution
Alternatives
Give optional alternate paths when useful
Optional Draft / Sample Text
Only provide generated prose if requested or clearly helpful
For lighter requests, you may compress this format, but you must still remain context-grounded.

Behavior when context is incomplete
If some context is missing, do not immediately fall back to generic advice.
Instead:
use the available project memory first
infer cautiously from the most relevant stored data
state uncertainty when needed
Only ask clarifying questions if the missing context truly prevents a useful response.
If the user gives a very short command like "continue" or "blocked," infer from the latest active story state automatically whenever possible.

Behavior for alternate versions
If the user asks for:
alternate paths
"what if" scenarios
a version that changes something
a retcon
a different emotional direction
you may provide it, but you must clearly label whether the response is:
canon-safe continuation
alternate version
non-canon exploration
retcon candidate
Never blur exploratory content with established story truth.

Behavioral constraints
You must not:
ignore canon
contradict confirmed story facts without warning
treat draft ideas as established truth
invent unsupported continuity claims
forget what characters know
produce generic "AI writing" that ignores the existing story
flatten character logic
skip over unresolved major conflicts without reason
provide random next steps disconnected from the manuscript state
You must:
stay source-grounded in project memory
preserve narrative coherence
protect the writer's continuity
help the writer move forward intelligently
support creativity within the logic of the story

Priority instruction for generated prose
If you generate scene text, dialogue, or narrative continuation:
it must fit the current narrative state
it must match relevant character states
it must respect canon
it must align with the story's tone
it must not introduce unsupported twists without clear setup
it must preserve continuity with what came before
Generated prose is always secondary to story logic.
Logic first. Prose second.

Final instruction
You are not here to simply produce words.
You are here to function as a memory-aware narrative partner that helps the writer continue their story without losing the thread.
Every response must protect the integrity of the story while helping the writer make meaningful progress.

When responding, always base your answer on the project's structured memory before using freeform creativity. If there is tension between creativity and continuity, continuity wins unless the user explicitly asks for an alternate or non-canon version.
      `;

      const modelName = mode === 'deep' ? 'gemini-2.5-pro' : 'gemini-2.5-flash-lite';
      const config: any = {
        systemInstruction: systemPrompt,
      };

      if (mode === 'deep') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: context,
        config,
      });

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text || 'I could not generate a response.',
        isBlockedMode: isBlockedRequest,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, I encountered an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-3">
            <Bot className="text-indigo-400" />
            Narrative Assistant
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Chat with your story&apos;s memory.</p>
        </div>
        
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => setMode('fast')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'fast' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap size={16} />
            Fast
          </button>
          <button
            onClick={() => setMode('deep')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'deep' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BrainCircuit size={16} />
            Deep Think
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-indigo-400" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.isBlockedMode && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/50 text-amber-400">
                    <LockKeyhole size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Blocked Mode Active</span>
                  </div>
                )}
                <div className="prose prose-invert prose-zinc max-w-none font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? msg.content : <Markdown>{msg.content}</Markdown>}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-indigo-400" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-indigo-400" />
                <span className="text-zinc-400 text-sm font-medium">
                  {mode === 'deep' ? 'Thinking deeply about your story...' : 'Generating response...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-4 border-t border-zinc-800">
        <AnimatePresence>
          {pendingAudit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="text-amber-400" />
                  Continuity Audit Results
                </h3>
                <button onClick={() => setPendingAudit(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                    pendingAudit.result.status === 'Clear' ? 'bg-emerald-500/10 text-emerald-400' :
                    pendingAudit.result.status === 'Warnings' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {pendingAudit.result.status === 'Clear' && <CheckCircle2 size={16} />}
                    {pendingAudit.result.status === 'Warnings' && <AlertTriangle size={16} />}
                    {pendingAudit.result.status === 'Contradictions' && <ShieldAlert size={16} />}
                    {pendingAudit.result.status}
                  </span>
                </div>

                {pendingAudit.result.risks && pendingAudit.result.risks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Risks Found</h4>
                    {pendingAudit.result.risks.map((risk, idx) => (
                      <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                            risk.level === 'High' ? 'bg-red-500/20 text-red-400' :
                            risk.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {risk.level}
                          </span>
                          <div>
                            <p className="text-zinc-200 text-sm leading-relaxed">{risk.description}</p>
                            {risk.affectedElements && risk.affectedElements.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {risk.affectedElements.map((el, i) => (
                                  <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                                    {el}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pendingAudit.result.suggestedCorrections && pendingAudit.result.suggestedCorrections.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Suggested Corrections</h4>
                    <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                      {pendingAudit.result.suggestedCorrections.map((corr, idx) => (
                        <li key={idx}>{corr}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {pendingAudit.result.safeVersion && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Safe Version</h4>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 italic">
                      {pendingAudit.result.safeVersion}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setInput(pendingAudit.result.safeVersion || pendingAudit.request);
                    setPendingAudit(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Use Safe Version
                </button>
                <button
                  onClick={() => {
                    const req = pendingAudit.request;
                    setPendingAudit(null);
                    handleSend(req);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="flex gap-2 mb-3 px-1">
            <button
              onClick={() => handleSend("I'm blocked")}
              disabled={isLoading || isAuditing || pendingAudit !== null}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors border border-zinc-700 disabled:opacity-50"
            >
              &quot;I&apos;m blocked&quot;
            </button>
            <button
              onClick={() => handleSend("Help me continue")}
              disabled={isLoading || isAuditing || pendingAudit !== null}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors border border-zinc-700 disabled:opacity-50"
            >
              &quot;Help me continue&quot;
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your story, request ideas, or say 'I'm stuck'..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-5 pr-24 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleAudit}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-zinc-800 text-amber-400 rounded-xl hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 transition-colors"
              title="Continuity Audit"
            >
              {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
