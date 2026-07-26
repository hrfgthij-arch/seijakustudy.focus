import { useMemo } from "react";
import { uid, type SleepEntry, type WeekStart } from "@/lib/study-store";

type Props = {
  entries: SleepEntry[];
  onChange: (e: SleepEntry[]) => void;
  onHide: () => void;
  weekStart?: WeekStart;
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekDates(weekStart: WeekStart): Date[] {
  const startIdx = weekStart === "sunday" ? 0 : 1;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - startIdx + 7) % 7;
  d.setDate(d.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}

function hoursBetween(sleep: string | null | undefined, wake: string | null | undefined): number | null {
  if (!sleep || !wake) return null;
  const [sh, sm] = sleep.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  if ([sh, sm, wh, wm].some((n) => Number.isNaN(n))) return null;
  let mins = wh * 60 + wm - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // wraps past midnight
  return Math.round((mins / 60) * 10) / 10;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SleepTracker({ entries, onChange, onHide, weekStart = "sunday" }: Props) {
  const week = useMemo(() => weekDates(weekStart), [weekStart]);
  const byDate = useMemo(() => {
    const m = new Map<string, SleepEntry>();
    entries.forEach((e) => m.set(e.date, e));
    return m;
  }, [entries]);

  function upsert(date: string, patch: Partial<SleepEntry>) {
    const existing = byDate.get(date);
    if (existing) {
      const next: SleepEntry = { ...existing, ...patch };
      next.hours = hoursBetween(next.sleepTime, next.wakeTime) ?? Number(next.hours) ?? 0;
      onChange(entries.map((e) => (e.id === existing.id ? next : e)));
    } else {
      const draft: SleepEntry = {
        id: uid(),
        date,
        hours: 0,
        note: "",
        sleepTime: null,
        wakeTime: null,
        ...patch,
      };
      draft.hours = hoursBetween(draft.sleepTime, draft.wakeTime) ?? 0;
      onChange([...entries, draft]);
    }
  }

  const avg = (() => {
    const vals = week.map((d) => byDate.get(toISO(d))?.hours).filter((v): v is number => typeof v === "number" && v > 0);
    if (!vals.length) return "—";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  })();

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white/75 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-3 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold text-foreground">🌙 Weekly sleep</h2>
          <p className="text-[10px] text-muted-foreground">Avg {avg} h this week</p>
        </div>
        <button onClick={onHide} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">
          Hide
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-1 text-left font-semibold">Day</th>
              <th className="px-1 py-1 text-left font-semibold">Sleep</th>
              <th className="px-1 py-1 text-left font-semibold">Wake</th>
              <th className="px-1 py-1 text-right font-semibold">Hrs</th>
            </tr>
          </thead>
          <tbody>
            {week.map((d) => {
              const iso = toISO(d);
              const e = byDate.get(iso);
              return (
                <tr key={iso} className="border-t border-[color:var(--border)]/60">
                  <td className="px-2 py-1 font-semibold text-foreground">{DAY_NAMES[d.getDay()]} <span className="text-muted-foreground">{d.getDate()}</span></td>
                  <td className="px-1 py-1">
                    <input
                      type="time"
                      value={e?.sleepTime ?? ""}
                      onChange={(ev) => upsert(iso, { sleepTime: ev.target.value || null })}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[10px] outline-none focus:border-primary focus:bg-white"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="time"
                      value={e?.wakeTime ?? ""}
                      onChange={(ev) => upsert(iso, { wakeTime: ev.target.value || null })}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[10px] outline-none focus:border-primary focus:bg-white"
                    />
                  </td>
                  <td className="px-1 py-1 text-right font-mono text-[10px] font-bold text-primary tabular-nums">
                    {e?.hours ? e.hours.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
