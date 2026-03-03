'use client';

import { useStory, TimelineEvent, CanonStatus } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Plus, Trash2, Edit3, Save, X, Clock, ShieldCheck, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '@/components/confirm-dialog';

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Discarded' },
};

export default function TimelinePage() {
  const { state, updateField } = useStory();
  const { confirm } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimelineEvent>>({});
  const [isNewItem, setIsNewItem] = useState(false);
  useUnsavedChanges(editingId !== null);

  const handleAddEvent = () => {
    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      date: 'Year 1, Day 1',
      description: 'A new event begins...',
      impact: '',
      canonStatus: 'draft',
    };
    updateField('timeline_events', [...state.timeline_events, newEvent]);
    setEditingId(newEvent.id);
    setEditForm(newEvent);
    setIsNewItem(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updated = state.timeline_events.map((e) =>
      e.id === editingId ? { ...e, ...editForm } : e
    );
    updateField('timeline_events', updated as TimelineEvent[]);
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleCancel = () => {
    if (isNewItem && editingId) {
      updateField('timeline_events', state.timeline_events.filter(e => e.id !== editingId));
    }
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleDelete = async (id: string) => {
    const event = state.timeline_events.find(e => e.id === id);
    const confirmed = await confirm({
      title: 'Delete timeline event?',
      message: `Are you sure you want to delete "${event?.date || 'this event'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    updateField('timeline_events', state.timeline_events.filter((e) => e.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Clock className="text-indigo-400" />
            Timeline
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Track key events and their impact on the story.</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="flex items-center gap-2 bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} />
          Add Event
        </button>
      </header>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
        <AnimatePresence>
          {state.timeline_events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-zinc-950 bg-zinc-800 text-zinc-500 group-hover:text-indigo-400 group-hover:bg-zinc-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                <Clock size={16} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                {editingId === event.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.date || ''}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm font-mono text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="Date / Time (e.g., Year 1, Day 1)"
                    />
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="Event description..."
                    />
                    <textarea
                      value={editForm.impact || ''}
                      onChange={(e) => setEditForm({ ...editForm, impact: e.target.value })}
                      className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="Impact on the story/characters..."
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-500 transition-colors text-sm"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">{event.date}</span>
                        {event.canonStatus && (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[event.canonStatus].bg} ${statusConfig[event.canonStatus].color}`}>
                            {(() => {
                              const Icon = statusConfig[event.canonStatus].icon;
                              return <Icon size={12} />;
                            })()}
                            {statusConfig[event.canonStatus].label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(event.id);
                            setEditForm(event);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded-md transition-colors"
                          aria-label={`Edit event: ${event.date}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                          aria-label={`Delete event: ${event.date}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-sm mt-3">{event.description}</p>
                    {event.impact && (
                      <div className="mt-4 pt-3 border-t border-zinc-800">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">Impact</span>
                        <p className="text-sm text-zinc-400">{event.impact}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {state.timeline_events.length === 0 && (
          <div className="text-center py-20 relative z-10">
            <Clock size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-400 text-lg">Your timeline is empty.</p>
            <p className="text-zinc-500 text-sm mt-2">Add your first event to start tracking history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
