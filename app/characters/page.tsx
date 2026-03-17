'use client';

import { useStory, Character, CanonStatus, CharacterState, CharacterRelationship, CharacterStateHistory } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Plus, Trash2, Edit3, Save, X, Users, ShieldCheck, Shield, ShieldAlert, ShieldOff, Activity, Heart, History, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp } from '@/lib/animations';
import ReactMarkdown from 'react-markdown';
import { useConfirm } from '@/components/confirm-dialog';
import { CarvedHeader, BrassButton, CharacterAvatar, DecorativeDivider, WaxSealBadge } from '@/components/antiquarian';

const defaultCurrentState: CharacterState = {
  emotionalState: '',
  visibleGoal: '',
  hiddenNeed: '',
  currentFear: '',
  dominantBelief: '',
  emotionalWound: '',
  pressureLevel: 'Low',
  currentKnowledge: '',
  indicator: 'stable',
};

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-forest-400', bg: 'bg-forest-400/10', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-brass-400', bg: 'bg-brass-400/10', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-brass-500', bg: 'bg-brass-500/10', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-wax-500', bg: 'bg-wax-500/10', label: 'Discarded' },
};

const indicatorConfig = {
  'stable': { color: 'text-forest-400', bg: 'bg-forest-400/10' },
  'shifting': { color: 'text-sepia-400', bg: 'bg-sepia-400/10' },
  'under pressure': { color: 'text-brass-500', bg: 'bg-brass-500/10' },
  'emotionally conflicted': { color: 'text-wax-600', bg: 'bg-wax-600/10' },
  'at risk of contradiction': { color: 'text-wax-500', bg: 'bg-wax-500/10' },
};

export default function CharactersPage() {
  const { state, updateField } = useStory();
  const { confirm } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Character>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'state' | 'relationships' | 'history'>('profile');
  const [isNewItem, setIsNewItem] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, string>>({});
  useUnsavedChanges(editingId !== null);

  const handleAnalyzeState = async (char: Character) => {
    setAnalyzingId(char.id);
    try {
      const relationships = (char.dynamicRelationships || []).map(r => {
        const target = state.characters.find(c => c.id === r.targetId);
        return {
          targetName: target?.name || 'Unknown',
          trustLevel: r.trustLevel,
          tensionLevel: r.tensionLevel,
          dynamics: r.dynamics,
        };
      });

      const res = await fetch('/api/analyze-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: char.name,
            role: char.role,
            coreIdentity: char.coreIdentity,
            currentState: char.currentState,
            stateHistory: (char.stateHistory || []).map(h => ({
              context: h.context,
              changes: h.changes,
            })),
            relationships,
          },
          language: state.language || 'English',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysisResult(prev => ({ ...prev, [char.id]: data.analysis }));
    } catch (error) {
      console.error(error);
      setAnalysisResult(prev => ({ ...prev, [char.id]: 'Failed to generate analysis.' }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: 'New Character',
      role: 'Protagonist',
      description: '',
      coreIdentity: '',
      relationships: '',
      canonStatus: 'draft',
      currentState: {
        emotionalState: '',
        visibleGoal: '',
        hiddenNeed: '',
        currentFear: '',
        dominantBelief: '',
        emotionalWound: '',
        pressureLevel: 'Low',
        currentKnowledge: '',
        indicator: 'stable'
      },
      dynamicRelationships: [],
      stateHistory: []
    };
    updateField('characters', [...state.characters, newCharacter]);
    setEditingId(newCharacter.id);
    setExpandedId(newCharacter.id);
    setEditForm(newCharacter);
    setActiveTab('profile');
    setIsNewItem(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    if (!editForm.name?.trim()) return;
    // Filter out relationships with no target selected
    const cleanedForm = {
      ...editForm,
      dynamicRelationships: (editForm.dynamicRelationships || []).filter(r => r.targetId),
    };
    const updated = state.characters.map((c) =>
      c.id === editingId ? { ...c, ...cleanedForm } : c
    );
    updateField('characters', updated as Character[]);
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleCancel = () => {
    if (isNewItem && editingId) {
      updateField('characters', state.characters.filter(c => c.id !== editingId));
    }
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleDelete = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    const confirmed = await confirm({
      title: 'Delete character?',
      message: `Are you sure you want to delete "${char?.name || 'this character'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    updateField('characters', state.characters.filter((c) => c.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div {...fadeUp}>
        <CarvedHeader
          title="Characters"
          subtitle="Manage your cast, their roles, and relationships."
          icon={<Users size={24} />}
          actions={
            <BrassButton onClick={handleAddCharacter}>
              <Plus size={18} />
              Add Character
            </BrassButton>
          }
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {state.characters.map((char) => {
            const isExpanded = expandedId === char.id;
            const isEditing = editingId === char.id;
            
            return (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-parchment-100 border border-sepia-300/50 rounded-xl overflow-hidden texture-parchment shadow-parchment transition-all duration-300`}
            >
              {isEditing ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-2 md:gap-4 border-b border-sepia-300/50 pb-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-parchment-200 text-sepia-900' : 'text-sepia-600 hover:text-sepia-800'}`}>Static Profile</button>
                    <button onClick={() => setActiveTab('state')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'state' ? 'bg-forest-500/20 text-brass-400' : 'text-sepia-600 hover:text-sepia-800'}`}><Activity size={16} /> Live State Engine</button>
                    <button onClick={() => setActiveTab('relationships')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'relationships' ? 'bg-wax-500/15 text-wax-500' : 'text-sepia-600 hover:text-sepia-800'}`}><Heart size={16} /> Relationships</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-brass-500/20 text-brass-400' : 'text-sepia-600 hover:text-sepia-800'}`}><History size={16} /> History</button>
                  </div>

                  {activeTab === 'profile' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-xl font-serif font-semibold text-sepia-900 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                          placeholder="Character Name"
                        />
                        <input
                          type="text"
                          value={editForm.role || ''}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm font-sans text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                          placeholder="Role (e.g., Protagonist, Antagonist)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Core Identity (Permanent Traits)</label>
                        <textarea
                          value={editForm.coreIdentity || ''}
                          onChange={(e) => setEditForm({ ...editForm, coreIdentity: e.target.value })}
                          className="w-full h-24 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                          placeholder="Baseline personality, permanent traits, deeply held values..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Physical Description & Background</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full h-32 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                          placeholder="Physical appearance, backstory, general biography..."
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <select
                          value={editForm.canonStatus || 'draft'}
                          onChange={(e) => setEditForm({ ...editForm, canonStatus: e.target.value as CanonStatus })}
                          className="bg-parchment-200 border border-sepia-300/50 rounded-lg px-3 py-2 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                        >
                          <option value="confirmed">Confirmed Canon</option>
                          <option value="flexible">Flexible Canon</option>
                          <option value="draft">Draft Idea</option>
                          <option value="discarded">Discarded</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'state' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between bg-parchment-200 p-4 rounded-xl border border-sepia-300/50">
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-1">State Indicator</label>
                            <select
                              value={editForm.currentState?.indicator || 'stable'}
                              onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), indicator: e.target.value as CharacterState['indicator'] } })}
                              className="bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-1.5 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            >
                              <option value="stable">Stable</option>
                              <option value="shifting">Shifting</option>
                              <option value="under pressure">Under Pressure</option>
                              <option value="emotionally conflicted">Emotionally Conflicted</option>
                              <option value="at risk of contradiction">At Risk of Contradiction</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-1">Pressure Level</label>
                            <select
                              value={editForm.currentState?.pressureLevel || 'Low'}
                              onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), pressureLevel: e.target.value as CharacterState['pressureLevel'] } })}
                              className="bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-1.5 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-sepia-500 uppercase tracking-wider block mb-1">Current Knowledge</span>
                          <input
                            type="text"
                            value={editForm.currentState?.currentKnowledge || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), currentKnowledge: e.target.value } })}
                            className="bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-1.5 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40 w-64"
                            placeholder="What do they know right now?"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Current Emotional State</label>
                          <textarea
                            value={editForm.currentState?.emotionalState || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), emotionalState: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="How are they feeling in this exact moment?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Visible Goal</label>
                          <textarea
                            value={editForm.currentState?.visibleGoal || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), visibleGoal: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="What are they actively trying to achieve?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Hidden Need</label>
                          <textarea
                            value={editForm.currentState?.hiddenNeed || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), hiddenNeed: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="What do they actually need (but might not know)?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Current Fear</label>
                          <textarea
                            value={editForm.currentState?.currentFear || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), currentFear: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="What are they most afraid of right now?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Dominant Belief</label>
                          <textarea
                            value={editForm.currentState?.dominantBelief || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), dominantBelief: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="What belief is driving their current actions?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">Emotional Wound</label>
                          <textarea
                            value={editForm.currentState?.emotionalWound || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentState: { ...(editForm.currentState || defaultCurrentState), emotionalWound: e.target.value } })}
                            className="w-full h-20 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                            placeholder="What past hurt is influencing them?"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'relationships' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider mb-2">General Relationship Notes</label>
                      <textarea
                        value={editForm.relationships || ''}
                        onChange={(e) => setEditForm({ ...editForm, relationships: e.target.value })}
                        className="w-full h-24 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-600 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                        placeholder="General relationships with other characters..."
                      />
                      
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider">Dynamic Relationship Map</label>
                          <button
                            onClick={() => {
                              const newRel: CharacterRelationship = { targetId: '', trustLevel: 50, tensionLevel: 50, dynamics: '' };
                              setEditForm({ ...editForm, dynamicRelationships: [...(editForm.dynamicRelationships || []), newRel] });
                            }}
                            className="text-xs bg-parchment-200 hover:bg-parchment-300 text-sepia-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            + Add Relationship Link
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {(editForm.dynamicRelationships || []).map((rel, idx) => (
                            <div key={idx} className="bg-parchment-200 border border-sepia-300/50 rounded-xl p-4 flex gap-4 items-start">
                              <div className="w-1/3">
                                <select
                                  value={rel.targetId}
                                  onChange={(e) => {
                                    const newRels = (editForm.dynamicRelationships || []).map((r, i) =>
                                      i === idx ? { ...r, targetId: e.target.value } : r
                                    );
                                    setEditForm({ ...editForm, dynamicRelationships: newRels });
                                  }}
                                  className="w-full bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-2 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                                >
                                  <option value="">Select Character...</option>
                                  {state.characters.filter(c => c.id !== char.id).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-2/3 space-y-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-xs text-sepia-500 mb-1">
                                      <span>Trust ({rel.trustLevel}%)</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0" max="100"
                                      value={rel.trustLevel}
                                      onChange={(e) => {
                                        const newRels = (editForm.dynamicRelationships || []).map((r, i) =>
                                          i === idx ? { ...r, trustLevel: parseInt(e.target.value) } : r
                                        );
                                        setEditForm({ ...editForm, dynamicRelationships: newRels });
                                      }}
                                      className="w-full accent-forest-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between text-xs text-sepia-500 mb-1">
                                      <span>Tension ({rel.tensionLevel}%)</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0" max="100"
                                      value={rel.tensionLevel}
                                      onChange={(e) => {
                                        const newRels = (editForm.dynamicRelationships || []).map((r, i) =>
                                          i === idx ? { ...r, tensionLevel: parseInt(e.target.value) } : r
                                        );
                                        setEditForm({ ...editForm, dynamicRelationships: newRels });
                                      }}
                                      className="w-full accent-red-500"
                                    />
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={rel.dynamics}
                                  onChange={(e) => {
                                    const newRels = (editForm.dynamicRelationships || []).map((r, i) =>
                                      i === idx ? { ...r, dynamics: e.target.value } : r
                                    );
                                    setEditForm({ ...editForm, dynamicRelationships: newRels });
                                  }}
                                  className="w-full bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-2 text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                                  placeholder="Current dynamic (e.g., 'Walking on eggshells', 'Secretly allied')"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newRels = [...(editForm.dynamicRelationships || [])];
                                  newRels.splice(idx, 1);
                                  setEditForm({ ...editForm, dynamicRelationships: newRels });
                                }}
                                className="p-2 text-sepia-500 hover:text-wax-500 hover:bg-parchment-200 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          {(!editForm.dynamicRelationships || editForm.dynamicRelationships.length === 0) && (
                            <div className="text-center py-6 text-sm text-sepia-500 border border-dashed border-sepia-300/50 rounded-xl">
                              No dynamic relationships mapped yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-medium text-sepia-500 uppercase tracking-wider">State Evolution Timeline</label>
                        <button
                          onClick={() => {
                            const newEvent: CharacterStateHistory = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], context: '', changes: '' };
                            setEditForm({ ...editForm, stateHistory: [newEvent, ...(editForm.stateHistory || [])] });
                          }}
                          className="text-xs bg-parchment-200 hover:bg-parchment-300 text-sepia-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          + Log State Change
                        </button>
                      </div>
                      
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-sepia-300/50 before:to-transparent">
                        {(editForm.stateHistory || []).map((history, idx) => (
                          <div key={history.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-sepia-300/50 bg-parchment-100 text-sepia-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                              <Activity size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-parchment-200 p-4 rounded-xl border border-sepia-300/50 shadow">
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="text"
                                  value={history.context}
                                  onChange={(e) => {
                                    const newHist = (editForm.stateHistory || []).map((h, i) =>
                                      i === idx ? { ...h, context: e.target.value } : h
                                    );
                                    setEditForm({ ...editForm, stateHistory: newHist });
                                  }}
                                  className="bg-transparent border-b border-sepia-300/50 px-1 py-0.5 text-sm font-medium text-sepia-800 focus:outline-none focus:border-brass-500/60"
                                  placeholder="Context (e.g., Chapter 3)"
                                />
                                <button
                                  onClick={() => {
                                    const newHist = [...(editForm.stateHistory || [])];
                                    newHist.splice(idx, 1);
                                    setEditForm({ ...editForm, stateHistory: newHist });
                                  }}
                                  className="text-sepia-500 hover:text-wax-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <textarea
                                value={history.changes}
                                onChange={(e) => {
                                  const newHist = (editForm.stateHistory || []).map((h, i) =>
                                    i === idx ? { ...h, changes: e.target.value } : h
                                  );
                                  setEditForm({ ...editForm, stateHistory: newHist });
                                }}
                                className="w-full bg-parchment-100 border border-sepia-300/50 rounded-lg px-3 py-2 text-sm text-sepia-600 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                                placeholder="What changed internally?"
                              />
                            </div>
                          </div>
                        ))}
                        {(!editForm.stateHistory || editForm.stateHistory.length === 0) && (
                          <div className="text-center py-6 text-sm text-sepia-500">
                            No state changes logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-sepia-300/50">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sepia-600 hover:text-sepia-800 hover:bg-parchment-200 transition-colors"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-forest-700 text-cream-50 px-4 py-2 rounded-lg font-medium hover:bg-forest-600 transition-colors"
                    >
                      <Save size={18} />
                      Save Character
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-6 cursor-pointer hover:bg-parchment-200/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : char.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <CharacterAvatar name={char.name} size="lg" indicator={char.currentState?.indicator} />
                        <div>
                        <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
                          {char.name}
                          {char.currentState?.indicator && char.currentState.indicator !== 'stable' && (
                            <AlertCircle size={16} className={indicatorConfig[char.currentState.indicator].color} />
                          )}
                        </h2>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-block px-2.5 py-0.5 bg-parchment-200 text-sepia-600 text-xs font-medium rounded-full uppercase tracking-wider">
                            {char.role}
                          </span>
                          {char.canonStatus && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[char.canonStatus].bg} ${statusConfig[char.canonStatus].color}`}>
                              {(() => {
                                const Icon = statusConfig[char.canonStatus].icon;
                                return <Icon size={12} />;
                              })()}
                              {statusConfig[char.canonStatus].label}
                            </span>
                          )}
                          {char.currentState?.indicator && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${indicatorConfig[char.currentState.indicator].bg} ${indicatorConfig[char.currentState.indicator].color}`}>
                              <Activity size={12} />
                              {char.currentState.indicator}
                            </span>
                          )}
                        </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(char.id);
                            setExpandedId(char.id);
                            setEditForm(char);
                            setActiveTab('profile');
                          }}
                          className="p-2 text-sepia-500 hover:text-brass-500 hover:bg-parchment-200 rounded-lg transition-colors"
                          aria-label={`Edit ${char.name}`}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(char.id);
                          }}
                          className="p-2 text-sepia-500 hover:text-wax-500 hover:bg-parchment-200 rounded-lg transition-colors"
                          aria-label={`Delete ${char.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="p-2 text-sepia-500">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-parchment-200/30 animate-in fade-in slide-in-from-top-2">
                      <DecorativeDivider variant="brass-rule" className="my-4" />
                      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        
                        {/* Left Sidebar: Static Profile & Knowledge */}
                        <div className="xl:col-span-1 space-y-6">
                          {/* Knowledge Banner */}
                          <div className="bg-forest-500/10 border border-brass-500/20 rounded-xl p-4">
                            <h3 className="text-[10px] font-bold text-brass-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Activity size={12} /> Current Knowledge
                            </h3>
                            <p className="text-sm text-sepia-900 font-medium leading-relaxed">
                              {char.currentState?.currentKnowledge || 'Nothing specific tracked.'}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Users size={12} /> Core Identity (Static)
                            </h3>
                            <p className="text-sm text-sepia-700 leading-relaxed whitespace-pre-wrap bg-parchment-100/50 p-3 rounded-xl border border-sepia-300/30">
                              {char.coreIdentity || <span className="italic text-sepia-400">No core identity defined.</span>}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest mb-2">Background</h3>
                            <p className="text-sm text-sepia-600 leading-relaxed whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all">
                              {char.description || <span className="italic text-sepia-400">No description provided.</span>}
                            </p>
                          </div>
                        </div>

                        {/* Main Content: Live State & Relationships */}
                        <div className="xl:col-span-2 space-y-6">
                          {/* Live State Grid */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} className="text-forest-400" /> Live Emotional Logic
                              </h3>
                              <span className="text-xs font-medium px-2 py-1 rounded-md bg-parchment-100 border border-sepia-300/50 text-sepia-700">
                                Pressure: <strong className={
                                  char.currentState?.pressureLevel === 'Critical' ? 'text-wax-500' :
                                  char.currentState?.pressureLevel === 'High' ? 'text-brass-400' :
                                  char.currentState?.pressureLevel === 'Medium' ? 'text-brass-500' : 'text-forest-400'
                                }>{char.currentState?.pressureLevel || 'Low'}</strong>
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Emotional State</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.emotionalState || '—'}</p>
                              </div>
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Visible Goal</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.visibleGoal || '—'}</p>
                              </div>
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Hidden Need</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.hiddenNeed || '—'}</p>
                              </div>
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Current Fear</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.currentFear || '—'}</p>
                              </div>
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Dominant Belief</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.dominantBelief || '—'}</p>
                              </div>
                              <div className="bg-parchment-100/40 p-3 rounded-xl border border-sepia-300/50/40 hover:border-sepia-300/40 transition-colors">
                                <span className="text-[10px] uppercase tracking-wider text-sepia-500 block mb-1">Emotional Wound</span>
                                <p className="text-sm text-sepia-800">{char.currentState?.emotionalWound || '—'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Relationship Map */}
                          {char.dynamicRelationships && char.dynamicRelationships.length > 0 && (
                            <div>
                              <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Heart size={12} className="text-wax-500" /> Dynamic Relationship Map
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {char.dynamicRelationships.map((rel, idx) => {
                                  const targetChar = state.characters.find(c => c.id === rel.targetId);
                                  return (
                                    <div key={idx} className={`bg-parchment-100/40 p-3 rounded-xl border flex flex-col gap-2 ${targetChar ? 'border-sepia-300/50/40' : 'border-red-800/40'}`}>
                                      <div className="flex justify-between items-center">
                                        <span className={`text-sm font-medium ${targetChar ? 'text-sepia-800' : 'text-wax-500'}`}>{targetChar?.name || 'Deleted character'}</span>
                                        <div className="flex gap-2 text-[10px] font-mono">
                                          <span className="text-forest-400 bg-forest-400/10 px-1.5 py-0.5 rounded">T:{rel.trustLevel}</span>
                                          <span className="text-wax-500 bg-wax-500/10 px-1.5 py-0.5 rounded">X:{rel.tensionLevel}</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-sepia-600 leading-relaxed">{rel.dynamics}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Sidebar: History & Audit */}
                        <div className="xl:col-span-1 space-y-6">
                          {/* Character Intelligence Audit */}
                          <div className="bg-parchment-100/80 border border-sepia-300/50 rounded-xl p-4 flex flex-col h-full max-h-[400px]">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={12} className="text-brass-400" /> Intelligence Audit
                              </h3>
                              <button
                                onClick={() => handleAnalyzeState(char)}
                                disabled={analyzingId === char.id}
                                className="text-[10px] font-medium uppercase tracking-wider bg-forest-500/10 hover:bg-forest-500/20 text-brass-500 px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
                              >
                                {analyzingId === char.id ? 'Analyzing...' : 'Run Audit'}
                              </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-sepia-700">
                              {analysisResult[char.id] ? (
                                <div className="prose prose-sepia prose-sm max-w-none prose-headings:text-sepia-800 prose-headings:font-medium prose-headings:text-[10px] prose-headings:uppercase prose-headings:tracking-widest prose-headings:mt-4 prose-headings:mb-2 prose-p:leading-relaxed prose-p:text-sepia-600 prose-p:text-xs">
                                  <ReactMarkdown>{analysisResult[char.id]}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-sepia-500 space-y-3 py-8">
                                  <ShieldAlert size={24} className="text-sepia-400" />
                                  <p className="text-xs px-2">Run an audit to check for OOC risks and get behavioral recommendations based on current state.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Chapter-by-Chapter Evolution */}
                          {char.stateHistory && char.stateHistory.length > 0 && (
                            <div>
                              <h3 className="text-[10px] font-bold text-sepia-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <History size={12} className="text-brass-400" /> State Evolution
                              </h3>
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {char.stateHistory.map((history) => (
                                  <div key={history.id} className="relative pl-4 border-l-2 border-sepia-300/50 pb-4 last:pb-0">
                                    <div className="absolute w-2 h-2 bg-sepia-400 rounded-full -left-[5px] top-1.5 ring-4 ring-parchment-100"></div>
                                    <span className="text-[10px] font-mono text-sepia-500 block mb-1">{history.context}</span>
                                    <p className="text-xs text-sepia-700 leading-relaxed">{history.changes}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
            );
          })}
        </AnimatePresence>

        {state.characters.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Users size={48} className="mx-auto text-sepia-300 mb-4" />
            <p className="text-sepia-600 text-lg">Your cast is empty.</p>
            <p className="text-sepia-500 text-sm mt-2">Add your first character to begin building your world.</p>
          </div>
        )}
      </div>
    </div>
  );
}
