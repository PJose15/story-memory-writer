'use client';

import { useStory } from '@/lib/store';
import { useSession } from '@/lib/session';
import { motion } from 'motion/react';
import { BookOpen, Users, Clock, Swords, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const blockMessages: Record<string, { headline: string; nudge: string }> = {
  fear: {
    headline: 'You showed up. That takes courage.',
    nudge: 'Write one paragraph nobody will ever see.',
  },
  perfectionism: {
    headline: 'First drafts are supposed to be messy.',
    nudge: 'Write the worst version first.',
  },
  direction: {
    headline: "You don't need to know the ending.",
    nudge: 'Write the next scene you can see.',
  },
  exhaustion: {
    headline: "You showed up. That's enough.",
    nudge: 'Write whatever comes. Even fragments.',
  },
};

export default function Dashboard() {
  const { state } = useStory();
  const { session } = useSession();

  const stats = [
    { name: 'Chapters', value: state.chapters.length, icon: BookOpen, href: '/manuscript' },
    { name: 'Characters', value: state.characters.length, icon: Users, href: '/characters' },
    { name: 'Timeline Events', value: state.timeline_events.length, icon: Clock, href: '/timeline' },
    { name: 'Active Conflicts', value: state.active_conflicts.length, icon: Swords, href: '/conflicts' },
  ];

  const blockMsg = session.blockType ? blockMessages[session.blockType] : null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-end justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-zinc-100 tracking-tight">
            {state.title || 'Untitled Project'}
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl text-sm leading-relaxed">
            {state.synopsis || 'No synopsis added yet. Head to the Story Bible to define your core narrative.'}
          </p>
        </div>
      </header>

      {blockMsg && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
          data-testid="block-message"
        >
          <p className="text-lg font-serif text-zinc-100">{blockMsg.headline}</p>
          <p className="text-sm text-zinc-400 mt-2 italic">{blockMsg.nudge}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={stat.name} href={stat.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="text-zinc-500 group-hover:text-zinc-300 transition-colors" size={24} />
                <span className="text-3xl font-light text-zinc-100">{stat.value}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{stat.name}</h3>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen size={20} className="text-zinc-500" />
            Recent Chapters
          </h2>
          {state.chapters.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-8 text-center">
              <p className="text-zinc-400 text-sm">No chapters added yet.</p>
              <Link href="/manuscript" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 inline-block">
                Start writing &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {state.chapters.slice(-3).reverse().map((chapter) => (
                <div key={chapter.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-medium text-zinc-200">{chapter.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{chapter.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-serif font-semibold text-zinc-100 flex items-center gap-2">
            <AlertCircle size={20} className="text-zinc-500" />
            Open Loops
          </h2>
          {state.open_loops.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-8 text-center">
              <p className="text-zinc-400 text-sm">No open loops tracked.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.open_loops.filter(l => l.status === 'open').slice(0, 5).map((loop) => (
                <div key={loop.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{loop.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
