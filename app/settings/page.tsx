'use client';

import { useStory } from '@/lib/store';
import { Settings, Download, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { state, setState } = useStory();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.title.replace(/\s+/g, '_').toLowerCase()}_story_bible.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
