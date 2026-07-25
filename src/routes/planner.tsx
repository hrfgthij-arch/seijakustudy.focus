import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { uid, useStudyStore, type Habit, type PlannerSlot, type WeekStart } from "@/lib/study-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Self-Study Planner — Sakura Bloom" },
      { name: "description", content: "Plan your weekly self-study sessions and tick off consistency day by day." },
      { property: "og:title", content: "Self-Study Planner — Sakura Bloom" },
      { property: "og:description", content: "Plan your weekly self-study sessions and tick off consistency day by day." },
    ],
  }),
  component: PlannerPage,
});

const HOURS = Array.from({ length: 15 }, (_, i) => `${String(6 + i).padStart(2, "0")}:00`); // 06:00 - 20:00
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
  const { settings, setSettings, plannerSlots, setPlannerSlots, habits, setHabits } = useStudyStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(settings.weekStart, base);
  }, [settings.weekStart, weekOffset]);

  const dayOrder = useMemo(() => {
    const start = settings.weekStart === "sunday" ? 0 : 1;
    return Array.from({ length: 7 }, (_, i) => (start + i) % 7);
  }, [settings.weekStart]);

  const slotMap = useMemo(() => {
    const m = new Map<string, PlannerSlot>();
    plannerSlots.forEach((s) => m.set(`${s.weekday}|${s.time}`, s));
    return m;
  }, [plannerSlots]);

  function upsertSlot(weekday: number, time: string, patch: Partial<PlannerSlot>) {
    setPlannerSlots((list) => {
      const key = `${weekday}|${time}`;
      const existing = list.find((s) => `${s.weekday}|${s.time}` === key);
      if (existing) return list.map((s) => (s.id === existing.id ? { ...s, ...patch } : s));
      return [...list, { id: uid(), weekday, time, subject: "", note: "", ...patch }];
    });
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

  const todayISO = toISO(new Date());

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
            <p className="mt-1 text-sm text-muted-foreground">Plan your study slots and track daily consistency.</p>
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
                Today
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

        <section className="mb-6 overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Weekly plan</h2>
            <p className="text-xs text-muted-foreground">Add a subject and a short note to any slot.</p>
          </div>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-[color:var(--muted)]/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-20 border-b border-[color:var(--border)] px-2 py-2 text-left">Time</th>
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
              {HOURS.map((t) => (
                <tr key={t}>
                  <td className="border-b border-[color:var(--border)] px-2 py-1 font-mono text-[11px] text-muted-foreground">{t}</td>
                  {dayOrder.map((wd) => {
                    const slot = slotMap.get(`${wd}|${t}`);
                    return (
                      <td key={wd} className="border-b border-l border-[color:var(--border)] p-1 align-top">
                        <input
                          value={slot?.subject ?? ""}
                          onChange={(e) => upsertSlot(wd, t, { subject: e.target.value })}
                          placeholder="Subject"
                          className="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-foreground focus:border-primary focus:bg-white focus:outline-none"
                        />
                        <input
                          value={slot?.note ?? ""}
                          onChange={(e) => upsertSlot(wd, t, { note: e.target.value })}
                          placeholder="note"
                          className="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground focus:border-primary focus:bg-white focus:outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {weekDates[i].getDate()}
                      </div>
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
