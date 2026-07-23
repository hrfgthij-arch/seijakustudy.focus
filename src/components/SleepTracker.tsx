import { useMemo, useState } from "react";
import { uid, type SleepEntry } from "@/lib/study-store";

type Props = {
  entries: SleepEntry[];
  onChange: (e: SleepEntry[]) => void;
  onHide: () => void;
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SleepTracker({ entries, onChange, onHide }: Props) {
  const [date, setDate] = useState(toISO(new Date()));
  const [hours, setHours] = useState("8");
  const [note, setNote] = useState("");

  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries]);
  const avg = entries.length
    ? (entries.reduce((s, e) => s + (Number(e.hours) || 0), 0) / entries.length).toFixed(1)
    : "—";

  function add() {
    if (!date) return;
    const h = Number(hours);
    if (!Number.isFinite(h)) return;
    onChange([...entries, { id: uid(), date, hours: h, note }]);
    setNote("");
  }
  function remove(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }
  function update(id: string, patch: Partial<SleepEntry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-4 py-3 md:px-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">🌙 Sleep tracker</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Log nightly rest and see your average.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            Avg {avg} h
          </span>
          <button onClick={onHide} className="text-xs text-muted-foreground hover:text-foreground">Hide</button>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-24 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Hours"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)…"
            className="flex-1 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={add}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            + Log
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-xs text-muted-foreground">
            No sleep logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--border)] overflow-hidden rounded-lg border border-[color:var(--border)]">
            {sorted.map((e) => (
              <li key={e.id} className="flex items-center gap-2 bg-white px-3 py-2">
                <input
                  type="date"
                  value={e.date}
                  onChange={(ev) => update(e.id, { date: ev.target.value })}
                  className="rounded border border-transparent bg-transparent px-1 text-xs focus:border-[color:var(--border)]"
                />
                <input
                  type="number"
                  step="0.5"
                  value={e.hours}
                  onChange={(ev) => update(e.id, { hours: Number(ev.target.value) })}
                  className="w-16 rounded border border-transparent bg-transparent px-1 text-xs focus:border-[color:var(--border)]"
                />
                <span className="text-[11px] text-muted-foreground">h</span>
                <input
                  value={e.note}
                  onChange={(ev) => update(e.id, { note: ev.target.value })}
                  placeholder="Note"
                  className="flex-1 rounded border border-transparent bg-transparent px-1 text-xs focus:border-[color:var(--border)]"
                />
                <div
                  className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--muted)]"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (Number(e.hours) / 10) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
