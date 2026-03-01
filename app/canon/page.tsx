'use client';

import { useStory, CanonStatus } from '@/lib/store';
import { useState } from 'react';
import { Lock, Unlock, Edit3, Trash2, ShieldCheck, ShieldAlert, Shield, ShieldOff, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ItemType = 'character' | 'timeline' | 'conflict' | 'chapter';

interface CanonItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  status: CanonStatus;
}

const statusConfig = {
  confirmed: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Confirmed Canon' },
  flexible: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Flexible Canon' },
  draft: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Draft Idea' },
  discarded: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Discarded' },
};

export default function CanonLockPage() {
  const { state, updateField } = useStory();
  const [filterStatus, setFilterStatus] = useState<CanonStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');

  // Aggregate all items
  const allItems: CanonItem[] = [
    ...state.characters.map(c => ({ id: c.id, type: 'character' as ItemType, title: c.name, description: c.description, status: c.canonStatus || 'draft' })),
    ...state.timeline_events.map(t => ({ id: t.id, type: 'timeline' as ItemType, title: t.date, description: t.description, status: t.canonStatus || 'draft' })),
    ...state.active_conflicts.map(c => ({ id: c.id, type: 'conflict' as ItemType, title: c.title, description: c.description, status: c.canonStatus || 'draft' })),
    ...state.chapters.map(c => ({ id: c.id, type: 'chapter' as ItemType, title: c.title, description: c.summary, status: c.canonStatus || 'draft' })),
  ];

  const filteredItems = allItems.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    return true;
  });

  const updateItemStatus = (id: string, type: ItemType, newStatus: CanonStatus) => {
    if (type === 'character') {
      updateField('characters', state.characters.map(c => c.id === id ? { ...c, canonStatus: newStatus } : c));
    } else if (type === 'timeline') {
      updateField('timeline_events', state.timeline_events.map(t => t.id === id ? { ...t, canonStatus: newStatus } : t));
    } else if (type === 'conflict') {
      updateField('active_conflicts', state.active_conflicts.map(c => c.id === id ? { ...c, canonStatus: newStatus } : c));
    } else if (type === 'chapter') {
      updateField('chapters', state.chapters.map(c => c.id === id ? { ...c, canonStatus: newStatus } : c));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Lock className="text-indigo-400" />
            Canon Lock
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl">
            Classify story information by certainty level. The AI Assistant will strictly respect Confirmed Canon and ignore Discarded items.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ItemType | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Types</option>
            <option value="character">Characters</option>
            <option value="timeline">Timeline</option>
            <option value="conflict">Conflicts</option>
            <option value="chapter">Chapters</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CanonStatus | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed Canon</option>
            <option value="flexible">Flexible Canon</option>
            <option value="draft">Draft Idea</option>
            <option value="discarded">Discarded</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredItems.map((item) => {
            const config = statusConfig[item.status];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className={`bg-zinc-900 border ${config.border} rounded-2xl p-5 shadow-sm flex flex-col`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                        <Icon size={12} />
                        {config.label}
                      </div>
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-zinc-100">{item.title}</h3>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-400 line-clamp-3 mb-4 flex-1">
                  {item.description || <span className="italic opacity-50">No description...</span>}
                </p>
                
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50 mt-auto">
                  <span className="text-xs text-zinc-500 mr-auto">Change status:</span>
                  {(Object.keys(statusConfig) as CanonStatus[]).map((status) => {
                    const btnConfig = statusConfig[status];
                    const BtnIcon = btnConfig.icon;
                    const isActive = item.status === status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => updateItemStatus(item.id, item.type, status)}
                        title={btnConfig.label}
                        className={`p-1.5 rounded-md transition-colors ${
                          isActive 
                            ? `${btnConfig.bg} ${btnConfig.color}` 
                            : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <BtnIcon size={16} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Filter size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-400 text-lg">No items match your filters.</p>
            <p className="text-zinc-500 text-sm mt-2">Try changing the type or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
