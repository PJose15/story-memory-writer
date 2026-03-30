import type { InconsistencyResolution, ResolutionAction } from './types';

const STORAGE_KEY = 'zagafy_brain_resolutions';

function readResolutions(): InconsistencyResolution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isResolution);
  } catch {
    return [];
  }
}

function writeResolutions(resolutions: InconsistencyResolution[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolutions));
  } catch {
    // Storage quota exceeded — best effort
  }
}

function isResolution(v: unknown): v is InconsistencyResolution {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.inconsistencyId === 'string' &&
    typeof o.action === 'string' &&
    ['ignore', 'correct', 'intentional'].includes(o.action as string) &&
    typeof o.resolvedAt === 'string'
  );
}

export function getResolutions(): InconsistencyResolution[] {
  return readResolutions();
}

export function resolveInconsistency(
  inconsistencyId: string,
  action: ResolutionAction
): InconsistencyResolution {
  const resolutions = readResolutions();
  const existing = resolutions.findIndex(r => r.inconsistencyId === inconsistencyId);
  const resolution: InconsistencyResolution = {
    inconsistencyId,
    action,
    resolvedAt: new Date().toISOString(),
  };

  if (existing !== -1) {
    resolutions[existing] = resolution;
  } else {
    resolutions.push(resolution);
  }

  writeResolutions(resolutions);
  return resolution;
}

export function unresolveInconsistency(inconsistencyId: string): void {
  const resolutions = readResolutions().filter(r => r.inconsistencyId !== inconsistencyId);
  writeResolutions(resolutions);
}

export function isResolved(inconsistencyId: string): boolean {
  return readResolutions().some(r => r.inconsistencyId === inconsistencyId);
}

export function getResolution(inconsistencyId: string): InconsistencyResolution | undefined {
  return readResolutions().find(r => r.inconsistencyId === inconsistencyId);
}

export function clearAllResolutions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best effort
  }
}
