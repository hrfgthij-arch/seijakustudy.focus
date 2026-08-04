import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { newPage, useStudyStore, type Page } from "@/lib/study-store";
import { PageBlockEditor } from "@/components/PageBlockEditor";

export const Route = createFileRoute("/pages")({
  head: () => ({
    meta: [
      { title: "Spaces — Seijaku Study" },
      {
        name: "description",
        content:
          "Build your own study spaces: notes, checklists, callouts and embedded Seijaku widgets on custom pages that sync across devices.",
      },
      { property: "og:title", content: "Spaces — Seijaku Study" },
      {
        property: "og:description",
        content: "Design your own study pages with text, checklists, callouts and embedded widgets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PagesRoute,
});

const TEMPLATES: { id: string; label: string; emoji: string; build: () => Page }[] = [
  {
    id: "blank",
    label: "Blank page",
    emoji: "📄",
    build: () => newPage("Untitled"),
  },
  {
    id: "revision",
    label: "Revision plan",
    emoji: "📚",
    build: () => {
      const p = newPage("Revision plan");
      p.icon = "📚";
      p.blocks = [
        { id: Math.random().toString(36).slice(2, 10), type: "h2", text: "Goals for this week" },
        { id: Math.random().toString(36).slice(2, 10), type: "todo", text: "Finish chapter summaries", checked: false },
        { id: Math.random().toString(36).slice(2, 10), type: "todo", text: "2 past papers", checked: false },
        { id: Math.random().toString(36).slice(2, 10), type: "h2", text: "Today's plan" },
        { id: Math.random().toString(36).slice(2, 10), type: "widget", text: "", src: "today" },
        { id: Math.random().toString(36).slice(2, 10), type: "widget", text: "", src: "timer" },
      ];
      return p;
    },
  },
  {
    id: "notes",
    label: "Lecture notes",
    emoji: "🖊️",
    build: () => {
      const p = newPage("Lecture notes");
      p.icon = "🖊️";
      p.blocks = [
        { id: Math.random().toString(36).slice(2, 10), type: "h1", text: "Topic" },
        { id: Math.random().toString(36).slice(2, 10), type: "callout", text: "Key idea to remember" },
        { id: Math.random().toString(36).slice(2, 10), type: "bullet", text: "" },
      ];
      return p;
    },
  },
  {
    id: "dashboard",
    label: "My dashboard",
    emoji: "🌸",
    build: () => {
      const p = newPage("My dashboard");
      p.icon = "🌸";
      p.blocks = [
        { id: Math.random().toString(36).slice(2, 10), type: "h2", text: "Focus" },
        { id: Math.random().toString(36).slice(2, 10), type: "widget", text: "", src: "timer" },
        { id: Math.random().toString(36).slice(2, 10), type: "widget", text: "", src: "progress" },
        { id: Math.random().toString(36).slice(2, 10), type: "widget", text: "", src: "todos" },
      ];
      return p;
    },
  },
];

function PagesRoute() {
  const { pages, setPages, hydrated } = useStudyStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!activeId && pages.length) setActiveId(pages[0].id);
  }, [hydrated, pages, activeId]);

  const active = useMemo(() => pages.find((p) => p.id === activeId) ?? null, [pages, activeId]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...pages].sort(
      (a, b) => Number(b.favourite) - Number(a.favourite) || b.updatedAt.localeCompare(a.updatedAt),
    );
    return q ? sorted.filter((p) => p.title.toLowerCase().includes(q)) : sorted;
  }, [pages, query]);

  function create(template: (typeof TEMPLATES)[number]) {
    const page = template.build();
    setPages((list) => [page, ...list]);
    setActiveId(page.id);
    setListOpen(false);
  }
  function update(page: Page) {
    setPages((list) => list.map((p) => (p.id === page.id ? page : p)));
  }
  function remove(id: string) {
    if (!window.confirm("Delete this page?")) return;
    setPages((list) => list.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }
  function toggleFav(id: string) {
    setPages((list) => list.map((p) => (p.id === id ? { ...p, favourite: !p.favourite } : p)));
  }

  return (
    <main className="min-h-screen px-3 py-6 sm:px-4 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Spaces
            </div>
            <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Make it yours ✨</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Custom pages with notes, checklists, callouts and live Seijaku widgets.
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
          >
            ← Tracker
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-16 lg:self-start">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-3 shadow-[var(--shadow-cute)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground">Your pages</h2>
                <button
                  onClick={() => setListOpen((v) => !v)}
                  className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  + New
                </button>
              </div>

              {listOpen && (
                <div className="mb-2 animate-[popIn_.16s_ease-out] space-y-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]/40 p-1.5">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => create(t)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-foreground hover:bg-white"
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              )}

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages…"
                className="mb-2 w-full rounded-lg border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary"
              />

              {filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[color:var(--border)] px-2 py-4 text-center text-[11px] text-muted-foreground">
                  No pages yet — start with a template.
                </p>
              ) : (
                <ul className="max-h-[46vh] space-y-0.5 overflow-y-auto pr-0.5">
                  {filtered.map((p) => (
                    <li key={p.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => setActiveId(p.id)}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                          p.id === activeId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-[color:var(--muted)]"
                        }`}
                      >
                        <span className="shrink-0">{p.icon}</span>
                        <span className="truncate">{p.title || "Untitled"}</span>
                      </button>
                      <button
                        onClick={() => toggleFav(p.id)}
                        className="shrink-0 px-1 text-[11px] text-muted-foreground hover:text-primary"
                        title="Favourite"
                      >
                        {p.favourite ? "★" : "☆"}
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="shrink-0 px-1 text-[11px] text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 shadow-[var(--shadow-cute)] sm:p-6">
            {active ? (
              <PageBlockEditor page={active} onChange={update} />
            ) : (
              <div className="py-16 text-center">
                <p className="text-4xl">🪄</p>
                <h2 className="mt-3 text-lg font-bold text-foreground">Create your first space</h2>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                  Pick a template on the left — a revision plan, lecture notes, or your own dashboard with widgets.
                </p>
                <button
                  onClick={() => create(TEMPLATES[1])}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Start with a revision plan
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
