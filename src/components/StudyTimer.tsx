import { useEffect, useRef, useState } from "react";

const PRESETS = [15, 25, 45];

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.1;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 400);
  } catch {
    /* ignore */
  }
}

export function StudyTimer() {
  const [total, setTotal] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          beep();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running]);

  function setPreset(min: number) {
    setRunning(false);
    setTotal(min * 60);
    setLeft(min * 60);
  }

  function applyCustom() {
    const n = Math.max(1, Math.min(240, Number(customMin) || 0));
    if (!n) return;
    setPreset(n);
    setCustomMin("");
  }

  function reset() {
    setRunning(false);
    setLeft(total);
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = total ? ((total - left) / total) * 100 : 0;
  const totalMin = total / 60;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-white/85 p-3 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
          ⏱️
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {mm}:{ss}
          </span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            {running ? "Pause" : left === 0 ? "Done" : "Start"}
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => setPreset(m)}
            className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              totalMin === m
                ? "bg-primary/15 text-primary"
                : "bg-[color:var(--muted)] text-muted-foreground hover:text-primary"
            }`}
          >
            {m}m
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={240}
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            placeholder="min"
            className="w-14 rounded border border-[color:var(--border)] bg-white px-1.5 py-0.5 text-[10px] outline-none focus:border-primary"
          />
          <button
            onClick={applyCustom}
            className="rounded bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-foreground hover:text-primary"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-2.5 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg">
        ⏰
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-lg font-bold tabular-nums tracking-tight text-foreground">
          {time}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {date}
        </span>
      </div>
    </div>
  );
}
