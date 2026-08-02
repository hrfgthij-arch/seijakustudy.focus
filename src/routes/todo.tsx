import { createFileRoute, Link } from "@tanstack/react-router";
import { TodoList } from "@/components/TodoList";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "To-do — Seijaku Study" },
      { name: "description", content: "A quick, cozy to-do list synced to your Seijaku Study study tracker." },
      { property: "og:title", content: "To-do — Seijaku Study" },
      { property: "og:description", content: "A quick, cozy to-do list synced to your Seijaku Study study tracker." },
    ],
  }),
  component: TodoPage,
});

function TodoPage() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-14">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              To-do
            </div>
            <h1 className="text-3xl font-bold text-foreground">Today's list ✨</h1>
          </div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">
            ← Tracker
          </Link>
        </header>
        <TodoList />
      </div>
    </main>
  );
}
