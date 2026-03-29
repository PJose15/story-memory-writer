'use client';

import { Flame } from 'lucide-react';

interface FlowMomentsBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export function FlowMomentsBadge({ count, size = 'sm' }: FlowMomentsBadgeProps) {
  if (count === 0) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5 gap-0.5'
    : 'text-sm px-2 py-1 gap-1';

  const iconSize = size === 'sm' ? 10 : 14;

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full bg-amber-100 text-amber-700 font-medium`}
      data-testid="flow-moments-badge"
      title={`${count} flow moment${count !== 1 ? 's' : ''} detected`}
    >
      <Flame size={iconSize} className="text-amber-500" />
      {count}
    </span>
  );
}
