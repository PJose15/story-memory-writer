'use client';

interface AvatarCircleProps {
  color: string;
  emoji: string;
  size?: number;
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function AvatarCircle({ color, emoji, size = 40 }: AvatarCircleProps) {
  const isDark = isColorDark(color);

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.5,
      }}
      aria-hidden="true"
    >
      <span style={{ filter: isDark ? 'none' : 'brightness(0.3)' }}>{emoji}</span>
    </div>
  );
}
