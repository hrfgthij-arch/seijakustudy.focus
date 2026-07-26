import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TimerDisplay } from "@/lib/study-store";

type Props = {
  open: boolean;
  onClose: () => void;
  display: TimerDisplay;
  onChange: (d: TimerDisplay) => void;
  running: boolean;
  toggleRun: () => void;
  reset: () => void;
  mm: string;
  ss: string;
};

export function TimerFullscreen({ open, onClose, display, onChange, running, toggleRun, reset, mm, ss }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const dark = display.theme === "dark";
  const timeStr = now
    ? now.toLocaleTimeString([], display.showSeconds ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const dateStr = now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors ${dark ? "bg-[oklch(0.18_0.04_260)] text-white" : "bg-white text-foreground"}`}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`h-9 w-9 rounded-full border text-lg font-bold ${dark ? "border-white/25 hover:bg-white/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"}`}
            aria-label="Timer settings"
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-60 rounded-xl border p-3 text-sm shadow-lg ${dark ? "border-white/20 bg-[oklch(0.22_0.04_260)]" : "border-[color:var(--border)] bg-white"}`}
            >
              <label className="mb-2 flex items-center justify-between gap-2">
                <span>Theme</span>
                <select
                  value={display.theme}
                  onChange={(e) => onChange({ ...display, theme: e.target.value as TimerDisplay["theme"] })}
                  className={`rounded border px-2 py-0.5 text-xs ${dark ? "border-white/25 bg-transparent" : "border-[color:var(--border)] bg-white"}`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="mb-2 flex items-center justify-between gap-2">
                <span>Clock style</span>
                <select
                  value={display.style}
                  onChange={(e) => onChange({ ...display, style: e.target.value as TimerDisplay["style"] })}
                  className={`rounded border px-2 py-0.5 text-xs ${dark ? "border-white/25 bg-transparent" : "border-[color:var(--border)] bg-white"}`}
                >
                  <option value="digital">Digital</option>
                  <option value="flip">Flip clock</option>
                  <option value="minimal">Minimal</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show seconds</span>
                <input type="checkbox" checked={display.showSeconds} onChange={(e) => onChange({ ...display, showSeconds: e.target.checked })} />
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show date</span>
                <input type="checkbox" checked={display.showDate} onChange={(e) => onChange({ ...display, showDate: e.target.checked })} />
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show timer</span>
                <input type="checkbox" checked={display.showTimer} onChange={(e) => onChange({ ...display, showTimer: e.target.checked })} />
              </label>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={`h-9 w-9 rounded-full border text-lg font-bold ${dark ? "border-white/25 hover:bg-white/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"}`}
          aria-label="Exit fullscreen"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <ClockDisplay style={display.style} time={timeStr} />
        {display.showDate && <div className="text-sm uppercase tracking-[0.3em] opacity-70">{dateStr}</div>}
        {display.showTimer && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="font-mono text-6xl font-bold tabular-nums md:text-8xl">
              {mm}:{ss}
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleRun}
                className={`rounded-full px-6 py-2 text-sm font-semibold ${dark ? "bg-white text-black hover:opacity-90" : "bg-primary text-primary-foreground hover:opacity-90"}`}
              >
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className={`rounded-full border px-5 py-2 text-sm font-semibold ${dark ? "border-white/30 hover:bg-white/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"}`}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function ClockDisplay({ style, time }: { style: TimerDisplay["style"]; time: string }) {
  if (style === "minimal") {
    return <div className="font-mono text-6xl font-light tabular-nums md:text-8xl">{time}</div>;
  }
  if (style === "flip") {
    return (
      <div className="flex gap-2">
        {time.split("").map((ch, i) =>
          ch === ":" ? (
            <span key={i} className="self-center text-4xl md:text-6xl">·</span>
          ) : (
            <span
              key={i}
              className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 font-mono text-5xl font-bold tabular-nums text-white shadow-inner md:px-5 md:py-3 md:text-8xl"
            >
              {ch}
            </span>
          ),
        )}
      </div>
    );
  }
  return <div className="font-mono text-7xl font-bold tabular-nums md:text-9xl">{time}</div>;
}
