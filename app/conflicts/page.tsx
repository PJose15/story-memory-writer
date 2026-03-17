'use client';

import { useStory, Conflict, CanonStatus } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Plus, Trash2, Edit3, Save, X, Swords, CheckCircle2, ShieldCheck, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp } from '@/lib/animations';
import { useConfirm } from '@/components/confirm-dialog';
import { BrassButton, CarvedHeader, EmptyState } from '@/components/antiquarian';

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-forest-700', bg: 'bg-forest-700/10', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-brass-600', bg: 'bg-brass-500/10', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-brass-800', bg: 'bg-brass-400/10', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-wax-600', bg: 'bg-wax-500/10', label: 'Discarded' },
};

export default function ConflictsPage() {
  const { state, updateField } = useStory();
  const { confirm } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Conflict>>({});
  const [isNewItem, setIsNewItem] = useState(false);
  useUnsavedChanges(editingId !== null);

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
    if (!editForm.title?.trim()) return;
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

  const handleDelete = async (id: string) => {
    const conflict = state.active_conflicts.find(c => c.id === id);
    const confirmed = await confirm({
      title: 'Delete conflict?',
      message: `Are you sure you want to delete "${conflict?.title || 'this conflict'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    updateField('active_conflicts', state.active_conflicts.filter((c) => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    const updated = state.active_conflicts.map((c) =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'resolved' : 'active' } : c
    );
    updateField('active_conflicts', updated as Conflict[]);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div {...fadeUp}>
        <CarvedHeader
          title="Conflicts"
          subtitle="Track active tensions, subplots, and resolutions."
          icon={<Swords size={24} />}
          actions={
            <BrassButton onClick={handleAddConflict}>
              <Plus size={18} />
              Add Conflict
            </BrassButton>
          }
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {state.active_conflicts.map((conflict) => (
            <motion.div
              key={conflict.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-parchment-100 border ${conflict.status === 'resolved' ? 'border-forest-500/30 opacity-75 border-l-4 border-l-forest-600' : 'border-sepia-300/50 border-l-4 border-l-wax-500'} rounded-xl overflow-hidden transition-all texture-parchment shadow-parchment`}
            >
              {editingId === conflict.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-xl font-serif font-semibold text-sepia-900 focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                    placeholder="Conflict Title"
                  />
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full h-32 bg-parchment-200 border border-sepia-300/50 rounded-lg px-4 py-3 text-sm text-sepia-700 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brass-400/40"
                    placeholder="Describe the tension, stakes, and involved parties..."
                  />
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
                    <label className="flex items-center gap-2 text-sm text-sepia-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.status === 'resolved'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.checked ? 'resolved' : 'active' })}
                        className="rounded border-sepia-300/60 bg-parchment-200 text-forest-700 focus:ring-brass-400/40"
                      />
                      Mark as Resolved
                    </label>
                    <div className="flex-1" />
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sepia-600 hover:text-sepia-800 hover:bg-sepia-300/20 transition-colors"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-forest-700 text-cream-50 px-4 py-2 rounded-lg font-medium hover:bg-forest-600 transition-colors"
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
                          conflict.status === 'resolved' ? 'text-forest-700 bg-forest-700/10' : 'text-sepia-400 hover:text-brass-600 hover:bg-brass-500/10'
                        }`}
                        aria-label={conflict.status === 'resolved' ? `Mark "${conflict.title}" active` : `Mark "${conflict.title}" resolved`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <h2 className={`text-xl font-serif font-semibold ${conflict.status === 'resolved' ? 'text-sepia-500 line-through decoration-sepia-400' : 'text-sepia-900'}`}>
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
                        className="p-2 text-sepia-500 hover:text-brass-500 hover:bg-sepia-300/20 rounded-lg transition-colors"
                        aria-label={`Edit ${conflict.title}`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(conflict.id)}
                        className="p-2 text-sepia-500 hover:text-wax-500 hover:bg-sepia-300/20 rounded-lg transition-colors"
                        aria-label={`Delete ${conflict.title}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="pl-10">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${conflict.status === 'resolved' ? 'text-sepia-500' : 'text-sepia-700'}`}>
                      {conflict.description || <span className="italic text-sepia-400">No description provided.</span>}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {state.active_conflicts.length === 0 && (
          <EmptyState variant="conflicts" title="No conflicts yet" subtitle="Every great story needs tension. What stands in your characters' way?" action={{ label: 'Add a conflict', onClick: handleAddConflict }} />
        )}
      </div>
    </div>
  );
}
