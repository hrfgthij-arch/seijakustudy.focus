import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/deadlines")({
  head: () => ({ meta: [
    { title: "Deadlines — Seijaku Study" },
    { name: "description", content: "See upcoming lesson and planner deadlines in one calm, focused list." },
    { property: "og:title", content: "Deadlines — Seijaku Study" },
    { property: "og:description", content: "See upcoming lesson and planner deadlines in one calm, focused list." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DeadlinesPage,
});

function daysUntil(iso: string) {
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function DeadlinesPage() {
  const { rows, plannerEvents } = useStudyStore();
  const deadlines = useMemo(() => [
    ...rows.filter((row) => row.dueDate).map((row) => ({ id: `lesson-${row.id}`, title: row.values.lesson || row.values.subject || "Lesson", detail: row.values.subject || "Lesson", date: row.dueDate ?? "", done: row.status === "done", kind: "Lesson" })),
    ...plannerEvents.filter((event) => event.week && event.title).map((event) => ({ id: `event-${event.id}`, title: event.title, detail: event.description || "Planner event", date: event.week, done: event.done, kind: "Planner" })),
  ].sort((a, b) => a.date.localeCompare(b.date)), [rows, plannerEvents]);
  const open = deadlines.filter((item) => !item.done);

  return <main className="study-page px-4 py-8 md:px-10 md:py-12"><div className="mx-auto max-w-3xl"><header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Keep it in sight</p><h1 className="text-3xl font-bold text-foreground md:text-4xl">Deadlines ⏳</h1><p className="mt-1 text-sm text-muted-foreground">A single view for the things your future self will thank you for.</p></div><Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">← Tracker</Link></header>
    <div className="mb-5 flex flex-wrap gap-2"><span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{open.length} open</span><span className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-muted-foreground">{deadlines.length - open.length} completed</span></div>
    <section className="study-panel overflow-hidden rounded-2xl">{deadlines.length === 0 ? <div className="px-5 py-12 text-center"><div className="mb-3 text-4xl">🌤️</div><h2 className="text-base font-bold text-foreground">No deadlines yet</h2><p className="mt-1 text-sm text-muted-foreground">Add due dates to lessons or plan an event to see it here.</p></div> : <div className="divide-y divide-[color:var(--border)]">{deadlines.map((item) => { const days = daysUntil(item.date); return <div key={item.id} className={`flex flex-wrap items-center gap-3 px-5 py-4 ${item.done ? "opacity-55" : ""}`}><div className="flex min-w-0 flex-1 items-center gap-3"><span className="text-lg">{item.done ? "✓" : days < 0 ? "!" : "○"}</span><div className="min-w-0"><p className={`truncate text-sm font-semibold ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.kind} · {item.detail}</p></div></div><div className="text-right"><p className="text-xs font-bold text-foreground">{new Date(`${item.date}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}</p><p className={`text-[10px] font-semibold ${days < 0 && !item.done ? "text-destructive" : "text-muted-foreground"}`}>{item.done ? "Done" : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`}</p></div></div>; })}</div>}</section>
  </div></main>;
}