interface DecorativeDividerProps {
  variant?: 'brass-rule' | 'flourish' | 'chapter-break' | 'section';
  className?: string;
}

export function DecorativeDivider({ variant = 'section', className = '' }: DecorativeDividerProps) {
  if (variant === 'brass-rule') {
    return (
      <div className={`flex items-center gap-0 ${className}`} role="separator">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brass-500/40 to-transparent" />
        <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0 mx-1" fill="none">
          <rect x="6" y="0" width="8.5" height="8.5" rx="1" transform="rotate(45 6 0)" fill="#a88540" opacity="0.5" />
        </svg>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brass-500/40 to-transparent" />
      </div>
    );
  }

  if (variant === 'flourish') {
    return (
      <div className={`flex items-center justify-center ${className}`} role="separator">
        <svg viewBox="0 0 120 20" className="w-28 h-5 opacity-40" fill="none">
          {/* Left scroll */}
          <path
            d="M10 10 Q10 4 16 4 Q22 4 22 10 Q22 16 16 16"
            stroke="#9a7a4a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M22 10 L55 10" stroke="#9a7a4a" strokeWidth="1" />
          {/* Center dot */}
          <circle cx="60" cy="10" r="2" fill="#a88540" />
          {/* Right scroll (mirrored) */}
          <path d="M65 10 L98 10" stroke="#9a7a4a" strokeWidth="1" />
          <path
            d="M110 10 Q110 4 104 4 Q98 4 98 10 Q98 16 104 16"
            stroke="#9a7a4a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'chapter-break') {
    return (
      <div className={`flex items-center justify-center gap-3 py-2 ${className}`} role="separator">
        <span className="w-1.5 h-1.5 rounded-full bg-brass-500/50" />
        <span className="w-1.5 h-1.5 rounded-full bg-brass-500/40" />
        <span className="w-1.5 h-1.5 rounded-full bg-brass-500/50" />
      </div>
    );
  }

  // variant === 'section'
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-sepia-300/30 to-transparent ${className}`} role="separator" />
  );
}
