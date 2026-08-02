import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DEFAULT_TIME_RANGES,
  uid,
  useStudyStore,
  type Habit,
  type PlannerSlot,
  type WeekStart,
} from "@/lib/study-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Self-Study Planner — Seijaku Study" },
      { name: "description", content: "Plan each week with your own time ranges, multiple subjects per slot, and a habit consistency tracker." },
      { property: "og:title", content: "Self-Study Planner — Seijaku Study" },
      { property: "og:description", content: "Plan each week with your own time ranges, multiple subjects per slot, and a habit consistency tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(weekStart: WeekStart, ref = new Date()): Date[] {
  const startIdx = weekStart === "sunday" ? 0 : 1;
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - startIdx + 7) % 7;
  d.setDate(d.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}

function PlannerPage() {
  const { settings, setSettings, plannerSlots, setPlannerSlots, habits, setHabits, hydrated } = useStudyStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editRows, setEditRows] = useState(false);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(settings.weekStart, base);
  }, [settings.weekStart, weekOffset]);

  const weekKey = toISO(weekDates[0]);
  const isCurrentWeek = weekOffset === 0;

  const dayOrder = useMemo(() => {
    const start = settings.weekStart === "sunday" ? 0 : 1;
    return Array.from({ length: 7 }, (_, i) => (start + i) % 7);
  }, [settings.weekStart]);

  const rowsTimes = settings.timeRanges?.length ? settings.timeRanges : DEFAULT_TIME_RANGES;

  // Each week gets a fresh table. Legacy slots (saved before weeks existed)
  // have no week and are shown on the current week.
  const slotMap = useMemo(() => {
    const m = new Map<string, PlannerSlot>();
    plannerSlots.forEach((s) => {
      const belongs = s.week ? s.week === weekKey : isCurrentWeek;
      if (belongs) m.set(`${s.weekday}|${s.time}`, s);
    });
    return m;
  }, [plannerSlots, weekKey, isCurrentWeek]);

  function upsertSlot(weekday: number, time: string, patch: Partial<PlannerSlot>) {
    setPlannerSlots((list) => {
      const existing = list.find(
        (s) => s.weekday === weekday && s.time === time && (s.week ? s.week === weekKey : isCurrentWeek),
      );
      if (existing) {
        return list.map((s) => (s.id === existing.id ? { ...s, week: weekKey, ...patch } : s));
      }
      return [...list, { id: uid(), week: weekKey, weekday, time, subject: "", subjects: [], note: "", ...patch }];
    });
  }

  function addSubject(weekday: number, time: string, value: string) {
    const v = value.trim();
    if (!v) return;
    const current = slotMap.get(`${weekday}|${time}`)?.subjects ?? [];
    if (current.includes(v)) return;
    upsertSlot(weekday, time, { subjects: [...current, v] });
  }
  function removeSubject(weekday: number, time: string, value: string) {
    const current = slotMap.get(`${weekday}|${time}`)?.subjects ?? [];
    upsertSlot(weekday, time, { subjects: current.filter((s) => s !== value) });
  }

  function clearWeek() {
    if (!window.confirm("Clear every slot in this week?")) return;
    setPlannerSlots((list) => list.filter((s) => (s.week ? s.week !== weekKey : !isCurrentWeek)));
  }

  // --- time range rows ---
  function setRanges(next: string[]) {
    setSettings({ ...settings, timeRanges: next });
  }
  function addRange() {
    const label = window.prompt("New time range (e.g. 07:00–08:30)", "07:00–08:30");
    if (!label?.trim()) return;
    setRanges([...rowsTimes, label.trim()]);
  }
  function renameRange(i: number, value: string) {
    const next = [...rowsTimes];
    const old = next[i];
    next[i] = value;
    setRanges(next);
    if (old !== value) {
      setPlannerSlots((list) => list.map((s) => (s.time === old ? { ...s, time: value } : s)));
    }
  }
  function removeRange(i: number) {
    const t = rowsTimes[i];
    if (!window.confirm(`Remove the ${t} row? Its planned subjects are deleted.`)) return;
    setRanges(rowsTimes.filter((_, idx) => idx !== i));
    setPlannerSlots((list) => list.filter((s) => s.time !== t));
  }
  function moveRange(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rowsTimes.length) return;
    const next = [...rowsTimes];
    [next[i], next[j]] = [next[j], next[i]];
    setRanges(next);
  }

  function addHabit() {
    const label = window.prompt("Habit name?", "New habit");
    if (!label) return;
    setHabits((h) => [...h, { id: uid(), label, dates: [] }]);
  }
  function removeHabit(id: string) {
    if (!window.confirm("Remove this habit?")) return;
    setHabits((h) => h.filter((x) => x.id !== id));
  }
  function toggleHabitDate(habit: Habit, date: string) {
    setHabits((list) =>
      list.map((h) =>
        h.id === habit.id
          ? { ...h, dates: h.dates.includes(date) ? h.dates.filter((d) => d !== date) : [...h.dates, date] }
          : h
      )
    );
  }

  const todayISO = hydrated ? toISO(new Date()) : "";

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Self-Study Planner
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Your week 🗓️</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each week starts as a clean table. Add as many subjects as you like to any slot.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
              Week starts
              <select
                value={settings.weekStart}
                onChange={(e) => setSettings({ ...settings, weekStart: e.target.value as WeekStart })}
                className="ml-1 bg-transparent focus:outline-none"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </label>
            <div className="inline-flex gap-1">
              <button onClick={() => setWeekOffset((v) => v - 1)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">
                ← Prev
              </button>
              <button onClick={() => setWeekOffset(0)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">
                This week
              </button>
              <button onClick={() => setWeekOffset((v) => v + 1)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">
                Next →
              </button>
            </div>
            <Link to="/" className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary">
              ← Tracker
            </Link>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Weekly plan · {weekDates[0].toLocaleDateString([], { month: "short", day: "numeric" })} –{" "}
                {weekDates[6].toLocaleDateString([], { month: "short", day: "numeric" })}
              </h2>
              <p className="text-xs text-muted-foreground">Type a subject and press Enter to add it as a chip.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setEditRows((v) => !v)}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${editRows ? "border-primary bg-primary/10 text-primary" : "border-[color:var(--border)] bg-white text-foreground hover:border-primary"}`}
              >
                ⏱ Edit time ranges
              </button>
              <button onClick={addRange} className="rounded-md border border-dashed border-[color:var(--border)] bg-white px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">
                + Row
              </button>
              <button onClick={() => setRanges(DEFAULT_TIME_RANGES)} className="rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">
                Reset hours
              </button>
              <button onClick={clearWeek} className="rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive">
                Clear week
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-[color:var(--muted)]/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-32 border-b border-[color:var(--border)] px-2 py-2 text-left">Time</th>
                  {dayOrder.map((wd, i) => (
                    <th key={wd} className="border-b border-l border-[color:var(--border)] px-2 py-2 text-left font-semibold">
                      <div>{DAY_NAMES[wd].slice(0, 3)}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {weekDates[i].toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsTimes.map((t, ri) => (
                  <tr key={`${t}-${ri}`} className="align-top">
                    <td className="border-b border-[color:var(--border)] px-2 py-1 font-mono text-[11px] text-muted-foreground">
                      {editRows ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={t}
                            onChange={(e) => renameRange(ri, e.target.value)}
                            className="w-20 rounded border border-[color:var(--border)] bg-white px-1 py-0.5 text-[11px] focus:border-primary focus:outline-none"
                          />
                          <div className="flex flex-col leading-none">
                            <button onClick={() => moveRange(ri, -1)} className="text-[9px] hover:text-primary">▲</button>
                            <button onClick={() => moveRange(ri, 1)} className="text-[9px] hover:text-primary">▼</button>
                          </div>
                          <button onClick={() => removeRange(ri)} className="text-[11px] hover:text-destructive">✕</button>
                        </div>
                      ) : (
                        t
                      )}
                    </td>
                    {dayOrder.map((wd) => {
                      const slot = slotMap.get(`${wd}|${t}`);
                      return (
                        <td key={wd} className="border-b border-l border-[color:var(--border)] p-1.5 align-top">
                          <SlotCell
                            subjects={slot?.subjects ?? []}
                            note={slot?.note ?? ""}
                            onAdd={(v) => addSubject(wd, t, v)}
                            onRemove={(v) => removeSubject(wd, t, v)}
                            onNote={(v) => upsertSlot(wd, t, { note: v })}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Consistency tracker</h2>
              <p className="text-xs text-muted-foreground">Tick each day you kept your habit this week.</p>
            </div>
            <button
              onClick={addHabit}
              className="rounded-md border border-dashed border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
            >
              + Habit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-[color:var(--muted)]/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-52 border-b border-[color:var(--border)] px-3 py-2 text-left">Habit</th>
                  {dayOrder.map((wd, i) => (
                    <th key={wd} className="border-b border-l border-[color:var(--border)] px-2 py-2 text-center">
                      <div>{DAY_NAMES[wd].slice(0, 3)}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">{weekDates[i].getDate()}</div>
                    </th>
                  ))}
                  <th className="w-16 border-b border-l border-[color:var(--border)] px-2 py-2 text-center">✓/7</th>
                </tr>
              </thead>
              <tbody>
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-xs text-muted-foreground">
                      Add a habit to start tracking your consistency.
                    </td>
                  </tr>
                )}
                {habits.map((h) => {
                  const weekChecks = weekDates.filter((d) => h.dates.includes(toISO(d))).length;
                  return (
                    <tr key={h.id} className="group">
                      <td className="border-b border-[color:var(--border)] px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{h.label}</span>
                          <button
                            onClick={() => removeHabit(h.id)}
                            className="text-[11px] text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                      {weekDates.map((d) => {
                        const iso = toISO(d);
                        const checked = h.dates.includes(iso);
                        const isToday = iso === todayISO;
                        return (
                          <td key={iso} className={`border-b border-l border-[color:var(--border)] px-2 py-2 text-center ${isToday ? "bg-primary/5" : ""}`}>
                            <button
                              onClick={() => toggleHabitDate(h, iso)}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-colors ${
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-[color:var(--border)] bg-white text-muted-foreground hover:border-primary"
                              }`}
                              aria-label={`${checked ? "Untick" : "Tick"} ${h.label} on ${iso}`}
                            >
                              {checked ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                      <td className="border-b border-l border-[color:var(--border)] px-2 py-2 text-center text-xs font-bold text-primary">
                        {weekChecks}/7
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SlotCell({
  subjects,
  note,
  onAdd,
  onRemove,
  onNote,
}: {
  subjects: string[];
  note: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  onNote: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="min-w-[110px] space-y-1">
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {subjects.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
            >
              {s}
              <button onClick={() => onRemove(s)} className="text-[10px] opacity-60 hover:opacity-100" aria-label={`Remove ${s}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(draft);
            setDraft("");
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            onAdd(draft);
            setDraft("");
          }
        }}
        placeholder="+ subject"
        className="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-foreground focus:border-primary focus:bg-white focus:outline-none"
      />
      <input
        value={note}
        onChange={(e) => onNote(e.target.value)}
        placeholder="note"
        className="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground focus:border-primary focus:bg-white focus:outline-none"
      />
    </div>
  );
}
