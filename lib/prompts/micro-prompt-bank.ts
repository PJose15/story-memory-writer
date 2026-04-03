type MicroPromptCategory = 'character' | 'sensory' | 'tension' | 'emotion' | 'decision';

interface LocalMicroPrompt {
  text: string;
  category: MicroPromptCategory;
  language: 'en' | 'es';
}

const MICRO_PROMPTS: LocalMicroPrompt[] = [
  // CHARACTER — English
  { text: 'What is your character hiding from themselves right now?', category: 'character', language: 'en' },
  { text: 'If your character could say one honest thing, what would it be?', category: 'character', language: 'en' },
  { text: 'What does your character want but refuse to admit?', category: 'character', language: 'en' },
  { text: 'What memory keeps surfacing in your character\'s mind right now?', category: 'character', language: 'en' },
  { text: 'What would your character never forgive themselves for?', category: 'character', language: 'en' },
  // CHARACTER — Spanish
  { text: '¿Qué está ocultándose tu personaje a sí mismo en este momento?', category: 'character', language: 'es' },
  { text: 'Si tu personaje pudiera decir una cosa honesta, ¿qué sería?', category: 'character', language: 'es' },
  { text: '¿Qué quiere tu personaje pero se niega a admitir?', category: 'character', language: 'es' },
  { text: '¿Qué recuerdo sigue apareciendo en la mente de tu personaje?', category: 'character', language: 'es' },
  { text: '¿Qué es lo que tu personaje jamás se perdonaría?', category: 'character', language: 'es' },

  // SENSORY — English
  { text: 'What does this room smell like right now?', category: 'sensory', language: 'en' },
  { text: 'What texture is your character touching in this scene?', category: 'sensory', language: 'en' },
  { text: 'What sound keeps repeating in the background?', category: 'sensory', language: 'en' },
  { text: 'What is the light doing in this moment?', category: 'sensory', language: 'en' },
  { text: 'What taste lingers in your character\'s mouth?', category: 'sensory', language: 'en' },
  // SENSORY — Spanish
  { text: '¿A qué huele este lugar en este momento?', category: 'sensory', language: 'es' },
  { text: '¿Qué textura está tocando tu personaje en esta escena?', category: 'sensory', language: 'es' },
  { text: '¿Qué sonido se repite en el fondo?', category: 'sensory', language: 'es' },
  { text: '¿Qué está haciendo la luz en este momento?', category: 'sensory', language: 'es' },
  { text: '¿Qué sabor persiste en la boca de tu personaje?', category: 'sensory', language: 'es' },

  // TENSION — English
  { text: 'What could go terribly wrong in the next thirty seconds?', category: 'tension', language: 'en' },
  { text: 'What secret in this scene is about to be exposed?', category: 'tension', language: 'en' },
  { text: 'Who in this scene is lying, and what happens if they are caught?', category: 'tension', language: 'en' },
  { text: 'What is the one thing your character must not say right now?', category: 'tension', language: 'en' },
  { text: 'What deadline is ticking in the background of this scene?', category: 'tension', language: 'en' },
  // TENSION — Spanish
  { text: '¿Qué podría salir terriblemente mal en los próximos treinta segundos?', category: 'tension', language: 'es' },
  { text: '¿Qué secreto en esta escena está a punto de ser descubierto?', category: 'tension', language: 'es' },
  { text: '¿Quién en esta escena está mintiendo, y qué pasa si lo descubren?', category: 'tension', language: 'es' },
  { text: '¿Qué es lo que tu personaje no debe decir en este momento?', category: 'tension', language: 'es' },
  { text: '¿Qué fecha límite está corriendo en el fondo de esta escena?', category: 'tension', language: 'es' },

  // EMOTION — English
  { text: 'If this scene had a color, what would it be and why?', category: 'emotion', language: 'en' },
  { text: 'What emotion is your character suppressing right now?', category: 'emotion', language: 'en' },
  { text: 'What would make your character cry in this exact moment?', category: 'emotion', language: 'en' },
  { text: 'What is the emotional temperature of this room?', category: 'emotion', language: 'en' },
  { text: 'What does your character\'s body language reveal that their words do not?', category: 'emotion', language: 'en' },
  // EMOTION — Spanish
  { text: 'Si esta escena tuviera un color, ¿cuál sería y por qué?', category: 'emotion', language: 'es' },
  { text: '¿Qué emoción está reprimiendo tu personaje en este momento?', category: 'emotion', language: 'es' },
  { text: '¿Qué haría llorar a tu personaje en este preciso instante?', category: 'emotion', language: 'es' },
  { text: '¿Cuál es la temperatura emocional de este lugar?', category: 'emotion', language: 'es' },
  { text: '¿Qué revela el lenguaje corporal de tu personaje que sus palabras no dicen?', category: 'emotion', language: 'es' },

  // DECISION — English
  { text: 'What is your character choosing not to do, and what does that cost them?', category: 'decision', language: 'en' },
  { text: 'If your character walks away from this scene, what do they lose forever?', category: 'decision', language: 'en' },
  { text: 'What compromise is your character about to make?', category: 'decision', language: 'en' },
  { text: 'What does your character want more: safety or truth?', category: 'decision', language: 'en' },
  { text: 'What promise is your character about to break?', category: 'decision', language: 'en' },
  // DECISION — Spanish
  { text: '¿Qué está eligiendo no hacer tu personaje, y qué le cuesta eso?', category: 'decision', language: 'es' },
  { text: 'Si tu personaje se va de esta escena, ¿qué pierde para siempre?', category: 'decision', language: 'es' },
  { text: '¿Qué compromiso está a punto de hacer tu personaje?', category: 'decision', language: 'es' },
  { text: '¿Qué quiere más tu personaje: seguridad o verdad?', category: 'decision', language: 'es' },
  { text: '¿Qué promesa está a punto de romper tu personaje?', category: 'decision', language: 'es' },
];

const BLOCK_TYPE_TO_CATEGORY: Record<string, MicroPromptCategory> = {
  fear: 'emotion',
  perfectionism: 'decision',
  direction: 'tension',
  exhaustion: 'sensory',
};

/**
 * Get a local micro-prompt when the AI endpoint is unavailable.
 * Falls back to a curated prompt bank.
 */
export function getLocalMicroPrompt(blockType?: string | null, language?: string): string {
  const lang: 'en' | 'es' = language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const category = blockType ? BLOCK_TYPE_TO_CATEGORY[blockType] : undefined;

  let candidates = MICRO_PROMPTS.filter(p => p.language === lang);

  if (category) {
    const catCandidates = candidates.filter(p => p.category === category);
    if (catCandidates.length > 0) candidates = catCandidates;
  }

  return candidates[Math.floor(Math.random() * candidates.length)].text;
}

export type { MicroPromptCategory, LocalMicroPrompt };
