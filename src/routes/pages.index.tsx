import { createFileRoute, Link } from "@tanstack/react-router";
import { emptyPage, useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/pages/")({
  head: () => ({
    meta: [
      { title: "My Pages — Seijaku Study" },
      { name: "description", content: "Build your own study pages with blocks, checklists, tables and embeds inside Seijaku Study." },
      { property: "og:title", content: "My Pages — Seijaku Study" },
      { property: "og:description", content: "Build your own study pages with blocks, checklists, tables and embeds inside Seijaku Study." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PagesIndex,
});

const TEMPLATES: { name: string; icon: string; emoji: string; make: () => ReturnType<typeof emptyPage> }[] = [
  {
    name: "Blank page",
    icon: "📄",
    emoji: "📄",
    make: () => emptyPage(),
  },
  {
    name: "Revision notes",
    icon: "📚",
    emoji: "📚",
    make: () => {
      const p = emptyPage();
      p.title = "Revision notes";
      p.icon = "📚";
      p.blocks = [
        { id: rid(), type: "h1", text: "Revision notes" },
        { id: rid(), type: "callout", text: "Topic, date, and what still feels shaky.", emoji: "💡", color: "blue" },
        { id: rid(), type: "h2", text: "Key ideas" },
        { id: rid(), type: "bullet", text: "" },
        { id: rid(), type: "h2", text: "Practice" },
        { id: rid(), type: "todo", text: "Past paper questions", checked: false },
      ];
      return p;
    },
  },
  {
    name: "Exam plan",
    icon: "🗓",
    emoji: "🗓",
    make: () => {
      const p = emptyPage();
      p.title = "Exam plan";
      p.icon = "🗓";
      p.blocks = [
        { id: rid(), type: "h1", text: "Exam plan" },
        { id: rid(), type: "table", text: "", cells: [["Subject", "Date", "Status"], ["", "", ""], ["", "", ""]] },
        { id: rid(), type: "quote", text: "Slow is smooth, smooth is fast." },
      ];
      return p;
    },
  },
  {
    name: "Reading list",
    icon: "🔖",
    emoji: "🔖",
    make: () => {
      const p = emptyPage();
      p.title = "Reading list";
      p.icon = "🔖";
      p.blocks = [
        { id: rid(), type: "h1", text: "Reading list" },
        { id: rid(), type: "link", text: "", url: "" },
        { id: rid(), type: "todo", text: "", checked: false },
      ];
      return p;
    },
  },
];

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

function PagesIndex() {
  const { pages, setPages, hydrated } = useStudyStore();

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Your space
          </div>
          <h1 className="text-3xl font-bold text-foreground">My pages ✨</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free-form pages for notes, plans and anything else — built from blocks you can drag around.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Start from</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => setPages((list) => [t.make(), ...list])}
                className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary"
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="mt-1 block text-xs font-bold text-foreground">{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        {!hydrated ? null : pages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-10 text-center text-sm text-muted-foreground">
            No pages yet — pick a template above to make your first one 🌱
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {pages.map((p) => (
              <li key={p.id} className="group relative">
                <Link
                  to="/pages/$pageId"
                  params={{ pageId: p.id }}
                  className="block rounded-2xl border border-[color:var(--border)] bg-white/85 p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="mt-1 block truncate text-sm font-bold text-foreground">{p.title || "Untitled page"}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {p.blocks.length} block{p.blocks.length === 1 ? "" : "s"} · edited{" "}
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  onClick={() => setPages((list) => list.filter((x) => x.id !== p.id))}
                  aria-label={`Delete ${p.title}`}
                  className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
