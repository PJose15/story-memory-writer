import { Check, Minus, Pencil, X } from 'lucide-react';
import type { CanonStatus } from '@/lib/store';

interface WaxSealBadgeProps {
  status: CanonStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

const config: Record<CanonStatus, { label: string; bg: string; text: string; border: string; icon: typeof Check }> = {
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-forest-700/15',
    text: 'text-forest-800',
    border: 'border-forest-600/30 ring-1 ring-forest-400/20',
    icon: Check,
  },
  flexible: {
    label: 'Flexible',
    bg: 'bg-brass-500/15',
    text: 'text-brass-800',
    border: 'border-brass-500/30 ring-1 ring-brass-400/20',
    icon: Minus,
  },
  draft: {
    label: 'Draft',
    bg: 'bg-brass-400/15',
    text: 'text-brass-900',
    border: 'border-brass-400/30 ring-1 ring-brass-300/20',
    icon: Pencil,
  },
  discarded: {
    label: 'Discarded',
    bg: 'bg-wax-500/15',
    text: 'text-wax-800',
    border: 'border-wax-500/30 ring-1 ring-wax-500/20',
    icon: X,
  },
};

export function WaxSealBadge({ status, size = 'sm', showLabel = true, showIcon = true, className = '' }: WaxSealBadgeProps) {
  const c = config[status];
  const Icon = c.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 border rounded-full font-semibold uppercase tracking-wider select-none',
        c.bg, c.text, c.border,
        sizeClasses,
        'rotate-[-1deg]',
        className,
      ].join(' ')}
    >
      {showIcon && <Icon size={iconSize} />}
      {showLabel && c.label}
    </span>
  );
}
