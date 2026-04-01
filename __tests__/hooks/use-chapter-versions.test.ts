import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/types/chapter-version', () => {
  let store: any[] = [];
  return {
    readVersions: vi.fn((chapterId: string) => store.filter(v => v.chapterId === chapterId)),
    addVersion: vi.fn((chapterId: string, content: string, label: string, source: string, isCanonical: boolean) => {
      const v = {
        id: `v-${store.length}`,
        chapterId,
        content,
        label,
        source,
        isCanonical,
        createdAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).filter(Boolean).length,
      };
      store.push(v);
      return v;
    }),
    setCanonical: vi.fn((versionId: string) => {
      for (const v of store) {
        v.isCanonical = v.id === versionId;
      }
    }),
    deleteVersion: vi.fn((versionId: string) => {
      store = store.filter(v => v.id !== versionId);
    }),
    renameVersion: vi.fn((versionId: string, newLabel: string) => {
      const v = store.find(v2 => v2.id === versionId);
      if (v) v.label = newLabel;
    }),
    ensureInitialVersion: vi.fn((chapterId: string, content: string) => {
      if (store.some(v => v.chapterId === chapterId)) return store.filter(v => v.chapterId === chapterId);
      if (!content.trim()) return [];
      const v = {
        id: `v-${store.length}`,
        chapterId,
        content,
        label: 'Version A',
        source: 'auto-snapshot',
        isCanonical: true,
        createdAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).filter(Boolean).length,
      };
      store.push(v);
      return [v];
    }),
    getCanonicalVersion: vi.fn(),
    __resetStore: () => { store = []; },
  };
});

describe('useChapterVersions', () => {
  beforeEach(async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    mod.__resetStore();
    vi.clearAllMocks();
  });

  async function importHook() {
    const { useChapterVersions } = await import('@/hooks/use-chapter-versions');
    return useChapterVersions;
  }

  it('initializes with versions from ensureInitialVersion', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Hello world'));

    expect(result.current.versions).toHaveLength(1);
    expect(result.current.versions[0].label).toBe('Version A');
    expect(result.current.versions[0].chapterId).toBe('ch-1');
    expect(result.current.versions[0].isCanonical).toBe(true);
  });

  it('returns versionCount matching versions length', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content here'));

    expect(result.current.versionCount).toBe(result.current.versions.length);
    expect(result.current.versionCount).toBe(1);
  });

  it('activeVersion returns canonical version', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    expect(result.current.activeVersion).not.toBeNull();
    expect(result.current.activeVersion!.isCanonical).toBe(true);
    expect(result.current.activeVersion!.id).toBe(result.current.versions[0].id);
  });

  it('activeVersion returns first version when none is canonical', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    // Pre-populate store with a non-canonical version
    mod.__resetStore();
    mod.ensureInitialVersion.mockImplementationOnce((chapterId: string, content: string) => {
      const v = {
        id: 'v-non-canonical',
        chapterId,
        content,
        label: 'Draft',
        source: 'manual',
        isCanonical: false,
        createdAt: new Date().toISOString(),
        wordCount: content.split(/\s+/).filter(Boolean).length,
      };
      return [v];
    });

    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    // No canonical, so falls back to first version
    expect(result.current.activeVersion).not.toBeNull();
    expect(result.current.activeVersion!.id).toBe('v-non-canonical');
  });

  it('createVersion calls addVersion and refreshes', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Initial content'));

    expect(result.current.versionCount).toBe(1);

    act(() => {
      const created = result.current.createVersion('Branch content', 'Version B', 'manual');
      expect(created.label).toBe('Version B');
      expect(created.content).toBe('Branch content');
    });

    expect(mod.addVersion).toHaveBeenCalledWith('ch-1', 'Branch content', 'Version B', 'manual', false);
    expect(mod.readVersions).toHaveBeenCalled();
    expect(result.current.versionCount).toBe(2);
  });

  it('switchVersion returns found version', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    const versionId = result.current.versions[0].id;
    let found: any;
    act(() => {
      found = result.current.switchVersion(versionId);
    });

    expect(found).not.toBeNull();
    expect(found.id).toBe(versionId);
  });

  it('switchVersion returns null for unknown id', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    let found: any;
    act(() => {
      found = result.current.switchVersion('nonexistent-id');
    });

    expect(found).toBeNull();
  });

  it('markCanonical calls setCanonical and refreshes', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Initial'));

    // Create a second version first
    act(() => {
      result.current.createVersion('Alt content', 'Version B', 'manual');
    });

    const secondVersionId = result.current.versions[1].id;

    act(() => {
      result.current.markCanonical(secondVersionId);
    });

    expect(mod.setCanonical).toHaveBeenCalledWith(secondVersionId);
    expect(mod.readVersions).toHaveBeenCalled();
  });

  it('rename calls renameVersion and refreshes', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    const versionId = result.current.versions[0].id;

    act(() => {
      result.current.rename(versionId, 'Renamed Draft');
    });

    expect(mod.renameVersion).toHaveBeenCalledWith(versionId, 'Renamed Draft');
    expect(mod.readVersions).toHaveBeenCalled();
  });

  it('remove calls deleteVersion and refreshes', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    // Add a second version so we can remove the first
    act(() => {
      result.current.createVersion('Second version', 'Version B', 'manual');
    });

    expect(result.current.versionCount).toBe(2);
    const firstId = result.current.versions[0].id;

    act(() => {
      result.current.remove(firstId);
    });

    expect(mod.deleteVersion).toHaveBeenCalledWith(firstId);
    expect(mod.readVersions).toHaveBeenCalled();
    expect(result.current.versionCount).toBe(1);
  });

  it('refresh re-reads versions from storage', async () => {
    const mod = await import('@/lib/types/chapter-version') as any;
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', 'Some content'));

    const callCountBefore = mod.readVersions.mock.calls.length;

    act(() => {
      result.current.refresh();
    });

    expect(mod.readVersions.mock.calls.length).toBeGreaterThan(callCountBefore);
    expect(mod.readVersions).toHaveBeenCalledWith('ch-1');
  });

  it('returns null activeVersion when no versions exist (empty content)', async () => {
    const useChapterVersions = await importHook();
    const { result } = renderHook(() => useChapterVersions('ch-1', ''));

    expect(result.current.versions).toHaveLength(0);
    expect(result.current.activeVersion).toBeNull();
    expect(result.current.versionCount).toBe(0);
  });
});
