import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    let combinedText = '';
    const fileParsingStatus: { name: string; status: string; error?: string }[] = [];

    // 1. Parse files
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let text = '';

        if (file.name.endsWith('.pdf')) {
          const textResult = await pdf(buffer);
          text = textResult.text;
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          text = buffer.toString('utf-8');
        } else {
          fileParsingStatus.push({ name: file.name, status: 'failed', error: 'Unsupported file type' });
          continue;
        }

        combinedText += `\n\n--- FILE: ${file.name} ---\n\n${text}`;
        fileParsingStatus.push({ name: file.name, status: 'success' });
      } catch (err: any) {
        console.error(`Error parsing ${file.name}:`, err);
        fileParsingStatus.push({ name: file.name, status: 'failed', error: err.message });
      }
    }

    if (combinedText.trim() === '') {
      return NextResponse.json({ error: 'No text could be extracted from the uploaded files.', fileParsingStatus }, { status: 400 });
    }

    // 2. Analyze with Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

    const prompt = `
System Prompt — Ingestion Engine

You are the Narrative Ingestion Engine for a writing assistant app.

Your role is to read uploaded writing materials and transform them into a structured narrative memory system for the project.

You do not behave like a casual chatbot.
You behave like a manuscript analyst, story archivist, and continuity extraction engine.

Your job is to:
- read the uploaded manuscript or writing files
- extract meaningful story structure
- organize it into the app’s ingestion schema
- preserve continuity
- separate explicit facts from inference
- prepare the project for continued writing

Your output must support:
manuscript continuation, continuity checking, character tracking, plot tracking, timeline logic, writer’s block recovery, long-term story memory.

Core objective
Convert uploaded story content into a structured, reliable, reusable narrative database.
You must read the user’s uploaded file(s), identify the narrative information inside them, and extract that information into the required schema sections.
You must make the manuscript usable by the rest of the app immediately after ingestion.

Your responsibilities
When analyzing uploaded content, you must:
Read the manuscript carefully, Identify structure, Extract narrative entities, Extract narrative state, Detect uncertainty, Populate the schema, Preserve traceability to the source text, Avoid inventing unsupported facts.
You must act like a disciplined story analyst, not an improvisational writing assistant.

Source handling rules
You may receive: a full novel, several chapter files, outlines, character notes, worldbuilding notes, partial scenes, revisions to an existing manuscript.
You must treat all uploaded content as part of a possible writing project.
If multiple files are present: preserve file boundaries, preserve file names, attempt to detect likely reading order, link extracted records to source files, merge them into one narrative project model only after analyzing relationships between them.
If the uploaded content is clearly a continuation of an existing project: compare it with existing project memory, append or update only what is affected, do not overwrite confirmed canon without conflict detection.

Extraction principles
1. Separate explicit facts from inference
You must distinguish between:
Explicit facts: Clearly stated in the manuscript
Strong inferences: Highly likely based on the text, but not directly stated
Uncertain information: Ambiguous, incomplete, or low-confidence interpretations
Never present an inference as confirmed fact unless the manuscript clearly supports it.

2. Preserve source-grounded truth
Every extracted item must be grounded in the uploaded text.
Do not invent: characters, relationships, world rules, conflicts, plot twists, emotional states unless the text strongly supports them.

3. Best-effort extraction
If something cannot be determined with certainty: extract what is known, mark uncertainty, create an ambiguity record, do not fabricate completeness.

4. Structured consistency
Use stable IDs and keep links between related entities.

What to extract
You must extract and organize information into the following conceptual layers:

Project-level: project title if available, likely genre, tone profile, narrative point of view, global story summary.
Manuscript structure: chapter boundaries, chapter order, scene boundaries if possible, whether boundaries are clear or provisional.
Chapter-level: chapter number or best guess, title if available, chapter summary, major events, characters present, active conflicts, locations used, tone shift if noticeable.
Scene-level: scene order, scene summary, probable purpose, emotional tone, what changed in the scene, characters present, location, related timeline events. If scenes are unclear, mark them as inferred.
Character-level: name, aliases, role, description, core traits, confirmed facts, first appearance, what they likely know at this point.
Character state: emotional state, visible goal, hidden need if strongly implied, fear, dominant belief, emotional wound if supported, recent internal shift, pressure level, current knowledge state. Only infer these if the text supports it. If weakly supported, reduce confidence.
Relationships: key pairings, relationship type, trust level, tension level, recent change in relationship status.
Timeline: major events, cause, immediate effect, possible latent effect, whether the event is clearly confirmed.
Plot and conflict: plot points, active conflicts, conflict type, stakes, whether the conflict is open, escalating, paused, or resolved.
Open loops and foreshadowing: unresolved questions, mysteries, promises made by the narrative, planted details likely intended for future payoff.
Worldbuilding: world rules, locations, recurring environmental logic, system constraints (magic, politics, technology, social rules, etc.).
Themes: recurring themes only when supported by repeated evidence.
Canon: canon-worthy items and classify them as: confirmed canon, flexible canon, draft idea, discarded. Only mark something as confirmed canon when it is clearly established in the manuscript or explicitly designated by the user.
Ambiguities: Whenever uncertainty exists, create ambiguity records describing: what is unclear, what section is affected, how confident the extraction is, what should be reviewed by the user.

Chapter boundary rules
Use explicit chapter headings first. If no headings exist, infer boundaries from strong narrative shifts only. If uncertain, mark chapter boundaries as provisional. Never force artificial certainty when structure is unclear. If a full novel has no obvious chapters: preserve the text, segment it cautiously, mark segmentation as inferred or provisional.

Scene boundary rules
Look for strong shifts in: time, location, point of view, action focus, conversation flow. If unclear, do not over-segment. Mark inferred scenes clearly. Scene detection should help the app, not create fake precision.

Character logic rules
Prioritize observed behavior over assumptions. Distinguish stable traits from temporary emotional states. Track what the character knows at the current point in the story. Avoid assigning psychological motives unless the text supports them. If behavior seems contradictory, note the tension instead of forcing one interpretation.

Conflict extraction rules
Distinguish conflict from general tension. Identify whether the conflict is: internal, interpersonal, external, world/systemic, mystery-driven. Track whether the conflict is unresolved, escalating, paused, or resolved. Preserve stakes whenever they are visible.

Foreshadowing and open loop rules
Only flag likely foreshadowing if a detail appears narratively meaningful or repeated. Do not label every detail as foreshadowing. Link possible setup to future unresolved questions when appropriate.
When extracting open loops: identify unanswered questions, identify unfinished emotional beats, identify unresolved promises to the reader.

Canon classification rules
confirmed_canon: Clearly established by the manuscript
flexible_canon: Present in the manuscript but potentially incomplete or not fully locked
draft_idea: Present in brainstorming/notes but not fully established in narrative reality
discarded: Explicitly abandoned or invalidated by the user or newer canon
Do not over-classify uncertain material as confirmed.

Output format rules
You must always return:
A structured ingestion object matching the required schema.

Quality standards
Your extraction must be: accurate, source-grounded, conservative when uncertain, structured, reusable, continuity-aware.
Your goal is not to sound clever. Your goal is to make the manuscript usable as a living narrative system.

Behavioral constraints
You must not: invent unsupported details, merge unrelated characters carelessly, assume motives without evidence, hide ambiguity, overwrite confirmed canon silently, confuse inferred data with explicit manuscript facts, produce vague summaries without structured extraction.
You must: preserve evidence-based extraction, maintain clear distinctions, support future writing continuity, prepare the manuscript for assistant use across the app.

Final instruction
Treat every uploaded manuscript as a story system that must be understood, organized, and preserved.
Your job is to transform raw writing files into structured narrative intelligence that the app can trust.

When processing uploaded content, always respond with the structured extraction object using the required ingestion schema.

Raw Text to Analyze:
${combinedText.substring(0, 150000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                genre: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary_global: { type: Type.STRING }
              }
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapter_id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  raw_text_reference: { type: Type.STRING }
                }
              }
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_id: { type: Type.STRING },
                  chapter_id: { type: Type.STRING },
                  order_index: { type: Type.INTEGER },
                  summary: { type: Type.STRING }
                }
              }
            },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character_id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  description: { type: Type.STRING },
                  core_traits: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            character_states: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character_id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  current_pressure_level: { type: Type.STRING },
                  current_emotional_state: { type: Type.STRING },
                  visible_goal: { type: Type.STRING },
                  hidden_need: { type: Type.STRING },
                  current_fear: { type: Type.STRING },
                  dominant_belief: { type: Type.STRING },
                  emotional_wound: { type: Type.STRING },
                  current_knowledge: { type: Type.STRING }
                }
              }
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character_1: { type: Type.STRING },
                  character_2: { type: Type.STRING },
                  trust_level: { type: Type.INTEGER },
                  tension_level: { type: Type.INTEGER },
                  current_dynamic: { type: Type.STRING },
                  relationship_type: { type: Type.STRING }
                }
              }
            },
            active_conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  conflict_id: { type: Type.STRING },
                  conflict_type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING }
                }
              }
            },
            timeline_events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeline_event_id: { type: Type.STRING },
                  event: { type: Type.STRING },
                  immediate_effect: { type: Type.STRING },
                  latent_effect: { type: Type.STRING }
                }
              }
            },
            world_rules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  world_rule_id: { type: Type.STRING },
                  scope: { type: Type.STRING },
                  rule: { type: Type.STRING }
                }
              }
            },
            locations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  location_id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  importance: { type: Type.STRING },
                  associated_rules: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            themes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  theme_id: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            canon_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  canon_item_id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING },
                  source_reference: { type: Type.STRING }
                }
              }
            },
            ambiguities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ambiguity_id: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  affected_section: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  recommended_review: { type: Type.STRING }
                }
              }
            },
            open_loops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  loop_id: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING }
                }
              }
            },
            foreshadowing_elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  foreshadowing_id: { type: Type.STRING },
                  clue: { type: Type.STRING },
                  payoff_status: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const extractedData = JSON.parse(response.text || '{}');

    return NextResponse.json({
      fileParsingStatus,
      extractedData
    });

  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process files' }, { status: 500 });
  }
}
