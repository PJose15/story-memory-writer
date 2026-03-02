'use client';

import { useStory, Conflict, CanonStatus } from '@/lib/store';
import { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Swords, CheckCircle2, ShieldCheck, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Discarded' },
};

export default function ConflictsPage() {
  const { state, updateField } = useStory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Conflict>>({});
  const [isNewItem, setIsNewItem] = useState(false);

  const handleAddConflict = () => {
    const newConflict: Conflict = {
      id: crypto.randomUUID(),
      title: 'New Conflict',
      description: '',
      status: 'active',
      canonStatus: 'draft',
    };
    updateField('active_conflicts', [...state.active_conflicts, newConflict]);
    setEditingId(newConflict.id);
    setEditForm(newConflict);
    setIsNewItem(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updated = state.active_conflicts.map((c) =>
      c.id === editingId ? { ...c, ...editForm } : c
    );
    updateField('active_conflicts', updated as Conflict[]);
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleCancel = () => {
    if (isNewItem && editingId) {
      updateField('active_conflicts', state.active_conflicts.filter(c => c.id !== editingId));
    }
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleDelete = (id: string) => {
    const conflict = state.active_conflicts.find(c => c.id === id);
    if (!confirm(`Delete "${conflict?.title || 'this conflict'}"? This cannot be undone.`)) return;
    updateField('active_conflicts', state.active_conflicts.filter((c) => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    const updated = state.active_conflicts.map((c) =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'resolved' : 'active' } : c
    );
    updateField('active_conflicts', updated as Conflict[]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Swords className="text-indigo-400" />
            Conflicts
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Track active tensions, subplots, and resolutions.</p>
        </div>
        <button
          onClick={handleAddConflict}
          className="flex items-center gap-2 bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} />
          Add Conflict
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {state.active_conflicts.map((conflict) => (
            <motion.div
              key={conflict.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-zinc-900 border ${conflict.status === 'resolved' ? 'border-emerald-900/50 opacity-75' : 'border-zinc-800'} rounded-2xl overflow-hidden shadow-sm transition-all`}
            >
              {editingId === conflict.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-xl font-serif font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Conflict Title"
                  />
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Describe the tension, stakes, and involved parties..."
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
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.status === 'resolved'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.checked ? 'resolved' : 'active' })}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500/50"
                      />
                      Mark as Resolved
                    </label>
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
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleStatus(conflict.id)}
                        className={`p-1 rounded-full transition-colors ${
                          conflict.status === 'resolved' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10'
                        }`}
                        title={conflict.status === 'resolved' ? 'Mark Active' : 'Mark Resolved'}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <h2 className={`text-xl font-serif font-semibold ${conflict.status === 'resolved' ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-zinc-100'}`}>
                        {conflict.title}
                      </h2>
                      {conflict.canonStatus && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[conflict.canonStatus].bg} ${statusConfig[conflict.canonStatus].color}`}>
                          {(() => {
                            const Icon = statusConfig[conflict.canonStatus].icon;
                            return <Icon size={12} />;
                          })()}
                          {statusConfig[conflict.canonStatus].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(conflict.id);
                          setEditForm(conflict);
                        }}
                        className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(conflict.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="pl-10">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${conflict.status === 'resolved' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                      {conflict.description || <span className="italic text-zinc-600">No description provided.</span>}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {state.active_conflicts.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Swords size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-400 text-lg">No active conflicts.</p>
            <p className="text-zinc-500 text-sm mt-2">Add a conflict to track tension in your story.</p>
          </div>
        )}
      </div>
    </div>
  );
}
