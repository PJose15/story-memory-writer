'use client';

import { useStory, Chapter, CanonStatus } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Plus, Trash2, Edit3, Save, X, BookOpen, ShieldCheck, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Discarded' },
};

export default function ManuscriptPage() {
  const { state, updateField } = useStory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Chapter>>({});
  const [isNewItem, setIsNewItem] = useState(false);
  useUnsavedChanges(editingId !== null);

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${state.chapters.length + 1}`,
      content: '',
      summary: '',
      canonStatus: 'draft',
    };
    updateField('chapters', [...state.chapters, newChapter]);
    setEditingId(newChapter.id);
    setEditForm(newChapter);
    setIsNewItem(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updatedChapters = state.chapters.map((c) =>
      c.id === editingId ? { ...c, ...editForm } : c
    );
    updateField('chapters', updatedChapters as Chapter[]);
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleCancel = () => {
    if (isNewItem && editingId) {
      updateField('chapters', state.chapters.filter(c => c.id !== editingId));
    }
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleDelete = (id: string) => {
    const chapter = state.chapters.find(c => c.id === id);
    if (!confirm(`Delete "${chapter?.title || 'this chapter'}"? This cannot be undone.`)) return;
    updateField('chapters', state.chapters.filter((c) => c.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight">Manuscript</h1>
          <p className="text-zinc-400 mt-2 text-sm">Write and organize your chapters.</p>
        </div>
        <button
          onClick={handleAddChapter}
          className="flex items-center gap-2 bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} />
          New Chapter
        </button>
      </header>

      <div className="space-y-6">
        <AnimatePresence>
          {state.chapters.map((chapter) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {editingId === chapter.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-xl font-serif font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Chapter Title"
                  />
                  <textarea
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-300 font-serif leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Start writing your chapter here..."
                  />
                  <textarea
                    value={editForm.summary || ''}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Brief summary for the Story Bible..."
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <select
                      value={editForm.canonStatus || 'draft'}
                      onChange={(e) => setEditForm({ ...editForm, canonStatus: e.target.value as CanonStatus })}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="confirmed">Confirmed Canon</option>
                      <option value="flexible">Flexible Canon</option>
                      <option value="draft">Draft Idea</option>
                      <option value="discarded">Discarded</option>
                    </select>
                    <div className="flex-1" />
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
                    >
                      <Save size={18} />
                      Save Chapter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-serif font-semibold text-zinc-100">{chapter.title}</h2>
                      {chapter.canonStatus && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[chapter.canonStatus].bg} ${statusConfig[chapter.canonStatus].color}`}>
                          {(() => {
                            const Icon = statusConfig[chapter.canonStatus].icon;
                            return <Icon size={12} />;
                          })()}
                          {statusConfig[chapter.canonStatus].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(chapter.id);
                          setEditForm(chapter);
                        }}
                        className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(chapter.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-zinc max-w-none font-serif text-zinc-300 leading-relaxed line-clamp-4">
                    {chapter.content || <span className="text-zinc-600 italic">Empty chapter...</span>}
                  </div>
                  {chapter.summary && (
                    <div className="mt-6 pt-4 border-t border-zinc-800">
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Summary</p>
                      <p className="text-sm text-zinc-400">{chapter.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {state.chapters.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-400 text-lg">Your manuscript is empty.</p>
            <p className="text-zinc-500 text-sm mt-2">Add your first chapter to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
