'use client';

import { useStory } from '@/lib/store';
import { useRef } from 'react';
import { Settings, Download, Upload, Trash2, AlertTriangle, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { state, setState, updateField } = useStory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (
          typeof data.title !== 'string' ||
          !Array.isArray(data.characters) ||
          !Array.isArray(data.chapters)
        ) {
          alert('Invalid file: missing or malformed required fields (title, characters, chapters).');
          return;
        }
        if (!confirm('This will replace ALL current project data. Are you sure?')) return;
        setState((prev) => ({ ...prev, ...data }));
      } catch {
        alert('Failed to parse JSON file. Make sure it is a valid Story Bible export.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = `${state.title.replace(/\s+/g, '_').toLowerCase()}_story_bible.json`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to delete all your project data? This cannot be undone.')) {
      localStorage.removeItem('story_memory_state');
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <header className="flex items-center gap-3 border-b border-zinc-800 pb-6">
        <Settings className="text-zinc-400" size={28} />
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight">Settings</h1>
          <p className="text-zinc-400 mt-2 text-sm">Manage your project data and preferences.</p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-zinc-100 flex items-center gap-2">
            <Globe size={20} className="text-indigo-400" />
            Project Language
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Set the language for your project. All AI analysis, ingestion, and assistant responses will use this language. Content will never be translated.
          </p>
          <select
            value={state.language || 'English'}
            onChange={(e) => updateField('language', e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-lg font-medium focus:border-indigo-500 outline-none"
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
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-zinc-100 flex items-center gap-2">
            <Download size={20} className="text-indigo-400" />
            Export Project
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Download your entire Story Bible, manuscript, characters, and timeline as a JSON file. You can use this for backup or to process with other tools.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            <Download size={18} />
            Export JSON
          </button>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-zinc-100 flex items-center gap-2">
            <Upload size={20} className="text-indigo-400" />
            Restore Project
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Import a previously exported JSON file to restore your Story Bible. This will replace all current data.
          </p>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            <Upload size={18} />
            Import JSON
          </button>
        </section>

        <section className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Permanently delete all project data from your browser&apos;s local storage. Make sure you have exported your data first if you want to keep it.
          </p>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-900/50 text-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-900 transition-colors border border-red-800"
          >
            <Trash2 size={18} />
            Clear All Data
          </button>
        </section>
      </div>
    </div>
  );
}
