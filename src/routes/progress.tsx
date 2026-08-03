import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Donut } from "@/components/Donut";
import { DEFAULT_TIME_RANGES, useStudyStore, type WeekStart } from "@/lib/study-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Planner Progress — Seijaku Study" },
      { name: "description", content: "See how consistent your self-study week was: habit ticks, streaks, and how much of your planner you filled in." },
      { property: "og:title", content: "Planner Progress — Seijaku Study" },
      { property: "og:description", content: "See how consistent your self-study week was: habit ticks, streaks, and how much of your planner you filled in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(weekStart: WeekStart, ref: Date): Date[] {
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

/** Longest run of consecutive ticked days, counting backwards from today. */
function currentStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (set.has(toISO(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function ProgressPage() {
  const { habits, plannerSlots, settings, hydrated } = useStudyStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(settings.weekStart, base);
  }, [settings.weekStart, weekOffset]);

  const weekKey = toISO(weekDates[0]);
  const isCurrentWeek = weekOffset === 0;
  const weekISOs = useMemo(() => weekDates.map(toISO), [weekDates]);

  const habitStats = useMemo(
    () =>
      habits.map((h) => {
        const checks = weekISOs.filter((iso) => h.dates.includes(iso)).length;
        return {
          id: h.id,
          label: h.label,
          checks,
          pct: Math.round((checks / 7) * 100),
          streak: hydrated ? currentStreak(h.dates) : 0,
        };
      }),
    [habits, weekISOs, hydrated],
  );

  const overall = useMemo(() => {
    const total = habits.length * 7;
    const done = habitStats.reduce((a, s) => a + s.checks, 0);
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [habits.length, habitStats]);

  const weekEvents = useMemo(
    () =>
      plannerEvents.filter((e) => {
        if (e.repeat !== "none") return (e.week || weekKey) <= weekKey;
        return e.week ? e.week === weekKey : isCurrentWeek;
      }),
    [plannerEvents, weekKey, isCurrentWeek],
  );

  const coverage = useMemo(() => {
    const totalCells = weekEvents.length;
    const filled = weekEvents.filter((e) => e.done).length;
    return { filled, totalCells, pct: totalCells ? Math.round((filled / totalCells) * 100) : 0 };
  }, [weekEvents]);

  const plannedSubjects = useMemo(() => {
    const map = new Map<string, number>();
    weekEvents.forEach((e) => {
      const name = (e.title || "Untitled").trim();
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map, ([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count);
  }, [weekEvents]);

  const maxCount = plannedSubjects[0]?.count ?? 1;

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Planner progress
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">How your week went 📊</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consistency ticks and planner coverage from your self-study planner.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex gap-1">
              <button onClick={() => setWeekOffset((v) => v - 1)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">← Prev</button>
              <button onClick={() => setWeekOffset(0)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">This week</button>
              <button onClick={() => setWeekOffset((v) => v + 1)} className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs hover:border-primary">Next →</button>
            </div>
            <Link to="/planner" className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary">
              🗓️ Planner
            </Link>
            <Link to="/" className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary">
              ← Tracker
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-[color:var(--border)] bg-white/90 p-5 shadow-[var(--shadow-cute)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Week of {weekDates[0].toLocaleDateString([], { month: "short", day: "numeric" })}
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {overall.done}/{overall.total} ticks
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Donut pct={overall.pct} size={132} stroke={12} label="Consistency" sublabel={`${overall.done}/${overall.total} ticks`} />
            <Donut pct={coverage.pct} size={132} stroke={12} label="Planner filled" sublabel={`${coverage.filled}/${coverage.totalCells} slots`} />
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[color:var(--border)] bg-white/90 p-5 shadow-[var(--shadow-cute)] backdrop-blur">
          <h2 className="mb-4 text-sm font-bold text-foreground">Habits this week</h2>
          {habitStats.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-xs text-muted-foreground">
              No habits yet — add some in the{" "}
              <Link to="/planner" className="text-primary underline">self-study planner</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {habitStats.map((h) => (
                <div key={h.id} className="flex flex-col items-center gap-1">
                  <Donut pct={h.pct} size={84} stroke={8} label={h.label} sublabel={`${h.checks}/7`} />
                  <span className="text-[10px] font-semibold text-muted-foreground">🔥 {h.streak} day streak</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-5 shadow-[var(--shadow-cute)] backdrop-blur">
          <h2 className="mb-4 text-sm font-bold text-foreground">Planned subjects this week</h2>
          {plannedSubjects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-xs text-muted-foreground">
              Nothing planned for this week yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {plannedSubjects.map((s) => (
                <li key={s.subject} className="flex items-center gap-3">
                  <span className="w-28 flex-shrink-0 truncate text-xs font-semibold text-foreground">{s.subject}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="w-14 flex-shrink-0 text-right text-[11px] font-semibold text-muted-foreground">
                    {s.count} slot{s.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
