"use client";

interface LoopRingProps {
  /** current loop / segment number to highlight */
  active?: number;
  /** total segments in the ring */
  total?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

/**
 * Signature visual element of Ultra Lab.
 * A circular ring of ticks referencing the hourly 6706m loops of a Backyard Ultra.
 * Used both decoratively (hero) and functionally (category/progress indicator).
 */
export default function LoopRing({
  active = 1,
  total = 12,
  size = 280,
  label,
  sublabel,
}: LoopRingProps) {
  const radius = size / 2 - 18;
  const center = size / 2;
  const ticks = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}${sublabel ? `, ${sublabel}` : ""}` : "Loop ring"}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
        {ticks.map((i) => {
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
          const isActive = i < active;
          const tickLen = isActive ? 14 : 8;
          const x1 = center + Math.cos(angle) * radius;
          const y1 = center + Math.sin(angle) * radius;
          const x2 = center + Math.cos(angle) * (radius - tickLen);
          const y2 = center + Math.sin(angle) * (radius - tickLen);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? "var(--color-amber)" : "var(--color-bone-muted)"}
              strokeOpacity={isActive ? 1 : 0.35}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="relative flex flex-col items-center text-center px-4">
        {label && (
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-amber)]">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="font-display text-sm mt-2 text-[var(--color-bone-muted)] max-w-[14ch]">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
