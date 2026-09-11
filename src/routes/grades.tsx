import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { uid, useStudyStore, type Grade } from "@/lib/study-store";

export const Route = createFileRoute("/grades")({
  head: () => ({ meta: [
    { title: "Grades — Seijaku Study" },
    { name: "description", content: "Keep a clear, calm view of scores, weights, and your current study average." },
    { property: "og:title", content: "Grades — Seijaku Study" },
    { property: "og:description", content: "Keep a clear, calm view of scores, weights, and your current study average." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GradesPage,
});

function GradesPage() {
  const { grades, setGrades } = useStudyStore();
  const [draft, setDraft] = useState({ subject: "", title: "", score: "", max: "100", weight: "1" });
  const summary = useMemo(() => {
    const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);
    const average = totalWeight ? grades.reduce((sum, grade) => sum + (grade.score / grade.max) * 100 * grade.weight, 0) / totalWeight : 0;
    return { average: Math.round(average), totalWeight };
  }, [grades]);

  function addGrade() {
    if (!draft.subject.trim() || !draft.title.trim()) return;
    const grade: Grade = { id: uid(), subject: draft.subject.trim(), title: draft.title.trim(), score: Number(draft.score) || 0, max: Number(draft.max) || 100, weight: Number(draft.weight) || 1, date: new Date().toISOString().slice(0, 10) };
    setGrades((current) => [grade, ...current]);
    setDraft({ subject: "", title: "", score: "", max: "100", weight: "1" });
  }

  return <main className="study-page px-4 py-8 md:px-10 md:py-12"><div className="mx-auto max-w-4xl"><header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Progress ledger</p><h1 className="text-3xl font-bold text-foreground md:text-4xl">Grades 🎯</h1><p className="mt-1 text-sm text-muted-foreground">A gentle place to see the work behind your progress.</p></div><Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">← Tracker</Link></header>
    <section className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Current average" value={`${summary.average}%`} /><Stat label="Assessments" value={grades.length} /><Stat label="Total weight" value={summary.totalWeight.toFixed(1)} /></section>
    <section className="study-panel mb-5 rounded-2xl p-5"><h2 className="mb-3 text-sm font-bold text-foreground">Add an assessment</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Input value={draft.subject} onChange={(value) => setDraft({ ...draft, subject: value })} placeholder="Subject" /><Input value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} placeholder="Assessment" /><Input value={draft.score} onChange={(value) => setDraft({ ...draft, score: value })} placeholder="Score" type="number" /><Input value={draft.max} onChange={(value) => setDraft({ ...draft, max: value })} placeholder="Out of" type="number" /><Input value={draft.weight} onChange={(value) => setDraft({ ...draft, weight: value })} placeholder="Weight" type="number" /></div><button onClick={addGrade} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Add grade</button></section>
    <section className="study-panel overflow-hidden rounded-2xl"><div className="border-b border-[color:var(--border)] px-5 py-4"><h2 className="text-sm font-bold text-foreground">Assessment history</h2></div>{grades.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">No grades yet. Add your first result above.</p> : <div className="divide-y divide-[color:var(--border)]">{grades.map((grade) => <div key={grade.id} className="flex flex-wrap items-center gap-3 px-5 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{grade.title}</p><p className="text-xs text-muted-foreground">{grade.subject} · {grade.date}</p></div><span className="text-sm font-bold text-primary">{grade.score}/{grade.max}</span><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{Math.round((grade.score / grade.max) * 100)}%</span><button onClick={() => setGrades((current) => current.filter((item) => item.id !== grade.id))} className="text-xs text-muted-foreground hover:text-destructive" aria-label={`Delete ${grade.title}`}>×</button></div>)}</div>}</section>
  </div></main>;
}
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="study-panel rounded-2xl p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-foreground">{value}</p></div>; }
function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} min={type === "number" ? 0 : undefined} className="min-w-0 rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-primary" />; }