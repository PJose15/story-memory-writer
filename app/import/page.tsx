'use client';

import { useMemo, useState, useRef } from 'react';
import { useStory, type CharacterState } from '@/lib/store';
import type { ExtractedData, ExtractedChapter, ExtractedCharacter, ExtractedCharacterState, ExtractedRelationship, ExtractedConflict, ExtractedTimelineEvent, ExtractedWorldRule, ExtractedLocation, ExtractedTheme, ExtractedCanonItem, ExtractedAmbiguity, ExtractedOpenLoop, ExtractedForeshadowing, ExtractedScene } from '@/lib/types/extracted-data';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/toast';
import { CarvedHeader, ParchmentCard, BrassButton, InkStampButton } from '@/components/antiquarian';

export default function ImportPage() {
  const { state, updateField } = useStory();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'review' | 'success'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Memoized index: character ref (id OR name) → character_state for O(1) lookup during review render
  const characterStateByRef = useMemo(() => {
    const map = new Map<string, ExtractedCharacterState>();
    for (const s of extractedData?.character_states || []) {
      if (s.character_id) map.set(s.character_id, s);
      if (s.name) map.set(s.name, s);
    }
    return map;
  }, [extractedData?.character_states]);

  const lookupState = (c: ExtractedCharacter): ExtractedCharacterState | undefined =>
    (c.character_id && characterStateByRef.get(c.character_id)) || (c.name ? characterStateByRef.get(c.name) : undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    if (direction === 'up' && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === 'down' && index < newFiles.length - 1) {
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    }
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus('uploading');

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('language', state.language || 'English');

    try {
      setUploadStatus('analyzing');
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to parse files');
      }

      const data = await res.json();
      setExtractedData(data.extractedData || {});
      setUploadStatus('review');
    } catch (error: unknown) {
      console.error(error);
      toast(error instanceof Error ? error.message : 'An error occurred during ingestion.', 'error');
      setUploadStatus('idle');
    } finally {
      setIsUploading(false);
    }
  };

  // Deduplicates incoming against existing AND against itself. O(n+m).
  const dedup = <T,>(existing: T[], incoming: T[], key: keyof T): T[] => {
    const normalize = (item: T) => String(item[key] ?? '').toLowerCase().trim();
    const seen = new Set<string>(existing.map(normalize));
    const out: T[] = [];
    for (const item of incoming) {
      const k = normalize(item);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
    return out;
  };

  const handleConfirmImport = () => {
    if (!extractedData) return;

    const rawCharacters = extractedData.characters || [];
    const rawRelationships = extractedData.relationships || [];
    const rawCharacterStates = extractedData.character_states || [];

    // Pre-index: character name/id → stable UUID (O(C))
    const charIdMap = new Map<string, string>();
    for (const c of rawCharacters) {
      if (!c.name) continue;
      const id = c.character_id || crypto.randomUUID();
      charIdMap.set(c.name, id);
      charIdMap.set(c.name.toLowerCase(), id); // case-insensitive fallback
      if (c.character_id) charIdMap.set(c.character_id, id);
    }
    // Helper: resolve character ID with case-insensitive name fallback
    const resolveCharId = (ref: string): string | undefined =>
      charIdMap.get(ref) || charIdMap.get(ref.toLowerCase());

    // Pre-index: ref (name or character_id) → character (O(C))
    const charByRef = new Map<string, ExtractedCharacter>();
    for (const c of rawCharacters) {
      if (c.name) charByRef.set(c.name, c);
      if (c.character_id) charByRef.set(c.character_id, c);
    }

    // Pre-index: character_states keyed by character_id AND name (O(S))
    const stateByRef = new Map<string, ExtractedCharacterState>();
    for (const s of rawCharacterStates) {
      if (s.character_id) stateByRef.set(s.character_id, s);
      if (s.name) stateByRef.set(s.name, s);
    }

    // Pre-index: relationships grouped by source/target ref (O(R))
    const relsBySource = new Map<string, ExtractedRelationship[]>();
    const relsByTarget = new Map<string, ExtractedRelationship[]>();
    const pushRel = (map: Map<string, ExtractedRelationship[]>, key: string | undefined, rel: ExtractedRelationship) => {
      if (!key) return;
      const arr = map.get(key);
      if (arr) arr.push(rel);
      else map.set(key, [rel]);
    };
    for (const r of rawRelationships) {
      pushRel(relsBySource, r.character_1, r);
      pushRel(relsByTarget, r.character_2, r);
    }
    const getRelsFor = (map: Map<string, ExtractedRelationship[]>, name?: string, id?: string): ExtractedRelationship[] => {
      const a = name ? map.get(name) : undefined;
      const b = id && id !== name ? map.get(id) : undefined;
      if (a && b) return [...a, ...b];
      return a || b || [];
    };

    // Merge Characters — now O(C + R) instead of O(C² · R)
    const newCharacters = rawCharacters.map((c: ExtractedCharacter) => {
      const charState = (c.character_id && stateByRef.get(c.character_id)) || (c.name ? stateByRef.get(c.name) : undefined);
      const charId = charIdMap.get(c.name!) || crypto.randomUUID();

      // Find relationships where this character is character_1
      const relsAsSource = getRelsFor(relsBySource, c.name, c.character_id)
        .map((r: ExtractedRelationship) => {
          const resolvedId = resolveCharId(r.character_2!);
          if (!resolvedId) return null; // Skip unresolvable relationships
          const targetChar = charByRef.get(r.character_2!);
          return {
            targetId: resolvedId,
            targetName: targetChar?.name || r.character_2,
            trustLevel: r.trust_level || 50,
            tensionLevel: r.tension_level || 50,
            dynamics: r.current_dynamic || r.relationship_type || ''
          };
        }).filter(Boolean);

      // Find relationships where this character is character_2 (inverse)
      const relsAsTarget = getRelsFor(relsByTarget, c.name, c.character_id)
        .map((r: ExtractedRelationship) => {
          const resolvedId = resolveCharId(r.character_1!);
          if (!resolvedId) return null; // Skip unresolvable relationships
          const sourceChar = charByRef.get(r.character_1!);
          return {
            targetId: resolvedId,
            targetName: sourceChar?.name || r.character_1,
            trustLevel: r.trust_level || 50,
            tensionLevel: r.tension_level || 50,
            dynamics: r.current_dynamic || r.relationship_type || ''
          };
        }).filter(Boolean);

      // Merge and deduplicate by targetId
      const seenTargets = new Set<string>();
      const allRels = [...relsAsSource, ...relsAsTarget].filter((r): r is NonNullable<typeof r> => r !== null);
      const rels = allRels.filter(r => {
        if (seenTargets.has(r.targetId)) return false;
        seenTargets.add(r.targetId);
        return true;
      });

      return {
        id: charId,
        name: c.name!,
        role: c.role || '',
        description: c.description || '',
        coreIdentity: c.core_traits ? c.core_traits.join(', ') : '',
        relationships: '',
        canonStatus: 'draft' as const,
        source: 'ai-inferred' as const,
        currentState: {
          indicator: 'stable' as const,
          pressureLevel: (charState?.current_pressure_level || 'Low') as CharacterState['pressureLevel'],
          emotionalState: charState?.current_emotional_state || '',
          visibleGoal: charState?.visible_goal || '',
          hiddenNeed: charState?.hidden_need || '',
          currentFear: charState?.current_fear || '',
          dominantBelief: charState?.dominant_belief || '',
          emotionalWound: charState?.emotional_wound || '',
          currentKnowledge: charState?.current_knowledge || ''
        },
        dynamicRelationships: rels,
        stateHistory: []
      };
    });

    // Merge Chapters
    const newChapters = (extractedData.chapters || []).map((c: ExtractedChapter, idx: number) => ({
      id: c.chapter_id || crypto.randomUUID(),
      title: c.title || `Chapter ${idx + 1}`,
      summary: c.summary || '',
      content: c.raw_text_reference || '',
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Scenes
    const newScenes = (extractedData.scenes || []).map((s: ExtractedScene) => ({
      id: s.scene_id || crypto.randomUUID(),
      chapterId: s.chapter_id || '',
      title: `Scene ${s.order_index || ''}`,
      summary: s.summary || '',
      content: '',
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Plot Points -> active_conflicts (or we can just map active_conflicts directly)
    const newConflicts = (extractedData.active_conflicts || []).map((c: ExtractedConflict) => ({
      id: c.conflict_id || crypto.randomUUID(),
      title: c.title || c.conflict_type || 'Conflict',
      description: c.description || '',
      status: c.status === 'resolved' ? 'resolved' as const : 'active' as const,
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Timeline -> timeline_events
    const newTimelineEvents = (extractedData.timeline_events || []).map((t: ExtractedTimelineEvent) => ({
      id: t.timeline_event_id || crypto.randomUUID(),
      date: t.event || '', // Using event as date/title for now
      description: t.immediate_effect || '',
      impact: t.latent_effect || '',
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Worldbuilding -> world_rules
    const newWorldRules = (extractedData.world_rules || []).map((w: ExtractedWorldRule) => ({
      id: w.world_rule_id || crypto.randomUUID(),
      category: w.scope || 'Lore',
      rule: w.rule || '',
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Locations
    const newLocations = (extractedData.locations || []).map((l: ExtractedLocation) => ({
      id: l.location_id || crypto.randomUUID(),
      name: l.name || '',
      description: l.description || '',
      importance: l.importance || 'medium',
      associatedRules: l.associated_rules || [],
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Themes
    const newThemes = (extractedData.themes || []).map((t: ExtractedTheme) => ({
      id: t.theme_id || crypto.randomUUID(),
      theme: t.theme || '',
      evidence: t.evidence || [],
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Canon Items
    const newCanonItems = (extractedData.canon_items || []).map((c: ExtractedCanonItem) => ({
      id: c.canon_item_id || crypto.randomUUID(),
      category: c.category || 'other',
      description: c.description || '',
      status: c.status || 'draft_idea',
      sourceReference: c.source_reference || ''
    }));

    // Merge Ambiguities
    const newAmbiguities = (extractedData.ambiguities || []).map((a: ExtractedAmbiguity) => ({
      id: a.ambiguity_id || crypto.randomUUID(),
      issue: a.issue || '',
      affectedSection: a.affected_section || '',
      confidence: a.confidence || 'medium',
      recommendedReview: a.recommended_review || ''
    }));

    // Merge Open Loops
    const newOpenLoops = (extractedData.open_loops || []).map((l: ExtractedOpenLoop) => ({
      id: l.loop_id || crypto.randomUUID(),
      description: l.description || '',
      status: l.status === 'resolved' ? 'closed' as const : 'open' as const,
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    // Merge Foreshadowing
    const newForeshadowing = (extractedData.foreshadowing_elements || []).map((f: ExtractedForeshadowing) => ({
      id: f.foreshadowing_id || crypto.randomUUID(),
      clue: f.clue || '',
      payoff: f.payoff_status || '',
      canonStatus: 'draft' as const,
      source: 'ai-inferred' as const,
    }));

    updateField('characters', [...state.characters, ...dedup(state.characters, newCharacters, 'name')]);
    updateField('chapters', [...state.chapters, ...dedup(state.chapters, newChapters, 'title')]);
    updateField('scenes', [...state.scenes, ...dedup(state.scenes, newScenes, 'title')]);
    updateField('active_conflicts', [...state.active_conflicts, ...dedup(state.active_conflicts, newConflicts, 'title')]);
    updateField('timeline_events', [...state.timeline_events, ...dedup(state.timeline_events, newTimelineEvents, 'description')]);
    updateField('world_rules', [...state.world_rules, ...dedup(state.world_rules, newWorldRules, 'rule')]);
    updateField('locations', [...(state.locations || []), ...dedup(state.locations || [], newLocations, 'name')]);
    updateField('themes', [...(state.themes || []), ...dedup(state.themes || [], newThemes, 'theme')]);
    updateField('canon_items', [...(state.canon_items || []), ...dedup(state.canon_items || [], newCanonItems, 'description')]);
    updateField('ambiguities', [...(state.ambiguities || []), ...dedup(state.ambiguities || [], newAmbiguities, 'issue')]);
    updateField('open_loops', [...state.open_loops, ...dedup(state.open_loops, newOpenLoops, 'description')]);
    updateField('foreshadowing_elements', [...state.foreshadowing_elements, ...dedup(state.foreshadowing_elements, newForeshadowing, 'clue')]);

    if (extractedData.project?.title && state.title === 'Untitled Project') {
      updateField('title', extractedData.project.title);
    }
    if (extractedData.project?.summary_global && !state.synopsis) {
      updateField('synopsis', extractedData.project.summary_global);
    }
    if (extractedData.project?.genre?.length && state.genre.length === 0) {
      updateField('genre', extractedData.project.genre);
    }
    if (!state.style_profile) {
      const parts = [
        extractedData.project?.tone_profile && `Tone: ${extractedData.project.tone_profile}`,
        extractedData.project?.narrative_pov && `POV: ${extractedData.project.narrative_pov}`,
      ].filter(Boolean);
      if (parts.length) updateField('style_profile', parts.join('. '));
    }

    setUploadStatus('success');
  };

  const reset = () => {
    setFiles([]);
    setUploadStatus('idle');
    setExtractedData(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <CarvedHeader
        title="Document Ingestion"
        subtitle="Upload your manuscript, notes, or outlines to auto-extract story intelligence."
        icon={<UploadCloud size={24} />}
      />

      {uploadStatus === 'idle' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-sepia-300/60 hover:border-brass-500 bg-parchment-100/50 rounded-xl p-12 text-center transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="flex justify-center mb-4">
              <div className="bg-parchment-200 p-4 rounded-full text-sepia-600">
                <UploadCloud size={32} />
              </div>
            </div>
            <h3 className="text-lg font-medium text-sepia-800 mb-2">Drag & Drop Files Here</h3>
            <p className="text-sm text-sepia-500 mb-6">Supports PDF, DOCX, TXT, and Markdown files.</p>
            <BrassButton>
              Browse Files
            </BrassButton>
          </div>

          {files.length > 0 && (
            <ParchmentCard>
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4">Selected Files (Order matters for parsing)</h4>
              <ul className="space-y-3 mb-6">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-parchment-200 p-3 rounded-lg border border-sepia-300/30">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-brass-500" />
                      <span className="text-sm text-sepia-800 font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-sepia-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveFile(idx, 'up')} disabled={idx === 0} className="p-1 text-sepia-500 hover:text-sepia-700 disabled:opacity-30" aria-label={`Move ${file.name} up`}><ChevronUp size={16} /></button>
                        <button onClick={() => moveFile(idx, 'down')} disabled={idx === files.length - 1} className="p-1 text-sepia-500 hover:text-sepia-700 disabled:opacity-30" aria-label={`Move ${file.name} down`}><ChevronDown size={16} /></button>
                        <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="p-1 text-wax-600 hover:text-wax-500 ml-2" aria-label={`Remove ${file.name}`}><X size={16} /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <InkStampButton variant="primary" onClick={handleUpload} icon={<ArrowRight size={18} />}>
                  Start Ingestion
                </InkStampButton>
              </div>
            </ParchmentCard>
          )}
        </div>
      )}

      {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in">
          <Loader2 size={48} className="text-brass-500 animate-spin" />
          <div className="text-center">
            <h3 className="text-xl font-medium text-sepia-800 mb-2">
              {uploadStatus === 'uploading' ? 'Uploading Files...' : 'Analyzing Manuscript...'}
            </h3>
            <p className="text-sepia-500 text-sm max-w-md mx-auto">
              {uploadStatus === 'uploading'
                ? 'Transferring your documents securely.'
                : 'Our AI is reading your text, extracting chapters, characters, conflicts, and worldbuilding details. This may take a minute for large files.'}
            </p>
          </div>
        </div>
      )}

      {uploadStatus === 'review' && extractedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-forest-700/10 border border-forest-700/20 rounded-xl p-6 flex items-start gap-4">
            <CheckCircle2 className="text-forest-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-sepia-900 mb-1">Analysis Complete</h3>
              <p className="text-sm text-sepia-600">Review the extracted intelligence below before merging it into your project memory. All imported items will be marked as &quot;Draft Idea&quot; by default to prevent overwriting confirmed canon.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Metadata */}
            <ParchmentCard className="md:col-span-2">
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Project Metadata</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-sepia-500 block mb-1">Title</label>
                  <input
                    type="text"
                    value={extractedData.project?.title || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, title: e.target.value } })}
                    className="w-full bg-parchment-200 border border-sepia-300/50 focus:border-brass-500/60 rounded-lg text-sm text-sepia-800 font-medium outline-none px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-sepia-500 block mb-1">Genre</label>
                  <input
                    type="text"
                    value={(extractedData.project?.genre || []).join(', ')}
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, genre: e.target.value.split(',').map(s => s.trim()) } })}
                    className="w-full bg-parchment-200 border border-sepia-300/50 focus:border-brass-500/60 rounded-lg text-sm text-sepia-800 font-medium outline-none px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-sepia-500 block mb-1">Global Summary</label>
                  <textarea
                    value={extractedData.project?.summary_global || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, summary_global: e.target.value } })}
                    className="w-full bg-parchment-200 border border-sepia-300/50 focus:border-brass-500/60 rounded-lg text-sm text-sepia-800 outline-none px-3 py-2 h-20 resize-none"
                  />
                </div>
              </div>
            </ParchmentCard>

            {/* Chapters */}
            <ParchmentCard>
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Chapters Detected</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">{extractedData.chapters?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.chapters || []).map((c: ExtractedChapter, i: number) => (
                  <li key={i} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                    <button
                      onClick={() => setExtractedData({ ...extractedData, chapters: (extractedData.chapters || []).filter((_: ExtractedChapter, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => {
                        const newChapters = (extractedData.chapters || []).map((ch: ExtractedChapter, idx: number) =>
                          idx === i ? { ...ch, title: e.target.value } : ch
                        );
                        setExtractedData({ ...extractedData, chapters: newChapters });
                      }}
                      className="w-[calc(100%-24px)] bg-transparent border-b border-sepia-300/50 focus:border-brass-500/60 text-sm text-sepia-800 font-medium mb-1 outline-none px-1"
                    />
                    <p className="text-xs text-sepia-500 line-clamp-2 px-1">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </ParchmentCard>

            {/* Characters */}
            <ParchmentCard>
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Characters Extracted</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">{extractedData.characters?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.characters || []).map((c: ExtractedCharacter, i: number) => {
                  const charState = lookupState(c);
                  return (
                  <li key={i} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                    <button
                      onClick={() => setExtractedData({ ...extractedData, characters: (extractedData.characters || []).filter((_: ExtractedCharacter, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex gap-2 mb-1 pr-6">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const newChars = (extractedData.characters || []).map((ch: ExtractedCharacter, idx: number) =>
                            idx === i ? { ...ch, name: e.target.value } : ch
                          );
                          setExtractedData({ ...extractedData, characters: newChars });
                        }}
                        className="flex-1 bg-transparent border-b border-sepia-300/50 focus:border-brass-500/60 text-sm text-sepia-800 font-medium outline-none px-1"
                      />
                      <input
                        type="text"
                        value={c.role}
                        onChange={(e) => {
                          const newChars = (extractedData.characters || []).map((ch: ExtractedCharacter, idx: number) =>
                            idx === i ? { ...ch, role: e.target.value } : ch
                          );
                          setExtractedData({ ...extractedData, characters: newChars });
                        }}
                        className="w-1/3 bg-transparent border-b border-sepia-300/50 focus:border-brass-500/60 text-xs text-sepia-500 outline-none px-1"
                      />
                    </div>
                    <p className="text-xs text-sepia-500 line-clamp-2 px-1 mb-2">{c.description}</p>

                    {/* Character State (if available) */}
                    {charState && (
                      <div className="mt-2 pt-2 border-t border-sepia-300/30">
                        <span className="text-[10px] text-sepia-500 uppercase tracking-wider mb-1 block">Current State</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-sepia-400">Goal:</span> <span className="text-sepia-600">{charState.visible_goal}</span>
                          </div>
                          <div>
                            <span className="text-sepia-400">Need:</span> <span className="text-sepia-600">{charState.hidden_need}</span>
                          </div>
                          <div>
                            <span className="text-sepia-400">Emotion:</span> <span className="text-sepia-600">{charState.current_emotional_state}</span>
                          </div>
                          <div>
                            <span className="text-sepia-400">Pressure:</span> <span className="text-sepia-600">{charState.current_pressure_level}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            </ParchmentCard>

            {/* Conflicts */}
            <ParchmentCard>
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Conflicts & Plot Points</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">{extractedData.active_conflicts?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.active_conflicts || []).map((c: ExtractedConflict, i: number) => (
                  <li key={i} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                    <button
                      onClick={() => setExtractedData({ ...extractedData, active_conflicts: (extractedData.active_conflicts || []).filter((_: ExtractedConflict, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <strong className="text-sm text-sepia-800 block mb-1 pr-6">{c.conflict_type || c.title}</strong>
                    <p className="text-xs text-sepia-500 line-clamp-2">{c.description}</p>
                  </li>
                ))}
              </ul>
            </ParchmentCard>

            {/* Worldbuilding & Timeline */}
            <ParchmentCard>
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>World & Timeline</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">{(extractedData.world_rules?.length || 0) + (extractedData.timeline_events?.length || 0)}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.world_rules || []).map((w: ExtractedWorldRule, i: number) => (
                  <li key={`w-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                    <button
                      onClick={() => setExtractedData({ ...extractedData, world_rules: (extractedData.world_rules || []).filter((_: ExtractedWorldRule, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] text-brass-500 uppercase tracking-wider mb-1 block">Lore</span>
                    <strong className="text-sm text-sepia-800 block mb-1 pr-6">{w.scope || w.title}</strong>
                    <p className="text-xs text-sepia-500 line-clamp-2">{w.rule || w.description}</p>
                  </li>
                ))}
                {(extractedData.timeline_events || []).map((t: ExtractedTimelineEvent, i: number) => (
                  <li key={`t-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                    <button
                      onClick={() => setExtractedData({ ...extractedData, timeline_events: (extractedData.timeline_events || []).filter((_: ExtractedTimelineEvent, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] text-forest-600 uppercase tracking-wider mb-1 block">Timeline: {t.event || t.date}</span>
                    <p className="text-xs text-sepia-700 line-clamp-2 pr-6">{t.immediate_effect || t.cause || t.description}</p>
                  </li>
                ))}
              </ul>
            </ParchmentCard>

            {/* Story Elements (Themes, Locations, Loops, Foreshadowing) */}
            <ParchmentCard className="md:col-span-2">
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Story Elements</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">
                  {(extractedData.themes?.length || 0) + (extractedData.locations?.length || 0) + (extractedData.open_loops?.length || 0) + (extractedData.foreshadowing_elements?.length || 0)}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Themes & Locations */}
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.themes || []).map((t: ExtractedTheme, i: number) => (
                    <li key={`th-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, themes: (extractedData.themes || []).filter((_: ExtractedTheme, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-brass-700 uppercase tracking-wider mb-1 block">Theme</span>
                      <strong className="text-sm text-sepia-800 block mb-1 pr-6">{t.theme}</strong>
                      <p className="text-xs text-sepia-500 line-clamp-2">{t.evidence?.join(', ')}</p>
                    </li>
                  ))}
                  {(extractedData.locations || []).map((l: ExtractedLocation, i: number) => (
                    <li key={`loc-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, locations: (extractedData.locations || []).filter((_: ExtractedLocation, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-sepia-600 uppercase tracking-wider mb-1 block">Location</span>
                      <strong className="text-sm text-sepia-800 block mb-1 pr-6">{l.name}</strong>
                      <p className="text-xs text-sepia-500 line-clamp-2">{l.description}</p>
                    </li>
                  ))}
                  {(!extractedData.themes?.length && !extractedData.locations?.length) && (
                    <li className="text-xs text-sepia-500 p-3">No themes or locations detected.</li>
                  )}
                </ul>

                {/* Open Loops & Foreshadowing */}
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.open_loops || []).map((l: ExtractedOpenLoop, i: number) => (
                    <li key={`ol-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, open_loops: (extractedData.open_loops || []).filter((_: ExtractedOpenLoop, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-brass-600 uppercase tracking-wider mb-1 block">Open Loop</span>
                      <p className="text-xs text-sepia-700 line-clamp-2 pr-6">{l.description}</p>
                    </li>
                  ))}
                  {(extractedData.foreshadowing_elements || []).map((f: ExtractedForeshadowing, i: number) => (
                    <li key={`fs-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, foreshadowing_elements: (extractedData.foreshadowing_elements || []).filter((_: ExtractedForeshadowing, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-forest-700 uppercase tracking-wider mb-1 block">Foreshadowing</span>
                      <p className="text-xs text-sepia-700 line-clamp-2 pr-6">{f.description || f.clue}</p>
                    </li>
                  ))}
                  {(!extractedData.open_loops?.length && !extractedData.foreshadowing_elements?.length) && (
                    <li className="text-xs text-sepia-500 p-3">No open loops or foreshadowing detected.</li>
                  )}
                </ul>
              </div>
            </ParchmentCard>

            {/* Canon & Ambiguities */}
            <ParchmentCard className="md:col-span-2">
              <h4 className="text-sm font-medium text-sepia-600 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Canon & Ambiguities</span>
                <span className="bg-parchment-200 text-sepia-700 px-2 py-0.5 rounded text-xs">{(extractedData.canon_items?.length || 0) + (extractedData.ambiguities?.length || 0)}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.canon_items || []).map((c: ExtractedCanonItem, i: number) => (
                    <li key={`c-${i}`} className="bg-parchment-200 p-3 rounded-lg border border-sepia-300/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, canon_items: (extractedData.canon_items || []).filter((_: ExtractedCanonItem, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-brass-500 uppercase tracking-wider mb-1 block">Canon: {c.category}</span>
                      <p className="text-xs text-sepia-700 line-clamp-2 pr-6">{c.description}</p>
                    </li>
                  ))}
                  {(!extractedData.canon_items || extractedData.canon_items.length === 0) && (
                    <li className="text-xs text-sepia-500 p-3">No canon items detected.</li>
                  )}
                </ul>
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.ambiguities || []).map((a: ExtractedAmbiguity, i: number) => (
                    <li key={`a-${i}`} className="bg-brass-400/10 p-3 rounded-lg border border-brass-400/30 relative group">
                      <button
                        onClick={() => setExtractedData({ ...extractedData, ambiguities: (extractedData.ambiguities || []).filter((_: ExtractedAmbiguity, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-sepia-500 hover:text-wax-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-brass-700 uppercase tracking-wider mb-1 block flex items-center gap-1">
                        <AlertCircle size={12} /> Ambiguity ({a.confidence} confidence)
                      </span>
                      <strong className="text-sm text-sepia-800 block mb-1 pr-6">{a.issue}</strong>
                      <p className="text-xs text-sepia-600 line-clamp-2">{a.recommended_review}</p>
                    </li>
                  ))}
                  {(!extractedData.ambiguities || extractedData.ambiguities.length === 0) && (
                    <li className="text-xs text-sepia-500 p-3">No ambiguities detected.</li>
                  )}
                </ul>
              </div>
            </ParchmentCard>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-sepia-300/50">
            <InkStampButton variant="ghost" onClick={reset}>
              Cancel
            </InkStampButton>
            <InkStampButton variant="primary" onClick={handleConfirmImport} icon={<Save size={18} />}>
              Merge into Project Memory
            </InkStampButton>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-forest-600/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-forest-600" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-sepia-900 mb-2">Ingestion Complete</h3>
            <p className="text-sepia-600 text-sm max-w-md mx-auto mb-8">
              Your manuscript has been successfully parsed, structured, and merged into your project memory. You can now continue writing with full context.
            </p>
            <BrassButton onClick={reset}>
              Import More Files
            </BrassButton>
          </div>
        </div>
      )}
    </div>
  );
}
