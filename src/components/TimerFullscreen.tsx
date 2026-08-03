import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_TIMER_BACKGROUND,
  TIMER_BG_PRESETS,
  timerBackgroundStyle,
  useStudyStore,
  type TimerDisplay,
} from "@/lib/study-store";


type Props = {
  open: boolean;
  onClose: () => void;
  display: TimerDisplay;
  onChange: (d: TimerDisplay) => void;
  running: boolean;
  toggleRun: () => void;
  reset: () => void;
  setPreset: (min: number) => void;
  mm: string;
  ss: string;
};

const PRESETS = [15, 25, 45, 60];

export function TimerFullscreen({
  open,
  onClose,
  display,
  onChange,
  running,
  toggleRun,
  reset,
  setPreset,
  mm,
  ss,
}: Props) {
  const { settings } = useStudyStore();
  const [now, setNow] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customMin, setCustomMin] = useState("");

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
  const clockHour12 = (settings.timeFormat ?? "12h") === "12h";
  const timeStr = now
    ? now.toLocaleTimeString(
        [],
        display.showSeconds
          ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: clockHour12 }
          : { hour: "2-digit", minute: "2-digit", hour12: clockHour12 },
      )
    : "--:--";
  const dateStr = now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  function applyCustom() {
    const n = Math.max(1, Math.min(240, Number(customMin) || 0));
    if (!n) return;
    setPreset(n);
    setCustomMin("");
  }

  const bg = display.background ?? DEFAULT_TIMER_BACKGROUND;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors ${
        dark
          ? "bg-[radial-gradient(ellipse_at_top,oklch(0.24_0.06_260),oklch(0.14_0.04_260))] text-white"
          : "bg-[radial-gradient(ellipse_at_top,oklch(0.98_0.02_255),oklch(0.94_0.04_255))] text-foreground"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ ...timerBackgroundStyle(bg), opacity: bg.opacity }}
      />
      <div className="relative flex w-full flex-1 flex-col items-center justify-center">

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`h-9 w-9 rounded-full border text-lg font-bold ${
              dark ? "border-white/25 hover:bg-white/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
            }`}
            aria-label="Timer settings"
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-60 rounded-xl border p-3 text-sm shadow-lg ${
                dark ? "border-white/20 bg-[oklch(0.22_0.04_260)]" : "border-[color:var(--border)] bg-white"
              }`}
            >
              <label className="mb-2 flex items-center justify-between gap-2">
                <span>Theme</span>
                <select
                  value={display.theme}
                  onChange={(e) => onChange({ ...display, theme: e.target.value as TimerDisplay["theme"] })}
                  className={`rounded border px-2 py-0.5 text-xs ${
                    dark ? "border-white/25 bg-transparent" : "border-[color:var(--border)] bg-white"
                  }`}
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
                  className={`rounded border px-2 py-0.5 text-xs ${
                    dark ? "border-white/25 bg-transparent" : "border-[color:var(--border)] bg-white"
                  }`}
                >
                  <option value="digital">Digital</option>
                  <option value="flip">Flip clock</option>
                  <option value="minimal">Minimal</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show seconds</span>
                <input
                  type="checkbox"
                  checked={display.showSeconds}
                  onChange={(e) => onChange({ ...display, showSeconds: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show date</span>
                <input
                  type="checkbox"
                  checked={display.showDate}
                  onChange={(e) => onChange({ ...display, showDate: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 py-1">
                <span>Show timer</span>
                <input
                  type="checkbox"
                  checked={display.showTimer}
                  onChange={(e) => onChange({ ...display, showTimer: e.target.checked })}
                />
              </label>

              <div className={`mt-2 border-t pt-2 ${dark ? "border-white/15" : "border-[color:var(--border)]"}`}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  Background
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {TIMER_BG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onChange({ ...display, background: { ...bg, kind: "preset", value: p.id } })}
                      title={p.label}
                      className={`h-6 w-6 rounded-full border ${
                        bg.kind === "preset" && bg.value === p.id ? "ring-2 ring-primary" : ""
                      } ${dark ? "border-white/25" : "border-[color:var(--border)]"}`}
                      style={{ background: p.css }}
                    />
                  ))}
                </div>
                <label className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs">Custom colour</span>
                  <input
                    type="color"
                    value={bg.kind === "color" ? bg.value : "#dbeafe"}
                    onChange={(e) => onChange({ ...display, background: { ...bg, kind: "color", value: e.target.value } })}
                    className="h-6 w-10 cursor-pointer rounded border border-[color:var(--border)] bg-transparent"
                  />
                </label>
                <input
                  value={bg.kind === "image" ? bg.value : ""}
                  onChange={(e) =>
                    onChange({ ...display, background: { ...bg, kind: e.target.value ? "image" : "preset", value: e.target.value || "sky" } })
                  }
                  placeholder="Image URL…"
                  className={`mb-2 w-full rounded border px-2 py-1 text-xs outline-none ${
                    dark ? "border-white/25 bg-transparent placeholder:text-white/50" : "border-[color:var(--border)] bg-white"
                  }`}
                />
                <label className="flex items-center justify-between gap-2">
                  <span className="text-xs">Opacity</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(bg.opacity * 100)}
                    onChange={(e) => onChange({ ...display, background: { ...bg, opacity: Number(e.target.value) / 100 } })}
                    className="w-28"
                  />
                </label>
              </div>
            </div>

          )}
        </div>
        <button
          onClick={onClose}
          className={`h-9 w-9 rounded-full border text-lg font-bold ${
            dark ? "border-white/25 hover:bg-white/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
          }`}
          aria-label="Exit fullscreen"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <ClockDisplay style={display.style} time={timeStr} dark={dark} />
        {display.showDate && (
          <div className="text-sm uppercase tracking-[0.3em] opacity-70">{dateStr}</div>
        )}
        {display.showTimer && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="font-mono text-6xl font-bold tabular-nums md:text-8xl">
              {mm}:{ss}
            </div>

            {/* Presets + custom minutes */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPreset(m)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    dark
                      ? "border-white/25 hover:bg-white/10"
                      : "border-[color:var(--border)] bg-white hover:border-primary hover:text-primary"
                  }`}
                >
                  {m}m
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                  placeholder="min"
                  className={`w-16 rounded-full border px-2 py-1 text-xs outline-none ${
                    dark
                      ? "border-white/25 bg-transparent placeholder:text-white/50"
                      : "border-[color:var(--border)] bg-white"
                  }`}
                />
                <button
                  onClick={applyCustom}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    dark
                      ? "border-white/25 hover:bg-white/10"
                      : "border-[color:var(--border)] bg-white hover:border-primary hover:text-primary"
                  }`}
                >
                  Set
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleRun}
                className={`rounded-full px-6 py-2 text-sm font-semibold ${
                  dark ? "bg-white text-black hover:opacity-90" : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className={`rounded-full border px-5 py-2 text-sm font-semibold ${
                  dark
                    ? "border-white/30 hover:bg-white/10"
                    : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>,

    document.body,
  );
}

function ClockDisplay({ style, time, dark }: { style: TimerDisplay["style"]; time: string; dark: boolean }) {
  if (style === "minimal") {
    return <div className="font-mono text-6xl font-light tabular-nums md:text-[9rem]">{time}</div>;
  }
  if (style === "flip") {
    return (
      <div className="flex items-center gap-2 md:gap-3">
        {time.split("").map((ch, i) =>
          ch === ":" ? (
            <span
              key={i}
              className={`self-center text-5xl font-bold md:text-8xl ${
                dark ? "text-white/50 animate-pulse" : "text-primary/60 animate-pulse"
              }`}
            >
              :
            </span>
          ) : (
            <FlipCard key={i} digit={ch} dark={dark} />
          ),
        )}
      </div>
    );
  }
  return <div className="font-mono text-7xl font-bold tabular-nums md:text-[10rem]">{time}</div>;
}

function FlipCard({ digit, dark }: { digit: string; dark: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-xl ${
        dark
          ? "border-white/10 bg-gradient-to-b from-[oklch(0.28_0.06_260)] to-[oklch(0.14_0.04_260)]"
          : "border-black/10 bg-gradient-to-b from-[oklch(0.28_0.06_260)] to-[oklch(0.16_0.04_260)]"
      }`}
      style={{
        width: "clamp(4rem, 12vw, 8rem)",
        height: "clamp(6rem, 17vw, 11rem)",
      }}
    >
      {/* Center split line for that flip-clock look */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/50" />
      {/* Subtle top-half sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      <span
        key={digit}
        className="flex h-full w-full items-center justify-center font-mono font-bold tabular-nums text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
        style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)", animation: "flipIn 0.35s ease-out" }}
      >
        {digit}
      </span>
      <style>{`
        @keyframes flipIn {
          0% { transform: rotateX(-90deg); opacity: 0; }
          100% { transform: rotateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
