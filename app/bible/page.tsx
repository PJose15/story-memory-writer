'use client';

import { useStory } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Save, Book, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function BiblePage() {
  const { state, updateField } = useStory();
  const [title, setTitle] = useState(state.title);
  const [synopsis, setSynopsis] = useState(state.synopsis);
  const [styleProfile, setStyleProfile] = useState(state.style_profile);
  const [authorIntent, setAuthorIntent] = useState(state.author_intent);
  const [isSaving, setIsSaving] = useState(false);
  useUnsavedChanges(title !== state.title || synopsis !== state.synopsis || styleProfile !== state.style_profile || authorIntent !== state.author_intent);

  const handleSave = () => {
    setIsSaving(true);
    updateField('title', title);
    updateField('synopsis', synopsis);
    updateField('style_profile', styleProfile);
    updateField('author_intent', authorIntent);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Book className="text-indigo-400" />
            Story Bible
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">The core foundation of your narrative universe.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <section className="space-y-4">
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-2xl font-serif font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            placeholder="Enter your story's title..."
          />
        </section>

        <section className="space-y-4">
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Global Synopsis
          </label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-zinc-300 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            placeholder="Write a high-level summary of your plot..."
          />
        </section>

        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
            <Settings2 size={16} />
            Style & Tone Profile
          </label>
          <textarea
            value={styleProfile}
            onChange={(e) => setStyleProfile(e.target.value)}
            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-zinc-300 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            placeholder="Describe your writing style, tone, and pacing (e.g., 'Dark fantasy, fast-paced action, lyrical descriptions')..."
          />
        </section>

        <section className="space-y-4">
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Current Author Intent
          </label>
          <textarea
            value={authorIntent}
            onChange={(e) => setAuthorIntent(e.target.value)}
            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-zinc-300 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            placeholder="What are you currently working toward? (e.g., 'Building tension for the betrayal reveal in Chapter 12', 'Developing the romantic subplot before the climax')..."
          />
          <p className="text-xs text-zinc-500">This guides the AI assistant with your current creative direction. Update it as your focus changes.</p>
        </section>
      </motion.div>
    </div>
  );
}
