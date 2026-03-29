'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  readVersions,
  addVersion,
  setCanonical,
  deleteVersion,
  renameVersion,
  ensureInitialVersion,
  getCanonicalVersion,
} from '@/lib/types/chapter-version';
import type { ChapterVersion, VersionSource } from '@/lib/types/chapter-version';

interface UseChapterVersionsReturn {
  versions: ChapterVersion[];
  activeVersion: ChapterVersion | null;
  createVersion: (content: string, label: string, source: VersionSource) => ChapterVersion;
  switchVersion: (versionId: string) => ChapterVersion | null;
  markCanonical: (versionId: string) => void;
  rename: (versionId: string, newLabel: string) => void;
  remove: (versionId: string) => void;
  refresh: () => void;
  versionCount: number;
}

export function useChapterVersions(chapterId: string, currentContent: string): UseChapterVersionsReturn {
  const [versions, setVersions] = useState<ChapterVersion[]>(() =>
    ensureInitialVersion(chapterId, currentContent)
  );

  const activeVersion = useMemo(() => {
    return versions.find(v => v.isCanonical) ?? versions[0] ?? null;
  }, [versions]);

  const refresh = useCallback(() => {
    setVersions(readVersions(chapterId));
  }, [chapterId]);

  const createVersion = useCallback((content: string, label: string, source: VersionSource): ChapterVersion => {
    const version = addVersion(chapterId, content, label, source, false);
    setVersions(readVersions(chapterId));
    return version;
  }, [chapterId]);

  const switchVersion = useCallback((versionId: string): ChapterVersion | null => {
    const found = versions.find(v => v.id === versionId);
    return found ?? null;
  }, [versions]);

  const markCanonical = useCallback((versionId: string) => {
    setCanonical(versionId);
    setVersions(readVersions(chapterId));
  }, [chapterId]);

  const rename = useCallback((versionId: string, newLabel: string) => {
    renameVersion(versionId, newLabel);
    setVersions(readVersions(chapterId));
  }, [chapterId]);

  const remove = useCallback((versionId: string) => {
    deleteVersion(versionId);
    setVersions(readVersions(chapterId));
  }, [chapterId]);

  return {
    versions,
    activeVersion,
    createVersion,
    switchVersion,
    markCanonical,
    rename,
    remove,
    refresh,
    versionCount: versions.length,
  };
}
