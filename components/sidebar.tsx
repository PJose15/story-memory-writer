'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Clock,
  Swords,
  MessageSquareText,
  Settings,
  Menu,
  X,
  Lock,
  UploadCloud
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Manuscript', href: '/manuscript', icon: BookOpen },
  { name: 'Story Bible', href: '/bible', icon: BookOpen },
  { name: 'Characters', href: '/characters', icon: Users },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Conflicts', href: '/conflicts', icon: Swords },
  { name: 'Canon Lock', href: '/canon', icon: Lock },
  { name: 'Assistant', href: '/assistant', icon: MessageSquareText },
  { name: 'Import', href: '/import', icon: UploadCloud },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
        <span className="font-serif font-semibold text-zinc-100">Story Memory</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-zinc-100" aria-label={isOpen ? 'Close navigation' : 'Open navigation'}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar — always rendered, hidden via CSS on mobile when closed */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
            <div className="p-6 hidden md:block">
              <h1 className="font-serif text-xl font-semibold text-zinc-100 tracking-tight">
                Story Memory
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-mono">CanonKeeper v1.0</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-zinc-100' : 'text-zinc-500'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  pathname === '/settings'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Settings size={18} className={pathname === '/settings' ? 'text-zinc-100' : 'text-zinc-500'} />
                Settings
              </Link>
            </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
