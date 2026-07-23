import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Donut } from "@/components/Donut";
import { STATUS_META, subjectStats, useStudyStore, type Row, type Priority } from "@/lib/study-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Sakura Bloom" },
      { name: "description", content: "See how each subject is blooming with cute circular progress charts and your planned days." },
      { property: "og:title", content: "Progress — Sakura Bloom" },
      { property: "og:description", content: "See how each subject is blooming with cute circular progress charts and your planned days." },
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

function ProgressPage() {
  const { rows, columns, priorities } = useStudyStore();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const stats = useMemo(() => subjectStats(rows), [rows]);
  const total = rows.length;
  const done = rows.filter((r) => r.status === "done").length;
  const overallPct = total ? Math.round((done / total) * 100) : 0;

  const priorityMap = useMemo(() => {
    const m = new Map<string, Priority>();
    priorities.forEach((p) => m.set(p.id, p));
    return m;
  }, [priorities]);

  const plannedDays = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.date && set.add(r.date));
    return Array.from(set).map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
  }, [rows]);

  const dayRows = useMemo(() => {
    if (!selectedDay) return [];
    const iso = toISO(selectedDay);
    return rows
      .filter((r) => r.date === iso)
      .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  }, [rows, selectedDay]);

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Your Progress
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">Blooming subjects 🌸</h1>
            <p className="mt-1 text-sm text-muted-foreground">A quick look at how each subject is coming along and what's planned.</p>
          </div>
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
          >
            ← Back to tracker
          </Link>
        </header>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-5 shadow-[var(--shadow-cute)]">
          <div className="mb-5 flex items-center justify-center border-b border-[color:var(--border)] pb-5">
            <Donut pct={overallPct} size={128} stroke={12} label="Overall" sublabel={`${done}/${total} lessons`} />
          </div>
          {stats.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Add lessons on the tracker page to see your subjects here.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.subject} className="flex flex-col items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white p-3">
                  <Donut pct={s.pct} size={88} stroke={9} />
                  <div className="text-center">
                    <div className="max-w-[130px] truncate text-sm font-semibold text-foreground">{s.subject}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.done}/{s.total} done · {s.progress} in progress
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)]">
          <div className="border-b border-[color:var(--border)] px-4 py-3 md:px-5">
            <h2 className="text-sm font-bold text-foreground">📅 Planned days</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Days with lessons are dotted. Tap one to see what's on the schedule.</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr] md:p-5">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              modifiers={{ planned: plannedDays }}
              modifiersClassNames={{
                planned:
                  "relative font-semibold text-primary after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
              className="pointer-events-auto rounded-xl border border-[color:var(--border)] bg-white p-2"
            />
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedDay ? selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "Pick a day"}
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground">{dayRows.length} lesson{dayRows.length === 1 ? "" : "s"}</span>
              </div>
              {dayRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-xs text-muted-foreground">
                  Nothing planned for this day yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayRows.map((r: Row) => {
                    const s = STATUS_META[r.status];
                    const subject = r.values[columns[0]?.id] || "Untitled";
                    const lesson = r.values[columns[1]?.id] || "";
                    const p = r.priorityId ? priorityMap.get(r.priorityId) : null;
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {r.time && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-primary">
                              {r.time}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{subject}</div>
                            {lesson && <div className="truncate text-xs text-muted-foreground">{lesson}</div>}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          {p && (
                            <span
                              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                              style={{ borderColor: p.color, color: p.color, backgroundColor: `color-mix(in oklch, ${p.color} 12%, white)` }}
                            >
                              {p.label}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.className}`}>
                            <span>{s.icon}</span>
                            {s.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
