import type { HeteronymVoice } from '@/lib/heteronym-voice';

export type { HeteronymVoice };

const HETERONYMS_KEY = 'zagafy_heteronyms';
const INITIALIZED_KEY = 'zagafy_heteronyms_initialized';
const ACTIVE_KEY = 'zagafy_active_heteronym';
const GUEST_KEY = 'zagafy_guest_heteronym';

const MAX_HETERONYMS = 10;
const DEFAULT_COLOR = '#6366f1'; // indigo-500

export interface Heteronym {
  id: string;
  name: string;
  bio: string;
  styleNote: string;
  avatarColor: string;
  avatarEmoji: string;
  createdAt: string;
  isDefault: boolean;
  voice?: HeteronymVoice;
}

function isHeteronym(v: unknown): v is Heteronym {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.bio === 'string' &&
    typeof o.styleNote === 'string' &&
    typeof o.avatarColor === 'string' &&
    typeof o.avatarEmoji === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.isDefault === 'boolean'
  );
}

export function readHeteronyms(): Heteronym[] {
  try {
    const raw = localStorage.getItem(HETERONYMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHeteronym);
  } catch {
    return [];
  }
}

export function writeHeteronyms(heteronyms: Heteronym[]): void {
  try {
    localStorage.setItem(HETERONYMS_KEY, JSON.stringify(heteronyms));
  } catch {
    // Storage quota exceeded
  }
}

export function addHeteronym(heteronym: Heteronym): boolean {
  const existing = readHeteronyms();
  if (existing.length >= MAX_HETERONYMS) return false;
  existing.push(heteronym);
  writeHeteronyms(existing);
  return true;
}

export function updateHeteronym(id: string, updates: Partial<Omit<Heteronym, 'id' | 'createdAt' | 'isDefault'>>): void {
  const heteronyms = readHeteronyms();
  const idx = heteronyms.findIndex(h => h.id === id);
  if (idx === -1) return;
  heteronyms[idx] = { ...heteronyms[idx], ...updates };
  writeHeteronyms(heteronyms);
}

export function deleteHeteronym(id: string): void {
  const heteronyms = readHeteronyms();
  const target = heteronyms.find(h => h.id === id);
  if (!target || target.isDefault) return;
  writeHeteronyms(heteronyms.filter(h => h.id !== id));

  // If the deleted heteronym was active, switch to default
  const activeId = getActiveHeteronymId();
  if (activeId === id) {
    const defaultH = heteronyms.find(h => h.isDefault);
    if (defaultH) setActiveHeteronymId(defaultH.id);
  }
}

export function initializeDefaultHeteronym(displayName?: string): Heteronym[] {
  const existing = readHeteronyms();
  if (existing.length > 0) return existing;

  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (initialized === 'true' && existing.length > 0) return existing;
  } catch {
    // Continue to create default
  }

  const defaultHeteronym: Heteronym = {
    id: crypto.randomUUID(),
    name: displayName || 'Myself',
    bio: 'My original writing voice',
    styleNote: '',
    avatarColor: DEFAULT_COLOR,
    avatarEmoji: '✍️',
    createdAt: new Date().toISOString(),
    isDefault: true,
  };

  const heteronyms = [defaultHeteronym];
  writeHeteronyms(heteronyms);
  setActiveHeteronymId(defaultHeteronym.id);

  try {
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch {
    // best effort
  }

  return heteronyms;
}

export function getActiveHeteronymId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveHeteronymId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // best effort
  }
}

export function getGuestHeteronymId(): string | null {
  try {
    return sessionStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

export function setGuestHeteronymId(id: string | null): void {
  try {
    if (id === null) {
      sessionStorage.removeItem(GUEST_KEY);
    } else {
      sessionStorage.setItem(GUEST_KEY, id);
    }
  } catch {
    // best effort
  }
}

export function isAtLimit(): boolean {
  return readHeteronyms().length >= MAX_HETERONYMS;
}

export function getDefaultHeteronym(): Heteronym | undefined {
  return readHeteronyms().find(h => h.isDefault);
}
