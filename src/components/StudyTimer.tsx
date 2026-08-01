import { useEffect, useState } from "react";
import { TimerFullscreen } from "./TimerFullscreen";
import {
  DEFAULT_TIMER_DISPLAY,
  timerBackgroundStyle,
  useStudyStore,
  type TimerDisplay,
} from "@/lib/study-store";


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

// Shared timer state so the header timer and the mobile sticky timer show the same countdown.
type SharedTimer = {
  total: number;
  left: number;
  running: boolean;
};
let sharedTimer: SharedTimer = { total: 25 * 60, left: 25 * 60, running: false };
const timerListeners = new Set<(t: SharedTimer) => void>();
function setSharedTimer(patch: Partial<SharedTimer>) {
  sharedTimer = { ...sharedTimer, ...patch };
  timerListeners.forEach((l) => l(sharedTimer));
}

function useSharedTimer() {
  const [t, setT] = useState(sharedTimer);
  useEffect(() => {
    const l = (v: SharedTimer) => setT(v);
    timerListeners.add(l);
    return () => {
      timerListeners.delete(l);
    };
  }, []);
  return t;
}

// Single global ticking loop so the countdown continues across mounts / scrolls.
let tickHandle: ReturnType<typeof setInterval> | null = null;
function ensureTicking() {
  if (tickHandle) return;
  tickHandle = setInterval(() => {
    if (!sharedTimer.running) return;
    const nextLeft = sharedTimer.left - 1;
    if (nextLeft <= 0) {
      setSharedTimer({ left: 0, running: false });
      beep();
    } else {
      setSharedTimer({ left: nextLeft });
    }
  }, 1000);
}

export function StudyTimer() {
  return <TimerCard variant="full" />;
}

/** Compact sticky version — shown at bottom of viewport on mobile while running. */
export function MobileStickyTimer() {
  const { running } = useSharedTimer();
  if (!running) return null;
  return (
    <div className="fixed bottom-3 right-3 z-30 lg:hidden">
      <TimerCard variant="sticky" />
    </div>
  );
}

/** Sticky pill that rides along the top of the page whenever the timer runs. */
export function StickyTimerBar() {
  const { running } = useSharedTimer();
  if (!running) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex justify-center px-3">
      <div className="pointer-events-auto">
        <TimerCard variant="sticky" />
      </div>
    </div>
  );
}


function TimerCard({ variant }: { variant: "full" | "sticky" }) {
  const { settings, setSettings } = useStudyStore();
  const display = settings.timerDisplay ?? DEFAULT_TIMER_DISPLAY;
  const { total, left, running } = useSharedTimer();
  const [customMin, setCustomMin] = useState("");
  const [fs, setFs] = useState(false);

  useEffect(() => ensureTicking(), []);

  function setPreset(min: number) {
    setSharedTimer({ total: min * 60, left: min * 60, running: false });
  }
  function applyCustom() {
    const n = Math.max(1, Math.min(240, Number(customMin) || 0));
    if (!n) return;
    setPreset(n);
    setCustomMin("");
  }
  function toggleRun() {
    setSharedTimer({ running: !sharedTimer.running });
  }
  function reset() {
    setSharedTimer({ running: false, left: sharedTimer.total });
  }
  function updateDisplay(d: TimerDisplay) {
    setSettings({ ...settings, timerDisplay: d });
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = total ? ((total - left) / total) * 100 : 0;
  const totalMin = total / 60;

  if (variant === "sticky") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white/60 px-3 py-2 shadow-lg backdrop-blur-md">
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {mm}:{ss}
        </span>
        <button
          onClick={toggleRun}
          className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
        >
          {running ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => setFs(true)}
          className="rounded-md border border-[color:var(--border)] bg-white/70 px-2 py-1 text-[11px] font-semibold text-foreground hover:border-primary"
          aria-label="Fullscreen timer"
        >
          ⛶
        </button>
        <TimerFullscreen
          open={fs}
          onClose={() => setFs(false)}
          display={display}
          onChange={updateDisplay}
          running={running}
          toggleRun={toggleRun}
          reset={reset}
          setPreset={setPreset}
          mm={mm}
          ss={ss}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-white/60 p-3 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
          ⏱️
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {mm}:{ss}
          </span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={toggleRun}
            className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            {running ? "Pause" : left === 0 ? "Done" : "Start"}
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-[color:var(--border)] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary"
          >
            Reset
          </button>
        </div>
        <button
          onClick={() => setFs(true)}
          className="rounded-md border border-[color:var(--border)] bg-white/70 px-2 py-1 text-[11px] font-semibold text-foreground hover:border-primary"
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          ⛶
        </button>
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
            className="w-14 rounded border border-[color:var(--border)] bg-white/80 px-1.5 py-0.5 text-[10px] outline-none focus:border-primary"
          />
          <button
            onClick={applyCustom}
            className="rounded bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-foreground hover:text-primary"
          >
            Set
          </button>
        </div>
      </div>

      <TimerFullscreen
        open={fs}
        onClose={() => setFs(false)}
        display={display}
        onChange={updateDisplay}
        running={running}
        toggleRun={toggleRun}
        reset={reset}
        setPreset={setPreset}
        mm={mm}
        ss={ss}
      />
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
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-2.5 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg">
        ⏰
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-lg font-bold tabular-nums tracking-tight text-foreground">
          {time}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {date || "\u00A0"}
        </span>
      </div>
    </div>
  );
}
