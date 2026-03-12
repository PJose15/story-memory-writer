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
  UploadCloud,
  Zap,
  Map
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Manuscript', href: '/manuscript', icon: BookOpen },
  { name: 'Flow Mode', href: '/flow', icon: Zap },
  { name: 'Story Bible', href: '/bible', icon: BookOpen },
  { name: 'Characters', href: '/characters', icon: Users },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Conflicts', href: '/conflicts', icon: Swords },
  { name: 'Canon Lock', href: '/canon', icon: Lock },
  { name: 'Assistant', href: '/assistant', icon: MessageSquareText },
  { name: 'Import', href: '/import', icon: UploadCloud },
  { name: 'Writing Map', href: '/writing-map', icon: Map },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-parchment-200 border-b border-sepia-300/50">
        <span className="font-serif font-semibold text-sepia-900">Zagafy</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-sepia-600 hover:text-sepia-900" aria-label={isOpen ? 'Close navigation' : 'Open navigation'}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar — always rendered, hidden via CSS on mobile when closed */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-parchment-200 border-r border-sepia-300/50 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
            <div className="p-6 hidden md:block">
              <h1 className="font-serif text-xl font-semibold text-sepia-900 tracking-tight">
                Zagafy
              </h1>
              <p className="text-xs text-sepia-500 mt-1 font-mono">CanonKeeper v1.0</p>
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
                        ? 'bg-parchment-200 text-sepia-900'
                        : 'text-sepia-600 hover:bg-parchment-100 hover:text-sepia-800'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-sepia-900' : 'text-sepia-500'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-sepia-300/50">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  pathname === '/settings'
                    ? 'bg-parchment-200 text-sepia-900'
                    : 'text-sepia-600 hover:bg-parchment-100 hover:text-sepia-800'
                }`}
              >
                <Settings size={18} className={pathname === '/settings' ? 'text-sepia-900' : 'text-sepia-500'} />
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
