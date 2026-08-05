import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DAY_HOURS,
  EVENT_COLORS,
  eventColorCss,
  formatHourLabel,
  formatMinutes,
  minutesToInput,
  parseTimeToMinutes,
  uid,
  useStudyStore,
  type Habit,
  type PlannerEvent,
  type TimeFormat,
  type WeekStart,
} from "@/lib/study-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Self-Study Planner — Seijaku Study" },
      {
        name: "description",
        content:
          "A calendar-style self-study planner: full-day hourly grid, tasks with time ranges, deadlines, notes, colours and repeats, plus a habit tracker.",
      },
      { property: "og:title", content: "Self-Study Planner — Seijaku Study" },
      {
        property: "og:description",
        content:
          "A calendar-style self-study planner: full-day hourly grid, tasks with time ranges, deadlines, notes, colours and repeats, plus a habit tracker.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROW_H = 48; // px per hour

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

type Occurrence = { key: string; event: PlannerEvent; weekday: number };

/** Every event that should be drawn in the given week, expanding repeats. */
function occurrencesForWeek(events: PlannerEvent[], weekKey: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (const e of events) {
    const base = e.week || weekKey;
    if (e.repeat === "none") {
      if (base === weekKey) out.push({ key: e.id, event: e, weekday: e.weekday });
      continue;
    }
    if (base > weekKey) continue;
    if (e.repeat === "weekly") {
      out.push({ key: `${e.id}@${weekKey}`, event: e, weekday: e.weekday });
    } else {
      for (let wd = 1; wd <= 5; wd++) out.push({ key: `${e.id}@${weekKey}-${wd}`, event: e, weekday: wd });
    }
  }
  return out;
}

/** Greedy side-by-side layout for overlapping events in one day. */
function layoutDay(items: Occurrence[]) {
  const sorted = [...items].sort((a, b) => a.event.start - b.event.start || a.event.end - b.event.end);
  const columns: Occurrence[][] = [];
  const placed = new Map<string, number>();
  for (const it of sorted) {
    let ci = 0;
    while (ci < columns.length) {
      const last = columns[ci][columns[ci].length - 1];
      if (last.event.end <= it.event.start) break;
      ci++;
    }
    if (!columns[ci]) columns[ci] = [];
    columns[ci].push(it);
    placed.set(it.key, ci);
  }
  const total = Math.max(1, columns.length);
  return sorted.map((it) => ({ occ: it, col: placed.get(it.key) ?? 0, cols: total }));
}

function emptyEvent(weekKey: string, weekday: number, start: number): PlannerEvent {
  return {
    id: uid(),
    week: weekKey,
    weekday,
    start,
    end: Math.min(1440, start + 60),
    title: "",
    description: "",
    color: "blue",
    allDay: false,
    repeat: "none",
    done: false,
  };
}

function PlannerPage() {
  const { settings, setSettings, plannerEvents, setPlannerEvents, habits, setHabits, hydrated } = useStudyStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"week" | "day" | "agenda">("week");
  const [dayIndex, setDayIndex] = useState(0);
  const [editing, setEditing] = useState<{ event: PlannerEvent; isNew: boolean } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const fmt: TimeFormat = settings.timeFormat ?? "12h";

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Pick a sensible default view + day for the device width.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) setView("day");
    setDayIndex(new Date().getDay());
  }, []);

  // Start the grid scrolled to the morning instead of midnight.
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 7 * ROW_H;
  }, [view]);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(settings.weekStart, base);
  }, [settings.weekStart, weekOffset]);

  const weekKey = toISO(weekDates[0]);

  const dayOrder = useMemo(() => {
    const start = settings.weekStart === "sunday" ? 0 : 1;
    return Array.from({ length: 7 }, (_, i) => (start + i) % 7);
  }, [settings.weekStart]);

  const occurrences = useMemo(() => occurrencesForWeek(plannerEvents, weekKey), [plannerEvents, weekKey]);

  const byDay = useMemo(() => {
    const m = new Map<number, Occurrence[]>();
    for (const o of occurrences) {
      const list = m.get(o.weekday) ?? [];
      list.push(o);
      m.set(o.weekday, list);
    }
    return m;
  }, [occurrences]);

  const todayISO = hydrated && now ? toISO(now) : "";
  const visibleDays = view === "day" ? [dayOrder[Math.max(0, dayOrder.indexOf(dayIndex))] ?? dayOrder[0]] : dayOrder;
  const visibleDates = visibleDays.map((wd) => weekDates[dayOrder.indexOf(wd)]);

  function saveEvent(ev: PlannerEvent) {
    const clean: PlannerEvent = { ...ev, title: ev.title.trim() || "Untitled task", end: Math.max(ev.start + 15, ev.end) };
    setPlannerEvents((list) =>
      list.some((e) => e.id === clean.id) ? list.map((e) => (e.id === clean.id ? clean : e)) : [...list, clean],
    );
    setEditing(null);
  }
  function deleteEvent(id: string) {
    setPlannerEvents((list) => list.filter((e) => e.id !== id));
    setEditing(null);
  }
  function toggleDone(id: string) {
    setPlannerEvents((list) => list.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
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
          : h,
      ),
    );
  }

  const nowLine =
    now && weekDates.some((d) => toISO(d) === toISO(now)) ? (now.getHours() * 60 + now.getMinutes()) / 60 * ROW_H : null;

  return (
    <main className="min-h-screen px-3 py-6 sm:px-4 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-5">
        <div className="min-w-0">

        <header className="mb-5 flex flex-col gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                Self-Study Planner
              </div>
              <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Your week 🗓️</h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Tap any hour to plan a task — time range, notes, colour and repeats included.
              </p>
            </div>
            <Link
              to="/"
              className="shrink-0 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
            >
              ← Tracker
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--border)] bg-white text-xs font-semibold">
              <button onClick={() => setWeekOffset((v) => v - 1)} className="px-2.5 py-1.5 hover:text-primary" aria-label="Previous week">
                ←
              </button>
              <button onClick={() => setWeekOffset(0)} className="border-x border-[color:var(--border)] px-3 py-1.5 hover:text-primary">
                Today
              </button>
              <button onClick={() => setWeekOffset((v) => v + 1)} className="px-2.5 py-1.5 hover:text-primary" aria-label="Next week">
                →
              </button>
            </div>

            <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--border)] bg-white text-xs font-semibold">
              {(["week", "day", "agenda"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 capitalize ${view === v ? "bg-primary text-primary-foreground" : "hover:text-primary"}`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSettings({ ...settings, timeFormat: fmt === "12h" ? "24h" : "12h" })}
              className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
            >
              🕐 {fmt === "12h" ? "12-hour" : "24-hour"}
            </button>

            <label className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
              Starts
              <select
                value={settings.weekStart}
                onChange={(e) => setSettings({ ...settings, weekStart: e.target.value as WeekStart })}
                className="bg-transparent focus:outline-none"
              >
                <option value="sunday">Sun</option>
                <option value="monday">Mon</option>
              </select>
            </label>

            <button
              onClick={() => setEditing({ event: emptyEvent(weekKey, visibleDays[0] ?? 1, 9 * 60), isNew: true })}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              + Task
            </button>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] px-3 py-2.5 sm:px-4">
            <h2 className="text-sm font-bold text-foreground">
              {weekDates[0].toLocaleDateString([], { month: "short", day: "numeric" })} –{" "}
              {weekDates[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </h2>
            {view === "day" && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                <button
                  onClick={() => setDayIndex((d) => (d + 6) % 7)}
                  className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 hover:text-primary"
                >
                  ←
                </button>
                <span className="px-1">{DAY_NAMES[visibleDays[0]]}</span>
                <button
                  onClick={() => setDayIndex((d) => (d + 1) % 7)}
                  className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 hover:text-primary"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {view === "agenda" ? (
            <AgendaView
              dayOrder={dayOrder}
              weekDates={weekDates}
              byDay={byDay}
              fmt={fmt}
              todayISO={todayISO}
              onOpen={(e) => setEditing({ event: e, isNew: false })}
              onToggle={toggleDone}
            />
          ) : (
            <>
              {/* All-day strip */}
              <div className="flex border-b border-[color:var(--border)] bg-[color:var(--muted)]/40">
                <div className="w-12 shrink-0 px-1 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground sm:w-16">
                  All day
                </div>
                {visibleDays.map((wd, i) => (
                  <div key={wd} className="min-w-0 flex-1 border-l border-[color:var(--border)] px-1 py-1.5">
                    <div className="mb-1 text-center">
                      <div className="text-[11px] font-bold text-foreground">{DAY_NAMES[wd].slice(0, 3)}</div>
                      <div
                        className={`mx-auto mt-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                          toISO(visibleDates[i]) === todayISO
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {visibleDates[i].getDate()}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {(byDay.get(wd) ?? [])
                        .filter((o) => o.event.allDay)
                        .map((o) => (
                          <button
                            key={o.key}
                            onClick={() => setEditing({ event: o.event, isNew: false })}
                            className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-semibold text-white"
                            style={{ background: eventColorCss(o.event.color), opacity: o.event.done ? 0.55 : 1 }}
                          >
                            {o.event.done ? "✓ " : ""}
                            {o.event.title}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hour grid */}
              <div ref={gridRef} className="relative max-h-[62vh] overflow-y-auto">
                <div className="flex">
                  <div className="w-12 shrink-0 sm:w-16">
                    {DAY_HOURS.map((h) => (
                      <div
                        key={h}
                        style={{ height: ROW_H }}
                        className="relative border-b border-[color:var(--border)]/60 pr-1 text-right"
                      >
                        <span className="absolute -top-1.5 right-1 text-[10px] font-medium text-muted-foreground">
                          {formatHourLabel(h, fmt)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {visibleDays.map((wd) => {
                    const items = (byDay.get(wd) ?? []).filter((o) => !o.event.allDay);
                    const laid = layoutDay(items);
                    return (
                      <div key={wd} className="relative min-w-0 flex-1 border-l border-[color:var(--border)]">
                        {DAY_HOURS.map((h) => (
                          <button
                            key={h}
                            onClick={() => setEditing({ event: emptyEvent(weekKey, wd, h * 60), isNew: true })}
                            style={{ height: ROW_H }}
                            className="block w-full border-b border-[color:var(--border)]/60 transition-colors hover:bg-primary/5"
                            aria-label={`Add a task on ${DAY_NAMES[wd]} at ${formatHourLabel(h, fmt)}`}
                          />
                        ))}
                        {laid.map(({ occ, col, cols }) => {
                          const top = (occ.event.start / 60) * ROW_H;
                          const height = Math.max(18, ((occ.event.end - occ.event.start) / 60) * ROW_H - 2);
                          return (
                            <button
                              key={occ.key}
                              onClick={() => setEditing({ event: occ.event, isNew: false })}
                              className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-white shadow-sm ring-1 ring-black/5 transition-transform hover:z-20 hover:scale-[1.01]"
                              style={{
                                top,
                                height,
                                left: `calc(${(col / cols) * 100}% + 2px)`,
                                width: `calc(${100 / cols}% - 4px)`,
                                background: eventColorCss(occ.event.color),
                                opacity: occ.event.done ? 0.55 : 1,
                              }}
                            >
                              <div className="truncate text-[11px] font-bold leading-tight">
                                {occ.event.done ? "✓ " : ""}
                                {occ.event.title}
                              </div>
                              {height > 30 && (
                                <div className="truncate text-[10px] opacity-90">
                                  {formatMinutes(occ.event.start, fmt)} – {formatMinutes(occ.event.end, fmt)}
                                </div>
                              )}
                              {height > 56 && occ.event.description && (
                                <div className="truncate text-[10px] opacity-80">{occ.event.description}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                {nowLine !== null && (
                  <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowLine }}>
                    <div className="ml-12 h-px bg-[oklch(0.6_0.2_25)] sm:ml-16">
                      <span className="-mt-[3px] -ml-[3px] block h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.2_25)]" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-[color:var(--border)] px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">Consistency tracker</h2>
              <p className="text-xs text-muted-foreground">Tick each day you kept your habit this week.</p>
            </div>
            <button
              onClick={addHabit}
              className="shrink-0 rounded-md border border-dashed border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
            >
              + Habit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="bg-[color:var(--muted)]/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-40 border-b border-[color:var(--border)] px-3 py-2 text-left">Habit</th>
                  {dayOrder.map((wd, i) => (
                    <th key={wd} className="border-b border-l border-[color:var(--border)] px-1 py-2 text-center">
                      <div>{DAY_NAMES[wd].slice(0, 3)}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">{weekDates[i].getDate()}</div>
                    </th>
                  ))}
                  <th className="w-14 border-b border-l border-[color:var(--border)] px-1 py-2 text-center">✓/7</th>
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-medium text-foreground">{h.label}</span>
                          <button
                            onClick={() => removeHabit(h.id)}
                            className="shrink-0 text-[11px] text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                      {weekDates.map((d) => {
                        const iso = toISO(d);
                        const checked = h.dates.includes(iso);
                        return (
                          <td
                            key={iso}
                            className={`border-b border-l border-[color:var(--border)] px-1 py-2 text-center ${
                              iso === todayISO ? "bg-primary/5" : ""
                            }`}
                          >
                            <button
                              onClick={() => toggleHabitDate(h, iso)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors ${
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
                      <td className="border-b border-l border-[color:var(--border)] px-1 py-2 text-center text-xs font-bold text-primary">
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
        {settings.showPlannerTodo && (
          <aside className="mt-5 hidden lg:sticky lg:top-16 lg:mt-0 lg:block">
            <TodoList compact />
          </aside>
        )}
      </div>


      {editing && (
        <EventDialog
          key={editing.event.id}
          initial={editing.event}
          isNew={editing.isNew}
          fmt={fmt}
          dayOrder={dayOrder}
          onCancel={() => setEditing(null)}
          onSave={saveEvent}
          onDelete={() => deleteEvent(editing.event.id)}
        />
      )}
    </main>
  );
}

function AgendaView({
  dayOrder,
  weekDates,
  byDay,
  fmt,
  todayISO,
  onOpen,
  onToggle,
}: {
  dayOrder: number[];
  weekDates: Date[];
  byDay: Map<number, Occurrence[]>;
  fmt: TimeFormat;
  todayISO: string;
  onOpen: (e: PlannerEvent) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-[color:var(--border)]">
      {dayOrder.map((wd, i) => {
        const items = [...(byDay.get(wd) ?? [])].sort(
          (a, b) => Number(b.event.allDay) - Number(a.event.allDay) || a.event.start - b.event.start,
        );
        const iso = toISO(weekDates[i]);
        return (
          <div key={wd} className={`px-3 py-3 sm:px-4 ${iso === todayISO ? "bg-primary/5" : ""}`}>
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="text-sm font-bold text-foreground">{DAY_NAMES[wd]}</span>
              <span className="text-xs text-muted-foreground">
                {weekDates[i].toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing planned.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((o) => (
                  <li key={o.key} className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(o.event.id)}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[10px] ${
                        o.event.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-[color:var(--border)] bg-white"
                      }`}
                      aria-label="Toggle done"
                    >
                      {o.event.done ? "✓" : ""}
                    </button>
                    <button
                      onClick={() => onOpen(o.event)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-left hover:border-primary"
                    >
                      <span
                        className="h-6 w-1 shrink-0 rounded-full"
                        style={{ background: eventColorCss(o.event.color) }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs font-semibold ${o.event.done ? "line-through opacity-60" : "text-foreground"}`}>
                          {o.event.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {o.event.allDay
                            ? "All day"
                            : `${formatMinutes(o.event.start, fmt)} – ${formatMinutes(o.event.end, fmt)}`}
                          {o.event.description ? ` · ${o.event.description}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EventDialog({
  initial,
  isNew,
  fmt,
  dayOrder,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: PlannerEvent;
  isNew: boolean;
  fmt: TimeFormat;
  dayOrder: number[];
  onCancel: () => void;
  onSave: (e: PlannerEvent) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<PlannerEvent>(initial);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function patch(p: Partial<PlannerEvent>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[color:var(--border)] bg-white p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{isNew ? "New task" : "Edit task"}</h3>
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-destructive" aria-label="Close">
            ✕
          </button>
        </div>

        <input
          autoFocus
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Add a title (e.g. Physics — Chapter 4)"
          className="mb-3 w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
        />

        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Day
            <select
              value={draft.weekday}
              onChange={(e) => patch({ weekday: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-white px-2 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
            >
              {dayOrder.map((wd) => (
                <option key={wd} value={wd}>
                  {DAY_NAMES[wd]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Repeat
            <select
              value={draft.repeat}
              onChange={(e) => patch({ repeat: e.target.value as PlannerEvent["repeat"] })}
              className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-white px-2 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
            >
              <option value="none">Does not repeat</option>
              <option value="weekly">Every week</option>
              <option value="weekdays">Every weekday (Mon–Fri)</option>
            </select>
          </label>
        </div>

        <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(e) => patch({ allDay: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--primary)]"
          />
          All day
        </label>

        {!draft.allDay && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Starts
              <input
                type="time"
                value={minutesToInput(draft.start)}
                onChange={(e) => {
                  const start = parseTimeToMinutes(e.target.value);
                  patch({ start, end: Math.max(start + 15, draft.end) });
                }}
                className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-white px-2 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ends
              <input
                type="time"
                value={minutesToInput(draft.end)}
                onChange={(e) => patch({ end: parseTimeToMinutes(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-white px-2 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        )}

        {!draft.allDay && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            {formatMinutes(draft.start, fmt)} – {formatMinutes(Math.max(draft.start + 15, draft.end), fmt)}
          </p>
        )}

        <textarea
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Description / notes"
          rows={3}
          className="mb-3 w-full resize-y rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />

        <div className="mb-4">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Colour</div>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => patch({ color: c.id })}
                title={c.label}
                aria-label={c.label}
                className={`h-7 w-7 rounded-full ring-offset-2 transition-transform hover:scale-110 ${
                  draft.color === c.id ? "ring-2 ring-primary" : ""
                }`}
                style={{ background: c.css }}
              />
            ))}
          </div>
        </div>

        <label className="mb-4 flex items-center gap-2 text-xs font-semibold text-foreground">
          <input
            type="checkbox"
            checked={draft.done}
            onChange={(e) => patch({ done: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--primary)]"
          />
          Mark as done
        </label>

        <div className="flex items-center justify-between gap-2">
          {!isNew ? (
            <button
              onClick={onDelete}
              className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
