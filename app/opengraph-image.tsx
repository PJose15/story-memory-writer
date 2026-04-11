import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Zagafy — Your antiquarian narrative workshop';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Brand palette (mirrors app/globals.css)
const COLORS = {
  mahogany950: '#1a0e08',
  mahogany900: '#2d1a0f',
  mahogany800: '#4a2c1a',
  mahogany700: '#6b3e25',
  cream50: '#fffdf7',
  cream100: '#fdf5e6',
  cream300: '#ead4a8',
  parchment300: '#e4cfa0',
  parchment500: '#c4a06e',
  forest700: '#166534',
  forest500: '#22c55e',
  wax600: '#b91c1c',
} as const;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: COLORS.mahogany950,
          backgroundImage: `radial-gradient(ellipse at center, ${COLORS.mahogany800} 0%, ${COLORS.mahogany900} 45%, ${COLORS.mahogany950} 100%)`,
          fontFamily: 'serif',
        }}
      >
        {/* Inner parchment-bordered card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 1080,
            height: 510,
            border: `2px solid ${COLORS.parchment500}`,
            borderRadius: 12,
            padding: '64px 80px',
            boxShadow: `inset 0 0 120px rgba(0,0,0,0.55)`,
            position: 'relative',
          }}
        >
          {/* Top ornament — forest seal */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 88,
                height: 2,
                backgroundColor: COLORS.parchment500,
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: COLORS.forest500,
                boxShadow: `0 0 18px ${COLORS.forest700}`,
              }}
            />
            <div
              style={{
                width: 88,
                height: 2,
                backgroundColor: COLORS.parchment500,
              }}
            />
          </div>

          {/* Wordmark */}
          <div
            style={{
              display: 'flex',
              fontSize: 168,
              fontWeight: 700,
              color: COLORS.cream50,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              textShadow: `0 4px 18px rgba(0,0,0,0.6)`,
            }}
          >
            Zagafy
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 34,
              fontStyle: 'italic',
              color: COLORS.parchment300,
              letterSpacing: '0.01em',
            }}
          >
            Your antiquarian narrative workshop
          </div>

          {/* Bottom ornament */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 44,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: COLORS.parchment500,
              }}
            />
            <div
              style={{
                width: 220,
                height: 1,
                backgroundColor: COLORS.parchment500,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: COLORS.wax600,
              }}
            />
            <div
              style={{
                width: 220,
                height: 1,
                backgroundColor: COLORS.parchment500,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: COLORS.parchment500,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
