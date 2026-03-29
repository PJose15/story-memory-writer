'use client';

import { useStory } from '@/lib/store';
import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Save, Book, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { InkStampButton, CarvedHeader, DecorativeDivider, ParchmentInput, ParchmentTextarea } from '@/components/antiquarian';

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
      <CarvedHeader
        title="Story Bible"
        subtitle="The core foundation of your narrative universe."
        icon={<Book size={24} />}
        actions={
          <InkStampButton onClick={handleSave} disabled={isSaving} icon={<Save size={18} />}>
            {isSaving ? 'Saved!' : 'Save Changes'}
          </InkStampButton>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <section className="space-y-4 border-l-4 border-l-brass-500 pl-5">
          <label className="block text-sm font-medium text-sepia-600 uppercase tracking-wider">
            Project Title
          </label>
          <ParchmentInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-serif font-semibold py-4"
            placeholder="Enter your story's title..."
          />
        </section>

        <section className="space-y-4 border-l-4 border-l-forest-700 pl-5">
          <label className="block text-sm font-medium text-sepia-600 uppercase tracking-wider">
            Global Synopsis
          </label>
          <ParchmentTextarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="py-4 h-48"
            placeholder="Write a high-level summary of your plot..."
          />
        </section>

        <DecorativeDivider variant="flourish" className="my-6" />

        <section className="space-y-4 border-l-4 border-l-sepia-500 pl-5">
          <label className="flex items-center gap-2 text-sm font-medium text-sepia-600 uppercase tracking-wider">
            <Settings2 size={16} />
            Style & Tone Profile
          </label>
          <ParchmentTextarea
            value={styleProfile}
            onChange={(e) => setStyleProfile(e.target.value)}
            className="py-4 h-32"
            placeholder="Describe your writing style, tone, and pacing (e.g., 'Dark fantasy, fast-paced action, lyrical descriptions')..."
          />
        </section>

        <section className="space-y-4 border-l-4 border-l-brass-700 pl-5">
          <label className="block text-sm font-medium text-sepia-600 uppercase tracking-wider">
            Current Author Intent
          </label>
          <ParchmentTextarea
            value={authorIntent}
            onChange={(e) => setAuthorIntent(e.target.value)}
            className="py-4 h-32"
            placeholder="What are you currently working toward? (e.g., 'Building tension for the betrayal reveal in Chapter 12', 'Developing the romantic subplot before the climax')..."
          />
          <p className="text-xs text-sepia-500">This guides the AI assistant with your current creative direction. Update it as your focus changes.</p>
        </section>
      </motion.div>
    </div>
  );
}
