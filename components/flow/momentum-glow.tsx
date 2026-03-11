'use client';

interface MomentumGlowProps {
  momentum: number; // 0 to 1
}

export function MomentumGlow({ momentum }: MomentumGlowProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
      style={{ opacity: momentum * 0.3 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(99, 102, 241, ${momentum * 0.15}) 0%, rgba(139, 92, 246, ${momentum * 0.08}) 40%, transparent 70%)`,
        }}
      />
    </div>
  );
}
