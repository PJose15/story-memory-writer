const VERSIONS_KEY = 'zagafy_chapter_versions';

export type VersionSource = 'manual' | 'scene-change' | 'auto-snapshot';

export interface ChapterVersion {
  id: string;
  chapterId: string;
  label: string;
  content: string;
  createdAt: string; // ISO 8601
  isCanonical: boolean;
  source: VersionSource;
  wordCount: number;
}

function isVersionSource(v: unknown): v is VersionSource {
  return v === 'manual' || v === 'scene-change' || v === 'auto-snapshot';
}

function isChapterVersion(v: unknown): v is ChapterVersion {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.chapterId === 'string' &&
    typeof o.label === 'string' &&
    typeof o.content === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.isCanonical === 'boolean' &&
    isVersionSource(o.source) &&
    typeof o.wordCount === 'number'
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readAllVersions(): ChapterVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChapterVersion);
  } catch {
    return [];
  }
}

function writeAllVersions(versions: ChapterVersion[]): void {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  } catch {
    // Quota exceeded — best effort
  }
}

export function readVersions(chapterId: string): ChapterVersion[] {
  return readAllVersions().filter(v => v.chapterId === chapterId);
}

export function addVersion(
  chapterId: string,
  content: string,
  label: string,
  source: VersionSource,
  isCanonical = false
): ChapterVersion {
  const all = readAllVersions();

  // If marking as canonical, unmark existing canonical for this chapter
  if (isCanonical) {
    for (const v of all) {
      if (v.chapterId === chapterId && v.isCanonical) {
        v.isCanonical = false;
      }
    }
  }

  const version: ChapterVersion = {
    id: crypto.randomUUID(),
    chapterId,
    label,
    content,
    createdAt: new Date().toISOString(),
    isCanonical,
    source,
    wordCount: countWords(content),
  };

  all.push(version);
  writeAllVersions(all);
  return version;
}

export function setCanonical(versionId: string): void {
  const all = readAllVersions();
  const target = all.find(v => v.id === versionId);
  if (!target) return;

  for (const v of all) {
    if (v.chapterId === target.chapterId) {
      v.isCanonical = v.id === versionId;
    }
  }
  writeAllVersions(all);
}

export function deleteVersion(versionId: string): void {
  const all = readAllVersions();
  const filtered = all.filter(v => v.id !== versionId);
  writeAllVersions(filtered);
}

export function renameVersion(versionId: string, newLabel: string): void {
  const all = readAllVersions();
  const target = all.find(v => v.id === versionId);
  if (target) {
    target.label = newLabel;
    writeAllVersions(all);
  }
}

/**
 * Auto-migrate: creates "Version A" from existing chapter content
 * if no versions exist for this chapter yet.
 */
export function ensureInitialVersion(chapterId: string, currentContent: string): ChapterVersion[] {
  const existing = readVersions(chapterId);
  if (existing.length > 0) return existing;

  if (currentContent.trim().length === 0) return [];

  const version = addVersion(chapterId, currentContent, 'Version A', 'auto-snapshot', true);
  return [version];
}

export function getCanonicalVersion(chapterId: string): ChapterVersion | null {
  const versions = readVersions(chapterId);
  return versions.find(v => v.isCanonical) ?? null;
}
