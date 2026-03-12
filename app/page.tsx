'use client';

import { useStory } from '@/lib/store';
import { useSession } from '@/lib/session';
import { motion } from 'motion/react';
import { BookOpen, Users, Clock, Swords, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { stagger, hoverLift, physicalDrop } from '@/lib/animations';

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
      <header className="flex items-end justify-between border-b border-sepia-300/30 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-sepia-900 tracking-tight letterpress">
            {state.title || 'Untitled Project'}
          </h1>
          <p className="text-sepia-600 mt-2 max-w-2xl text-sm leading-relaxed">
            {state.synopsis || 'No synopsis added yet. Head to the Story Bible to define your core narrative.'}
          </p>
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-brass-500 to-brass-300/0 rounded-full" />
        </div>
      </header>

      {blockMsg && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-parchment-200/80 border border-sepia-300/50 rounded-xl p-6 texture-parchment"
          data-testid="block-message"
        >
          <p className="text-lg font-serif text-sepia-900">{blockMsg.headline}</p>
          <p className="text-sm text-sepia-600 mt-2 italic">{blockMsg.nudge}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={stat.name} href={stat.href}>
            <motion.div
              {...stagger.cards(i)}
              {...hoverLift}
              className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-6 hover:shadow-card-hover transition-all duration-200 group cursor-pointer texture-parchment"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="text-brass-600 group-hover:text-brass-500 transition-colors" size={24} />
                <span className="text-3xl font-light text-sepia-900">{stat.value}</span>
              </div>
              <h3 className="text-sm font-medium text-sepia-600 uppercase tracking-wider">{stat.name}</h3>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
            <BookOpen size={20} className="text-brass-600" />
            Recent Chapters
          </h2>
          {state.chapters.length === 0 ? (
            <div className="bg-parchment-100/50 border border-sepia-300/30 border-dashed rounded-xl p-8 text-center">
              <p className="text-sepia-500 text-sm">No chapters added yet.</p>
              <Link href="/manuscript" className="text-forest-700 hover:text-forest-600 text-sm font-medium mt-2 inline-block">
                Start writing &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {state.chapters.slice(-3).reverse().map((chapter) => (
                <motion.div key={chapter.id} {...physicalDrop} className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-5 texture-parchment">
                  <h3 className="font-medium text-sepia-800">{chapter.title}</h3>
                  <p className="text-sm text-sepia-500 mt-1 line-clamp-2">{chapter.summary}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-serif font-semibold text-sepia-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-brass-600" />
            Open Loops
          </h2>
          {state.open_loops.length === 0 ? (
            <div className="bg-parchment-100/50 border border-sepia-300/30 border-dashed rounded-xl p-8 text-center">
              <p className="text-sepia-500 text-sm">No open loops tracked.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.open_loops.filter(l => l.status === 'open').slice(0, 5).map((loop) => (
                <div key={loop.id} className="flex items-start gap-3 bg-parchment-100 border border-sepia-300/50 rounded-xl p-4 texture-parchment">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-sepia-700 leading-relaxed">{loop.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
