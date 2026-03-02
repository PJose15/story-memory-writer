'use client';

import { useState, useRef } from 'react';
import { useStory } from '@/lib/store';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ImportPage() {
  const { state, updateField } = useStory();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'review' | 'success'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [parsingStatus, setParsingStatus] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to parse files');
      }

      const data = await res.json();
      setParsingStatus(data.fileParsingStatus || []);
      setExtractedData(data.extractedData || {});
      setUploadStatus('review');
    } catch (error) {
      console.error(error);
      alert('An error occurred during ingestion.');
      setUploadStatus('idle');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!extractedData) return;

    // Merge Characters
    const newCharacters = (extractedData.characters || []).map((c: any) => {
      const state = extractedData.character_states?.find((s: any) => s.character_id === c.character_id || s.name === c.name);
      
      // Find relationships where this character is character_1
      const rels = (extractedData.relationships || [])
        .filter((r: any) => r.character_1 === c.name || r.character_1 === c.character_id)
        .map((r: any) => {
          // Try to find the target character's ID
          const targetChar = extractedData.characters?.find((tc: any) => tc.name === r.character_2 || tc.character_id === r.character_2);
          return {
            targetId: targetChar?.character_id || r.character_2,
            trustLevel: r.trust_level || 50,
            tensionLevel: r.tension_level || 50,
            dynamics: r.current_dynamic || r.relationship_type || ''
          };
        });

      return {
        id: c.character_id || crypto.randomUUID(),
        name: c.name,
        role: c.role,
        description: c.description,
        coreIdentity: c.core_traits ? c.core_traits.join(', ') : '',
        relationships: '',
        canonStatus: 'draft',
        currentState: {
          indicator: 'stable',
          pressureLevel: state?.current_pressure_level || 'Low',
          emotionalState: state?.current_emotional_state || '',
          visibleGoal: state?.visible_goal || '',
          hiddenNeed: state?.hidden_need || '',
          currentFear: state?.current_fear || '',
          dominantBelief: state?.dominant_belief || '',
          emotionalWound: state?.emotional_wound || '',
          currentKnowledge: state?.current_knowledge || ''
        },
        dynamicRelationships: rels,
        stateHistory: []
      };
    });

    // Merge Chapters
    const newChapters = (extractedData.chapters || []).map((c: any, idx: number) => ({
      id: c.chapter_id || crypto.randomUUID(),
      title: c.title || `Chapter ${idx + 1}`,
      summary: c.summary,
      content: c.raw_text_reference || '',
      canonStatus: 'draft'
    }));

    // Merge Scenes
    const newScenes = (extractedData.scenes || []).map((s: any) => ({
      id: s.scene_id || crypto.randomUUID(),
      chapterId: s.chapter_id || '',
      title: `Scene ${s.order_index || ''}`,
      summary: s.summary,
      content: '',
      canonStatus: 'draft'
    }));

    // Merge Plot Points -> active_conflicts (or we can just map active_conflicts directly)
    const newConflicts = (extractedData.active_conflicts || []).map((c: any) => ({
      id: c.conflict_id || crypto.randomUUID(),
      title: c.conflict_type || c.title || 'Conflict',
      description: c.description,
      status: c.status === 'resolved' ? 'resolved' : 'active',
      canonStatus: 'draft'
    }));

    // Merge Timeline -> timeline_events
    const newTimelineEvents = (extractedData.timeline_events || extractedData.timeline || []).map((t: any) => ({
      id: t.timeline_event_id || crypto.randomUUID(),
      date: t.event || t.date, // Using event as date/title for now
      description: t.immediate_effect || t.cause || t.description || '',
      impact: t.latent_effect || '',
      canonStatus: 'draft'
    }));

    // Merge Worldbuilding -> world_rules
    const newWorldRules = (extractedData.world_rules || extractedData.worldbuilding || []).map((w: any) => ({
      id: w.world_rule_id || crypto.randomUUID(),
      category: w.scope || 'Lore',
      rule: w.rule || `${w.title}: ${w.description}`,
      canonStatus: 'draft'
    }));

    // Merge Locations
    const newLocations = (extractedData.locations || []).map((l: any) => ({
      id: l.location_id || crypto.randomUUID(),
      name: l.name,
      description: l.description,
      importance: l.importance || 'medium',
      associatedRules: l.associated_rules || [],
      canonStatus: 'draft'
    }));

    // Merge Themes
    const newThemes = (extractedData.themes || []).map((t: any) => ({
      id: t.theme_id || crypto.randomUUID(),
      theme: t.theme,
      evidence: t.evidence || [],
      canonStatus: 'draft'
    }));

    // Merge Canon Items
    const newCanonItems = (extractedData.canon_items || []).map((c: any) => ({
      id: c.canon_item_id || crypto.randomUUID(),
      category: c.category || 'other',
      description: c.description,
      status: c.status || 'draft_idea',
      sourceReference: c.source_reference || ''
    }));

    // Merge Ambiguities
    const newAmbiguities = (extractedData.ambiguities || []).map((a: any) => ({
      id: a.ambiguity_id || crypto.randomUUID(),
      issue: a.issue,
      affectedSection: a.affected_section || '',
      confidence: a.confidence || 'medium',
      recommendedReview: a.recommended_review || ''
    }));

    // Merge Open Loops
    const newOpenLoops = (extractedData.open_loops || []).map((l: any) => ({
      id: l.loop_id || crypto.randomUUID(),
      description: l.description,
      status: l.status === 'resolved' ? 'closed' : 'open',
      canonStatus: 'draft'
    }));

    // Merge Foreshadowing
    const newForeshadowing = (extractedData.foreshadowing_elements || []).map((f: any) => ({
      id: f.foreshadowing_id || crypto.randomUUID(),
      clue: f.description || f.clue,
      payoff: f.payoff_status || '',
      canonStatus: 'draft'
    }));

    updateField('characters', [...state.characters, ...newCharacters]);
    updateField('chapters', [...state.chapters, ...newChapters]);
    updateField('scenes', [...state.scenes, ...newScenes]);
    updateField('active_conflicts', [...state.active_conflicts, ...newConflicts]);
    updateField('timeline_events', [...state.timeline_events, ...newTimelineEvents]);
    updateField('world_rules', [...state.world_rules, ...newWorldRules]);
    updateField('locations', [...(state.locations || []), ...newLocations]);
    updateField('themes', [...(state.themes || []), ...newThemes]);
    updateField('canon_items', [...(state.canon_items || []), ...newCanonItems]);
    updateField('ambiguities', [...(state.ambiguities || []), ...newAmbiguities]);
    updateField('open_loops', [...state.open_loops, ...newOpenLoops]);
    updateField('foreshadowing_elements', [...state.foreshadowing_elements, ...newForeshadowing]);

    if (extractedData.project?.title && state.title === 'Untitled Project') {
      updateField('title', extractedData.project.title);
    }
    if (extractedData.project?.summary_global && !state.synopsis) {
      updateField('synopsis', extractedData.project.summary_global);
    }

    setUploadStatus('success');
  };

  const reset = () => {
    setFiles([]);
    setUploadStatus('idle');
    setExtractedData(null);
    setParsingStatus([]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <UploadCloud className="text-indigo-400" />
            Document Ingestion
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Upload your manuscript, notes, or outlines to auto-extract story intelligence.</p>
        </div>
      </header>

      {uploadStatus === 'idle' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900/50 rounded-2xl p-12 text-center transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="flex justify-center mb-4">
              <div className="bg-zinc-800 p-4 rounded-full text-zinc-400">
                <UploadCloud size={32} />
              </div>
            </div>
            <h3 className="text-lg font-medium text-zinc-200 mb-2">Drag & Drop Files Here</h3>
            <p className="text-sm text-zinc-500 mb-6">Supports PDF, DOCX, TXT, and Markdown files.</p>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-2 rounded-lg font-medium transition-colors">
              Browse Files
            </button>
          </div>

          {files.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Selected Files (Order matters for parsing)</h4>
              <ul className="space-y-3 mb-6">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-indigo-400" />
                      <span className="text-sm text-zinc-200 font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveFile(idx, 'up')} disabled={idx === 0} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"><ChevronUp size={16} /></button>
                        <button onClick={() => moveFile(idx, 'down')} disabled={idx === files.length - 1} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"><ChevronDown size={16} /></button>
                        <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:text-red-400 ml-2"><X size={16} /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  Start Ingestion <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in">
          <Loader2 size={48} className="text-indigo-500 animate-spin" />
          <div className="text-center">
            <h3 className="text-xl font-medium text-zinc-200 mb-2">
              {uploadStatus === 'uploading' ? 'Uploading Files...' : 'Analyzing Manuscript...'}
            </h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              {uploadStatus === 'uploading' 
                ? 'Transferring your documents securely.'
                : 'Our AI is reading your text, extracting chapters, characters, conflicts, and worldbuilding details. This may take a minute for large files.'}
            </p>
          </div>
        </div>
      )}

      {uploadStatus === 'review' && extractedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 flex items-start gap-4">
            <CheckCircle2 className="text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-indigo-100 mb-1">Analysis Complete</h3>
              <p className="text-sm text-indigo-200/70">Review the extracted intelligence below before merging it into your project memory. All imported items will be marked as &quot;Draft Idea&quot; by default to prevent overwriting confirmed canon.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Metadata */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Project Metadata</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Title</label>
                  <input 
                    type="text" 
                    value={extractedData.project?.title || ''} 
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, title: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg text-sm text-zinc-200 font-medium outline-none px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Genre</label>
                  <input 
                    type="text" 
                    value={(extractedData.project?.genre || []).join(', ')} 
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, genre: e.target.value.split(',').map(s => s.trim()) } })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg text-sm text-zinc-200 font-medium outline-none px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-500 block mb-1">Global Summary</label>
                  <textarea 
                    value={extractedData.project?.summary_global || ''} 
                    onChange={(e) => setExtractedData({ ...extractedData, project: { ...extractedData.project, summary_global: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg text-sm text-zinc-200 outline-none px-3 py-2 h-20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Chapters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Chapters Detected</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{extractedData.chapters?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.chapters || []).map((c: any, i: number) => (
                  <li key={i} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                    <button 
                      onClick={() => setExtractedData({ ...extractedData, chapters: extractedData.chapters.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <input 
                      type="text" 
                      value={c.title} 
                      onChange={(e) => {
                        const newChapters = [...extractedData.chapters];
                        newChapters[i].title = e.target.value;
                        setExtractedData({ ...extractedData, chapters: newChapters });
                      }}
                      className="w-[calc(100%-24px)] bg-transparent border-b border-zinc-800 focus:border-indigo-500 text-sm text-zinc-200 font-medium mb-1 outline-none px-1"
                    />
                    <p className="text-xs text-zinc-500 line-clamp-2 px-1">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Characters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Characters Extracted</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{extractedData.characters?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.characters || []).map((c: any, i: number) => (
                  <li key={i} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                    <button 
                      onClick={() => setExtractedData({ ...extractedData, characters: extractedData.characters.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex gap-2 mb-1 pr-6">
                      <input 
                        type="text" 
                        value={c.name} 
                        onChange={(e) => {
                          const newChars = [...extractedData.characters];
                          newChars[i].name = e.target.value;
                          setExtractedData({ ...extractedData, characters: newChars });
                        }}
                        className="flex-1 bg-transparent border-b border-zinc-800 focus:border-indigo-500 text-sm text-zinc-200 font-medium outline-none px-1"
                      />
                      <input 
                        type="text" 
                        value={c.role} 
                        onChange={(e) => {
                          const newChars = [...extractedData.characters];
                          newChars[i].role = e.target.value;
                          setExtractedData({ ...extractedData, characters: newChars });
                        }}
                        className="w-1/3 bg-transparent border-b border-zinc-800 focus:border-indigo-500 text-xs text-zinc-500 outline-none px-1"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 px-1 mb-2">{c.description}</p>
                    
                    {/* Character State (if available) */}
                    {extractedData.character_states?.find((s: any) => s.character_id === c.character_id || s.name === c.name) && (
                      <div className="mt-2 pt-2 border-t border-zinc-800/50">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Current State</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-zinc-600">Goal:</span> <span className="text-zinc-400">{extractedData.character_states.find((s: any) => s.character_id === c.character_id || s.name === c.name).visible_goal}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Need:</span> <span className="text-zinc-400">{extractedData.character_states.find((s: any) => s.character_id === c.character_id || s.name === c.name).hidden_need}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Emotion:</span> <span className="text-zinc-400">{extractedData.character_states.find((s: any) => s.character_id === c.character_id || s.name === c.name).current_emotional_state}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Pressure:</span> <span className="text-zinc-400">{extractedData.character_states.find((s: any) => s.character_id === c.character_id || s.name === c.name).current_pressure_level}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Conflicts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Conflicts & Plot Points</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{extractedData.active_conflicts?.length || 0}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.active_conflicts || []).map((c: any, i: number) => (
                  <li key={i} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                    <button 
                      onClick={() => setExtractedData({ ...extractedData, active_conflicts: extractedData.active_conflicts.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <strong className="text-sm text-zinc-200 block mb-1 pr-6">{c.conflict_type || c.title}</strong>
                    <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Worldbuilding & Timeline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>World & Timeline</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{(extractedData.world_rules?.length || 0) + (extractedData.timeline_events?.length || 0)}</span>
              </h4>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(extractedData.world_rules || []).map((w: any, i: number) => (
                  <li key={`w-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                    <button 
                      onClick={() => setExtractedData({ ...extractedData, world_rules: extractedData.world_rules.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1 block">Lore</span>
                    <strong className="text-sm text-zinc-200 block mb-1 pr-6">{w.scope || w.title}</strong>
                    <p className="text-xs text-zinc-500 line-clamp-2">{w.rule || w.description}</p>
                  </li>
                ))}
                {(extractedData.timeline_events || []).map((t: any, i: number) => (
                  <li key={`t-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                    <button 
                      onClick={() => setExtractedData({ ...extractedData, timeline_events: extractedData.timeline_events.filter((_: any, idx: number) => idx !== i) })}
                      className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 block">Timeline: {t.event || t.date}</span>
                    <p className="text-xs text-zinc-300 line-clamp-2 pr-6">{t.immediate_effect || t.cause || t.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Story Elements (Themes, Locations, Loops, Foreshadowing) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Story Elements</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">
                  {(extractedData.themes?.length || 0) + (extractedData.locations?.length || 0) + (extractedData.open_loops?.length || 0) + (extractedData.foreshadowing_elements?.length || 0)}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Themes & Locations */}
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.themes || []).map((t: any, i: number) => (
                    <li key={`th-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, themes: extractedData.themes.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-purple-400 uppercase tracking-wider mb-1 block">Theme</span>
                      <strong className="text-sm text-zinc-200 block mb-1 pr-6">{t.theme}</strong>
                      <p className="text-xs text-zinc-500 line-clamp-2">{t.evidence?.join(', ')}</p>
                    </li>
                  ))}
                  {(extractedData.locations || []).map((l: any, i: number) => (
                    <li key={`loc-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, locations: extractedData.locations.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-blue-400 uppercase tracking-wider mb-1 block">Location</span>
                      <strong className="text-sm text-zinc-200 block mb-1 pr-6">{l.name}</strong>
                      <p className="text-xs text-zinc-500 line-clamp-2">{l.description}</p>
                    </li>
                  ))}
                  {(!extractedData.themes?.length && !extractedData.locations?.length) && (
                    <li className="text-xs text-zinc-500 p-3">No themes or locations detected.</li>
                  )}
                </ul>

                {/* Open Loops & Foreshadowing */}
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.open_loops || []).map((l: any, i: number) => (
                    <li key={`ol-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, open_loops: extractedData.open_loops.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-orange-400 uppercase tracking-wider mb-1 block">Open Loop</span>
                      <p className="text-xs text-zinc-300 line-clamp-2 pr-6">{l.description}</p>
                    </li>
                  ))}
                  {(extractedData.foreshadowing_elements || []).map((f: any, i: number) => (
                    <li key={`fs-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, foreshadowing_elements: extractedData.foreshadowing_elements.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-teal-400 uppercase tracking-wider mb-1 block">Foreshadowing</span>
                      <p className="text-xs text-zinc-300 line-clamp-2 pr-6">{f.description || f.clue}</p>
                    </li>
                  ))}
                  {(!extractedData.open_loops?.length && !extractedData.foreshadowing_elements?.length) && (
                    <li className="text-xs text-zinc-500 p-3">No open loops or foreshadowing detected.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Canon & Ambiguities */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Canon & Ambiguities</span>
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{(extractedData.canon_items?.length || 0) + (extractedData.ambiguities?.length || 0)}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.canon_items || []).map((c: any, i: number) => (
                    <li key={`c-${i}`} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, canon_items: extractedData.canon_items.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1 block">Canon: {c.category}</span>
                      <p className="text-xs text-zinc-300 line-clamp-2 pr-6">{c.description}</p>
                    </li>
                  ))}
                  {(!extractedData.canon_items || extractedData.canon_items.length === 0) && (
                    <li className="text-xs text-zinc-500 p-3">No canon items detected.</li>
                  )}
                </ul>
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(extractedData.ambiguities || []).map((a: any, i: number) => (
                    <li key={`a-${i}`} className="bg-amber-950/30 p-3 rounded-lg border border-amber-900/50 relative group">
                      <button 
                        onClick={() => setExtractedData({ ...extractedData, ambiguities: extractedData.ambiguities.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <span className="text-[10px] text-amber-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                        <AlertCircle size={12} /> Ambiguity ({a.confidence} confidence)
                      </span>
                      <strong className="text-sm text-zinc-200 block mb-1 pr-6">{a.issue}</strong>
                      <p className="text-xs text-zinc-400 line-clamp-2">{a.recommended_review}</p>
                    </li>
                  ))}
                  {(!extractedData.ambiguities || extractedData.ambiguities.length === 0) && (
                    <li className="text-xs text-zinc-500 p-3">No ambiguities detected.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800">
            <button
              onClick={reset}
              className="px-6 py-2 rounded-lg font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={18} /> Merge into Project Memory
            </button>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-2">Ingestion Complete</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
              Your manuscript has been successfully parsed, structured, and merged into your project memory. You can now continue writing with full context.
            </p>
            <button
              onClick={reset}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Import More Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
