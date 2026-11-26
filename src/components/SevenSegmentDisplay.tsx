import React from 'react';

interface SevenSegmentDisplayProps {
  /** Number 0..99, or null when spinning (shows '--' or active flash) */
  value: number | null;
  isSpinning: boolean;
  isUrgent: boolean;
}

/**
 * Segment map for digits 0-9 and '-' (segments a,b,c,d,e,f,g):
 *   a: top, b: top-right, c: bottom-right, d: bottom,
 *   e: bottom-left, f: top-left, g: middle
 */
const SEGMENT_MAP: Record<string, [boolean, boolean, boolean, boolean, boolean, boolean, boolean]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  '-': [false, false, false, false, false, false, true],
};

function SevenSegmentDigit({ char }: { char: string }) {
  const segs = SEGMENT_MAP[char] ?? SEGMENT_MAP['-'];
  const lit = '#ffe742';
  const unlit = '#5d0d16';

  return (
    <svg viewBox="0 0 54 96" className="w-[38%] h-[68%] overflow-visible" aria-hidden="true">
      <defs>
        <filter id="ledGlow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* a - top */}
      <polygon
        points="11,5 43,5 38,13 16,13"
        fill={segs[0] ? lit : unlit}
        filter={segs[0] ? 'url(#ledGlow)' : undefined}
      />
      {/* b - top-right */}
      <polygon
        points="45,8 45,45 38,41 38,15"
        fill={segs[1] ? lit : unlit}
        filter={segs[1] ? 'url(#ledGlow)' : undefined}
      />
      {/* c - bottom-right */}
      <polygon
        points="45,51 45,88 38,81 38,55"
        fill={segs[2] ? lit : unlit}
        filter={segs[2] ? 'url(#ledGlow)' : undefined}
      />
      {/* d - bottom */}
      <polygon
        points="11,91 43,91 38,83 16,83"
        fill={segs[3] ? lit : unlit}
        filter={segs[3] ? 'url(#ledGlow)' : undefined}
      />
      {/* e - bottom-left */}
      <polygon
        points="9,51 16,55 16,81 9,88"
        fill={segs[4] ? lit : unlit}
        filter={segs[4] ? 'url(#ledGlow)' : undefined}
      />
      {/* f - top-left */}
      <polygon
        points="9,8 16,15 16,41 9,45"
        fill={segs[5] ? lit : unlit}
        filter={segs[5] ? 'url(#ledGlow)' : undefined}
      />
      {/* g - middle */}
      <polygon
        points="12,48 17,44 37,44 42,48 37,52 17,52"
        fill={segs[6] ? lit : unlit}
        filter={segs[6] ? 'url(#ledGlow)' : undefined}
      />
    </svg>
  );
}

/** Perimeter LED bulb coordinates (percentage x, y) around the center countdown bezel */
const BORDER_BULBS: Array<{ x: number; y: number }> = [
  // Top row (left to right)
  { x: 9, y: 4.5 }, { x: 25.5, y: 4.5 }, { x: 42, y: 4.5 }, { x: 58.5, y: 4.5 }, { x: 75, y: 4.5 }, { x: 91, y: 4.5 },
  // Right column
  { x: 95.5, y: 20 }, { x: 95.5, y: 35 }, { x: 95.5, y: 50 }, { x: 95.5, y: 65 }, { x: 95.5, y: 80 },
  // Bottom row (right to left)
  { x: 91, y: 95.5 }, { x: 75, y: 95.5 }, { x: 58.5, y: 95.5 }, { x: 42, y: 95.5 }, { x: 25.5, y: 95.5 }, { x: 9, y: 95.5 },
  // Left column
  { x: 4.5, y: 80 }, { x: 4.5, y: 65 }, { x: 4.5, y: 50 }, { x: 4.5, y: 35 }, { x: 4.5, y: 20 },
];

export const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({
  value,
  isSpinning,
  isUrgent,
}) => {
  const displayStr =
    value === null ? '--' : String(Math.max(0, Math.min(99, value))).padStart(2, '0');

  return (
    <div
      className="relative w-full aspect-square rounded-[14px] p-[7px] select-none"
      style={{
        background: 'linear-gradient(180deg, #b62f9a 0%, #c8194b 55%, #d61b26 100%)',
        boxShadow: isUrgent
          ? '0 0 18px rgba(255, 50, 100, 0.85), inset 0 1px 2px rgba(255,255,255,0.45)'
          : '0 3px 10px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.35)',
      }}
      aria-label={value === null ? 'جاري السحب' : `العد التنازلي ${displayStr} ثانية`}
    >
      {/* Chasing marquee micro-LED bulbs around the pink/red frame */}
      {BORDER_BULBS.map((pos, idx) => (
        <span
          key={idx}
          className={`pointer-events-none absolute w-[3.5px] h-[3.5px] rounded-full bg-[#ffe6f6] ${
            idx % 2 === 0 ? 'animate-center-dot-a' : 'animate-center-dot-b'
          }`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 4px rgba(255,220,245,0.9)',
          }}
        />
      ))}

      {/* Dark recessed LED screen */}
      <div
        className="w-full h-full rounded-[9px] flex items-center justify-center gap-[4px] relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 45%, #530916 0%, #37040d 72%, #240208 100%)',
          boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.75)',
        }}
      >
        <SevenSegmentDigit char={isSpinning ? '-' : displayStr[0]} />
        <SevenSegmentDigit char={isSpinning ? '-' : displayStr[1]} />
      </div>
    </div>
  );
};
