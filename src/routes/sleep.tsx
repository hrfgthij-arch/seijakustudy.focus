import { createFileRoute, Link } from "@tanstack/react-router";
import { SleepTracker } from "@/components/SleepTracker";
import { useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep tracker — Sakura Bloom" },
      { name: "description", content: "Log your sleep and wake times each night and watch weekly averages." },
      { property: "og:title", content: "Sleep tracker — Sakura Bloom" },
      { property: "og:description", content: "Log your sleep and wake times each night and watch weekly averages." },
    ],
  }),
  component: SleepPage,
});

function SleepPage() {
  const { sleep, setSleep, settings, setSettings } = useStudyStore();
  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Sleep
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Weekly rest 🌙</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log tonight and see how you're trending.</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
          >
            ← Tracker
          </Link>
        </header>
        <SleepTracker
          entries={sleep}
          onChange={setSleep}
          onHide={() => setSettings({ ...settings, showSleep: false })}
          weekStart={settings.weekStart}
        />
      </div>
    </main>
  );
}
