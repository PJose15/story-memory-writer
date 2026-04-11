'use client';

import { useStory, StoryState } from '@/lib/store';
import { useRef } from 'react';
import { Settings, Download, Upload, Trash2, AlertTriangle, Globe } from 'lucide-react';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';
import { HeteronymSettings } from '@/components/heteronyms/heteronym-settings';
import { BrassButton, InkStampButton, CarvedHeader, ParchmentCard } from '@/components/antiquarian';
import { db, clearAllStoryData } from '@/lib/storage/dexie-db';

// Only these keys from StoryState are allowed during import
const ALLOWED_KEYS = new Set<keyof StoryState>([
  'language', 'title', 'genre', 'synopsis', 'author_intent',
  'chapters', 'scenes', 'characters', 'timeline_events',
  'open_loops', 'world_rules', 'style_profile', 'active_conflicts',
  'foreshadowing_elements', 'locations', 'themes', 'canon_items',
  'ambiguities', 'chat_messages',
]);

export default function SettingsPage() {
  const { state, setState, updateField } = useStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (
          typeof data.title !== 'string' ||
          !Array.isArray(data.characters) ||
          !Array.isArray(data.chapters)
        ) {
          toast('Invalid file: missing or malformed required fields (title, characters, chapters).', 'error');
          return;
        }
        const confirmed = await confirm({
          title: 'Replace project data?',
          message: 'This will replace ALL current project data with the imported file. A backup of your current data will be saved automatically.',
          confirmLabel: 'Replace Data',
          variant: 'danger',
        });
        if (!confirmed) return;

        // Auto-backup current state before overwriting (Dexie stories_backup row)
        try {
          await db.stories.put({
            id: 'backup',
            data: JSON.stringify(state),
            updatedAt: Date.now(),
          });
        } catch {
          // Backup failed — proceed anyway
        }

        // Whitelist keys to prevent arbitrary state injection
        const sanitized: Record<string, unknown> = {};
        for (const key of Object.keys(data)) {
          if (ALLOWED_KEYS.has(key as keyof StoryState)) {
            sanitized[key] = data[key];
          }
        }
        setState((prev) => ({ ...prev, ...sanitized }));
        toast('Project data imported successfully.', 'success');
      } catch {
        toast('Failed to parse JSON file. Make sure it is a valid Story Bible export.', 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const safeName = state.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'story_bible';
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = `${safeName}_story_bible.json`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    toast('Project exported successfully.', 'success');
  };

  const handleClear = async () => {
    const confirmed = await confirm({
      title: 'Delete all project data?',
      message: 'This will permanently delete all your project data from local storage. This cannot be undone. Make sure you have exported your data first.',
      confirmLabel: 'Delete Everything',
      variant: 'danger',
    });
    if (confirmed) {
      try {
        await clearAllStoryData();
      } catch {
        // If Dexie clear fails, fall through to reload anyway
      }
      // Also remove any straggler localStorage keys from older builds
      try {
        localStorage.removeItem('zagafy_state');
        localStorage.removeItem('zagafy_chapter_versions');
        localStorage.removeItem('zagafy_sessions');
      } catch {
        // best effort
      }
      window.location.reload();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
      <CarvedHeader
        title="Settings"
        subtitle="Manage your project data and preferences."
        icon={<Settings size={24} />}
      />

      <div className="space-y-8">
        <ParchmentCard className="space-y-4">
          <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
            <Globe size={20} className="text-brass-500" />
            Project Language
          </h2>
          <p className="text-sepia-600 text-sm leading-relaxed">
            Set the language for your project. All AI analysis, ingestion, and assistant responses will use this language. Content will never be translated.
          </p>
          <select
            value={state.language || 'English'}
            onChange={(e) => updateField('language', e.target.value)}
            className="bg-parchment-200 border border-sepia-300/60 text-sepia-900 px-4 py-2 rounded-lg font-medium focus:border-brass-500/60 focus:ring-2 focus:ring-brass-400/40 outline-none"
            aria-label="Project language"
          >
            <option value="English">English</option>
            <option value="Spanish">Español (Spanish)</option>
            <option value="French">Français (French)</option>
            <option value="Portuguese">Português (Portuguese)</option>
            <option value="German">Deutsch (German)</option>
            <option value="Italian">Italiano (Italian)</option>
            <option value="Japanese">日本語 (Japanese)</option>
            <option value="Korean">한국어 (Korean)</option>
            <option value="Chinese">中文 (Chinese)</option>
            <option value="Russian">Русский (Russian)</option>
            <option value="Arabic">العربية (Arabic)</option>
          </select>
        </ParchmentCard>

        <HeteronymSettings />

        <ParchmentCard className="space-y-4">
          <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
            <Download size={20} className="text-brass-500" />
            Export Project
          </h2>
          <p className="text-sepia-600 text-sm leading-relaxed">
            Download your entire Story Bible, manuscript, characters, and timeline as a JSON file. You can use this for backup or to process with other tools.
          </p>
          <BrassButton onClick={handleExport} icon={<Download size={18} />}>
            Export JSON
          </BrassButton>
        </ParchmentCard>

        <ParchmentCard className="space-y-4">
          <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
            <Upload size={20} className="text-brass-500" />
            Restore Project
          </h2>
          <p className="text-sepia-600 text-sm leading-relaxed">
            Import a previously exported JSON file to restore your Story Bible. This will replace all current data.
          </p>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <BrassButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={18} />}>
            Import JSON
          </BrassButton>
        </ParchmentCard>

        <section className="bg-wax-900/10 border border-wax-700/30 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-wax-700 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <p className="text-sepia-600 text-sm leading-relaxed">
            Permanently delete all project data from your browser&apos;s local storage. Make sure you have exported your data first if you want to keep it.
          </p>
          <InkStampButton
            onClick={handleClear}
            variant="danger"
            icon={<Trash2 size={18} />}
          >
            Clear All Data
          </InkStampButton>
        </section>
      </div>
    </div>
  );
}
