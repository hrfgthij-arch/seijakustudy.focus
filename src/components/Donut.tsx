type Props = {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
};

export function Donut({ pct, size = 72, stroke = 8, label, sublabel }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * c;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.93 0.03 250)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.6 0.16 255)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums text-foreground">{clamped}%</span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <div className="max-w-[110px] truncate text-xs font-semibold text-foreground">{label}</div>
          {sublabel && <div className="text-[10px] text-muted-foreground">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
