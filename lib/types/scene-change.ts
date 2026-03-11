const SCENE_CHANGE_KEY = 'zagafy_scene_change_state';
const SCENE_CHANGE_RETURN_KEY = 'zagafy_scene_change_return';

export interface SceneChangeState {
  active: boolean;
  originalChapterId: string;
  originalChapterTitle: string;
  originalCursorPosition: number;
  wordCountAtDeparture: number;
  alternateChapterId: string;
  wordCountAtArrivalAlternate: number;
  departureTimestamp: string;
  returnAt: string;
  extraTimeGranted: number; // 0..3
}

export interface SceneChangeReturn {
  cursorPosition: number;
  wordsWritten: number;
}

export function isSceneChangeState(v: unknown): v is SceneChangeState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.active === 'boolean' &&
    typeof o.originalChapterId === 'string' &&
    typeof o.originalChapterTitle === 'string' &&
    typeof o.originalCursorPosition === 'number' &&
    typeof o.wordCountAtDeparture === 'number' &&
    typeof o.alternateChapterId === 'string' &&
    typeof o.wordCountAtArrivalAlternate === 'number' &&
    typeof o.departureTimestamp === 'string' &&
    typeof o.returnAt === 'string' &&
    typeof o.extraTimeGranted === 'number'
  );
}

function isSceneChangeReturn(v: unknown): v is SceneChangeReturn {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.cursorPosition === 'number' && typeof o.wordsWritten === 'number';
}

export function readSceneChangeState(): SceneChangeState | null {
  try {
    const raw = localStorage.getItem(SCENE_CHANGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isSceneChangeState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSceneChangeState(state: SceneChangeState): void {
  try {
    localStorage.setItem(SCENE_CHANGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — best effort
  }
}

export function clearSceneChangeState(): void {
  try {
    localStorage.removeItem(SCENE_CHANGE_KEY);
  } catch {
    // best effort
  }
}

export function readSceneChangeReturn(): SceneChangeReturn | null {
  try {
    const raw = localStorage.getItem(SCENE_CHANGE_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isSceneChangeReturn(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSceneChangeReturn(ret: SceneChangeReturn): void {
  try {
    localStorage.setItem(SCENE_CHANGE_RETURN_KEY, JSON.stringify(ret));
  } catch {
    // best effort
  }
}

export function clearSceneChangeReturn(): void {
  try {
    localStorage.removeItem(SCENE_CHANGE_RETURN_KEY);
  } catch {
    // best effort
  }
}
