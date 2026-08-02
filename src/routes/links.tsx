import { createFileRoute, Link } from "@tanstack/react-router";
import { QuickLinksTable } from "@/components/QuickLinksTable";
import { useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Quick Links — Seijaku Study" },
      { name: "description", content: "Save and access your favorite study links in one tap." },
      { property: "og:title", content: "Quick Links — Seijaku Study" },
      { property: "og:description", content: "Save and access your favorite study links in one tap." },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  const { quickLinks, setQuickLinks } = useStudyStore();
  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Quick Links
            </div>
            <h1 className="text-3xl font-bold text-foreground">Your links 🔗</h1>
          </div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">
            ← Tracker
          </Link>
        </header>
        <QuickLinksTable links={quickLinks} onChange={setQuickLinks} />
      </div>
    </main>
  );
}
