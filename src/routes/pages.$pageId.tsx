import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { BlockList } from "@/components/PageBlocks";
import { countWords, usePageHistory, type PageSnapshot } from "@/hooks/usePageHistory";
import { PAGE_COVERS, pageCoverCss, uid, useStudyStore, type Block } from "@/lib/study-store";

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

  const snapshot: PageSnapshot | null = page
    ? { title: page.title, icon: page.icon, blocks: page.blocks }
    : null;

  function write(patch: Partial<{ title: string; icon: string; blocks: Block[]; cover: string | null; favorite: boolean; fullWidth: boolean }>) {
    setPages((list) =>
      list.map((p) => (p.id === pageId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    );
  }

  const history = usePageHistory(snapshot, (snap) => write(snap));

  /** Every edit records the pre-edit snapshot first. `coalesce` for typing. */
  function update(
    patch: Partial<{ title: string; icon: string; blocks: Block[] }>,
    coalesce = false,
  ) {
    if (snapshot) history.record(snapshot, coalesce);
    write(patch);
  }

  if (!hydrated) {
    return <main className="paper-canvas min-h-screen px-4 py-10" aria-busy="true" />;
  }

  if (!page) {
    return (
      <main className="paper-canvas flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">That page doesn't exist any more.</p>
          <Link to="/pages" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            ← Back to pages
          </Link>
        </div>
      </main>
    );
  }

  const words = countWords(page.blocks);
  const coverCss = pageCoverCss(page.cover);

  return (
    <main className="paper-canvas min-h-screen px-3 py-6 md:px-8 md:py-10">
      <div className={`mx-auto ${page.fullWidth ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Link to="/pages" className="text-xs font-semibold text-muted-foreground hover:text-primary">
            ← All pages
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                if (history.undo()) toast("Undone", { description: "Ctrl+Shift+Z to redo" });
              }}
              disabled={!history.canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold text-muted-foreground disabled:opacity-40 hover:enabled:border-primary hover:enabled:text-primary"
            >
              ↺ Undo
            </button>
            <button
              onClick={() => history.redo()}
              disabled={!history.canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold text-muted-foreground disabled:opacity-40 hover:enabled:border-primary hover:enabled:text-primary"
            >
              ↻ Redo
            </button>
            <button
              onClick={() => write({ favorite: !page.favorite })}
              title="Pin to sidebar"
              className={`rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold ${
                page.favorite ? "border-primary text-primary" : "text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {page.favorite ? "★ Pinned" : "☆ Pin"}
            </button>
            <button
              onClick={() => write({ fullWidth: !page.fullWidth })}
              title="Toggle full width"
              className="rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            >
              {page.fullWidth ? "↔ Full" : "↔ Narrow"}
            </button>
            <button
              onClick={() => {
                const copy = {
                  ...page,
                  id: uid(),
                  title: `${page.title} (copy)`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setPages((list) => [copy, ...list]);
                navigate({ to: "/pages/$pageId", params: { pageId: copy.id } });
                toast.success("Page duplicated");
              }}
              className="rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            >
              ⧉ Duplicate
            </button>
            <button
              onClick={() => {
                setPages((list) => list.filter((p) => p.id !== pageId));
                navigate({ to: "/pages" });
              }}
              className="rounded-md border border-[color:var(--paper-border)] px-2 py-1 font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              Delete
            </button>
          </div>
        </div>

        {coverCss && <div className="mb-3 h-28 w-full rounded-2xl md:h-36" style={{ background: coverCss }} />}

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
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
          <span className="mx-1 h-4 w-px bg-[color:var(--paper-border)]" />
          {PAGE_COVERS.map((c) => (
            <button
              key={c.id}
              onClick={() => write({ cover: c.id === "none" ? null : c.id })}
              title={`Cover: ${c.label}`}
              aria-label={`Cover ${c.label}`}
              className={`h-5 w-8 rounded-md border ${
                (page.cover ?? "none") === c.id ? "border-primary" : "border-[color:var(--paper-border)]"
              }`}
              style={{ background: c.css || "transparent" }}
            />
          ))}
        </div>

        <input
          value={page.title}
          onChange={(e) => update({ title: e.target.value }, true)}
          placeholder="Untitled page"
          className="mb-1 w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/40"
          style={{ color: "var(--paper-fg)" }}
        />
        <p className="mb-4 text-[11px] text-muted-foreground">
          {page.blocks.length} block{page.blocks.length === 1 ? "" : "s"} · {words} word{words === 1 ? "" : "s"} · edited{" "}
          {new Date(page.updatedAt).toLocaleString()}
        </p>

        <div className="paper-sheet rounded-2xl p-3 shadow-sm md:p-6">
          <BlockList blocks={page.blocks} onChange={(blocks) => update({ blocks }, true)} />
        </div>
      </div>
    </main>
  );
}
