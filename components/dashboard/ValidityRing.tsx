import { getUrgencyColor } from "@/lib/validity";

interface ValidityRingProps {
  ringPercent: number;
  daysLeft: number;
}

const SIZE = 32;
const STROKE_WIDTH = 3;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ValidityRing({ ringPercent, daysLeft }: ValidityRingProps) {
  const color = getUrgencyColor(daysLeft);
  const offset = CIRCUMFERENCE * (1 - ringPercent / 100);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          data-testid="validity-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
        style={{ color }}
      >
        {daysLeft}d
      </span>
    </div>
  );
}
