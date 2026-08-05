import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BlockList } from "@/components/PageBlocks";
import { useStudyStore, type Block } from "@/lib/study-store";

export const Route = createFileRoute("/pages/$pageId")({
  head: () => ({
    meta: [
      { title: "Page editor — Seijaku Study" },
      { name: "description", content: "Edit a custom Seijaku Study page: headings, checklists, tables, callouts and embeds." },
      { property: "og:title", content: "Page editor — Seijaku Study" },
      { property: "og:description", content: "Edit a custom Seijaku Study page: headings, checklists, tables, callouts and embeds." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageEditor,
});

const ICONS = ["📄", "📚", "🌸", "🌿", "⭐", "🗓", "🧠", "🔖", "🎧", "☕", "🌙", "✨"];

function PageEditor() {
  const { pageId } = Route.useParams();
  const navigate = useNavigate();
  const { pages, setPages, hydrated } = useStudyStore();
  const page = pages.find((p) => p.id === pageId);

  function update(patch: Partial<{ title: string; icon: string; blocks: Block[] }>) {
    setPages((list) =>
      list.map((p) => (p.id === pageId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    );
  }

  if (!hydrated) {
    return <main className="min-h-screen px-4 py-10" aria-busy="true" />;
  }

  if (!page) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">That page doesn't exist any more.</p>
          <Link to="/pages" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to pages
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link to="/pages" className="text-xs font-semibold text-muted-foreground hover:text-primary">
            ← All pages
          </Link>
          <button
            onClick={() => {
              setPages((list) => list.filter((p) => p.id !== pageId));
              navigate({ to: "/pages" });
            }}
            className="rounded-md border border-[color:var(--border)] bg-white/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
          >
            Delete page
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {ICONS.map((i) => (
            <button
              key={i}
              onClick={() => update({ icon: i })}
              aria-label={`Use icon ${i}`}
              className={`h-7 w-7 rounded-lg text-base transition-transform hover:scale-110 ${
                page.icon === i ? "bg-primary/15 ring-1 ring-primary" : ""
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <input
          value={page.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Untitled page"
          className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
        />

        <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-3 shadow-[var(--shadow-cute)] backdrop-blur md:p-5">
          <BlockList blocks={page.blocks} onChange={(blocks) => update({ blocks })} />
        </div>
      </div>
    </main>
  );
}
