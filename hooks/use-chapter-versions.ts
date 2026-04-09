'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  readVersions,
  addVersion,
  setCanonical,
  deleteVersion,
  renameVersion,
  ensureInitialVersion,
} from '@/lib/types/chapter-version';
import type { ChapterVersion, VersionSource } from '@/lib/types/chapter-version';

interface UseChapterVersionsReturn {
  versions: ChapterVersion[];
  activeVersion: ChapterVersion | null;
  createVersion: (content: string, label: string, source: VersionSource) => void;
  switchVersion: (versionId: string) => ChapterVersion | null;
  markCanonical: (versionId: string) => void;
  rename: (versionId: string, newLabel: string) => void;
  remove: (versionId: string) => void;
  refresh: () => void;
  versionCount: number;
}

export function useChapterVersions(chapterId: string, currentContent: string): UseChapterVersionsReturn {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);

  // Load versions on mount / chapterId change
  useEffect(() => {
    ensureInitialVersion(chapterId, currentContent).then(setVersions);
  }, [chapterId, currentContent]);

  const activeVersion = useMemo(() => {
    return versions.find(v => v.isCanonical) ?? versions[0] ?? null;
  }, [versions]);

  const refresh = useCallback(() => {
    readVersions(chapterId).then(setVersions);
  }, [chapterId]);

  const createVersion = useCallback((content: string, label: string, source: VersionSource): void => {
    addVersion(chapterId, content, label, source, false).then(() => {
      readVersions(chapterId).then(setVersions);
    });
  }, [chapterId]);

  const switchVersion = useCallback((versionId: string): ChapterVersion | null => {
    const found = versions.find(v => v.id === versionId);
    return found ?? null;
  }, [versions]);

  const markCanonical = useCallback((versionId: string) => {
    setCanonical(versionId).then(() => {
      readVersions(chapterId).then(setVersions);
    });
  }, [chapterId]);

  const rename = useCallback((versionId: string, newLabel: string) => {
    renameVersion(versionId, newLabel).then(() => {
      readVersions(chapterId).then(setVersions);
    });
  }, [chapterId]);

  const remove = useCallback((versionId: string) => {
    deleteVersion(versionId).then(() => {
      readVersions(chapterId).then(setVersions);
    });
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
