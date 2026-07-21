import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import stickerStudy from "@/assets/sticker-study.png";
import stickerHutao from "@/assets/sticker-hutao.png";
import stickerKlee from "@/assets/sticker-klee.png";
import stickerCat from "@/assets/sticker-cat.png";
import stickerPaimon from "@/assets/sticker-paimon.png";

export const Route = createFileRoute("/")({
  component: Index,
});

type Status = "todo" | "progress" | "done";

type Column = {
  id: string;
  label: string;
  emoji: string;
};

type Row = {
  id: string;
  values: Record<string, string>;
  status: Status;
};

const DEFAULT_COLUMNS: Column[] = [
  { id: "subject", label: "Subject", emoji: "📚" },
  { id: "lesson", label: "Lesson", emoji: "✏️" },
  { id: "description", label: "Description", emoji: "🌸" },
];

const STATUS_META: Record<Status, { label: string; className: string; emoji: string }> = {
  todo: { label: "Not started", emoji: "🌱", className: "bg-[oklch(0.94_0.05_55)] text-[oklch(0.4_0.1_55)] border-[oklch(0.85_0.09_55)]" },
  progress: { label: "In progress", emoji: "✨", className: "bg-[oklch(0.92_0.06_230)] text-[oklch(0.35_0.12_240)] border-[oklch(0.82_0.09_230)]" },
  done: { label: "Completed", emoji: "💖", className: "bg-[oklch(0.92_0.07_355)] text-[oklch(0.4_0.14_355)] border-[oklch(0.82_0.11_355)]" },
};

const STICKERS = [
  { src: stickerStudy, top: "6%", left: "3%", size: 110, r: "-8deg", delay: "0s" },
  { src: stickerHutao, top: "18%", left: "88%", size: 100, r: "12deg", delay: "0.6s" },
  { src: stickerKlee, top: "62%", left: "2%", size: 105, r: "6deg", delay: "1.1s" },
  { src: stickerCat, top: "78%", left: "90%", size: 95, r: "-10deg", delay: "0.3s" },
  { src: stickerPaimon, top: "40%", left: "93%", size: 90, r: "8deg", delay: "1.5s" },
];

const STORAGE_KEY = "sakura-study-tracker-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadState(): { columns: Column[]; rows: Row[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Index() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [rows, setRows] = useState<Row[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.columns?.length) {
      setColumns(saved.columns);
      setRows(saved.rows ?? []);
    } else {
      setRows([
        { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution 💫" }, status: "progress" },
        { id: uid(), values: { subject: "Japanese", lesson: "N5 Kanji", description: "Review chapter 3" }, status: "todo" },
        { id: uid(), values: { subject: "History", lesson: "Edo Period", description: "Notes + timeline" }, status: "done" },
      ]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, rows }));
  }, [columns, rows, hydrated]);

  const visibleRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  const counts = useMemo(() => ({
    all: rows.length,
    todo: rows.filter((r) => r.status === "todo").length,
    progress: rows.filter((r) => r.status === "progress").length,
    done: rows.filter((r) => r.status === "done").length,
  }), [rows]);

  function addRow() {
    const values: Record<string, string> = {};
    columns.forEach((c) => (values[c.id] = ""));
    setRows((r) => [...r, { id: uid(), values, status: "todo" }]);
  }

  function updateCell(rowId: string, colId: string, v: string) {
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [colId]: v } } : row)));
  }

  function cycleStatus(rowId: string) {
    const order: Status[] = ["todo", "progress", "done"];
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, status: order[(order.indexOf(row.status) + 1) % order.length] } : row)));
  }

  function deleteRow(rowId: string) {
    setRows((r) => r.filter((row) => row.id !== rowId));
  }

  function addColumn() {
    const label = window.prompt("New column name?");
    if (!label) return;
    const emoji = window.prompt("An emoji for this column? (optional)", "🌟") || "🌟";
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + uid().slice(0, 4);
    setColumns((c) => [...c, { id, label, emoji }]);
    setRows((rs) => rs.map((r) => ({ ...r, values: { ...r.values, [id]: "" } })));
  }

  function renameColumn(colId: string) {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    const label = window.prompt("Rename column", col.label);
    if (!label) return;
    setColumns((c) => c.map((x) => (x.id === colId ? { ...x, label } : x)));
  }

  function deleteColumn(colId: string) {
    if (columns.length <= 1) return;
    if (!window.confirm("Delete this column?")) return;
    setColumns((c) => c.filter((x) => x.id !== colId));
    setRows((rs) => rs.map((r) => {
      const { [colId]: _, ...rest } = r.values;
      return { ...r, values: rest };
    }));
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10 md:py-14">
      {/* Floating stickers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        {STICKERS.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt=""
            className="absolute animate-float drop-shadow-[0_10px_20px_oklch(0.75_0.15_355/0.25)]"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              transform: `rotate(${s.r})`,
              // @ts-expect-error css var
              "--r": s.r,
              animationDelay: s.delay,
            }}
            loading="lazy"
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/70 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <span>🌸</span> sakura.study
          </div>
          <h1 className="text-4xl font-bold text-foreground md:text-6xl">
            Study Tracker <span className="inline-block animate-wiggle">💗</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            Track your lessons with the cutest little planner ~ powered by anime energy and a pinch of Mondstadt magic.
          </p>
        </header>

        {/* Mobile sticker row */}
        <div className="mb-6 flex justify-center gap-3 md:hidden">
          {[stickerStudy, stickerHutao, stickerKlee, stickerPaimon].map((s, i) => (
            <img key={i} src={s} alt="" className="h-16 w-16 animate-float" style={{ animationDelay: `${i * 0.3}s` }} loading="lazy" />
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {(["all", "todo", "progress", "done"] as const).map((k) => {
            const active = filter === k;
            const label = k === "all" ? "All" : STATUS_META[k].label;
            const emoji = k === "all" ? "🎀" : STATUS_META[k].emoji;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-cute)]"
                    : "border-[color:var(--border)] bg-white/70 text-foreground hover:bg-white"
                }`}
              >
                {emoji} {label} · {counts[k]}
              </button>
            );
          })}
        </div>

        {/* Card / table */}
        <section className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-4 shadow-[var(--shadow-cute)] backdrop-blur md:p-6">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">
              {counts.done}/{counts.all} lessons conquered ✨
            </div>
            <div className="flex gap-2">
              <button
                onClick={addColumn}
                className="rounded-full border border-dashed border-primary/50 bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
              >
                + Column
              </button>
              <button
                onClick={addRow}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-cute)] hover:opacity-90"
              >
                + New lesson
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-[color:var(--border)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[color:var(--muted)] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th key={c.id} className="group px-4 py-3 font-semibold">
                      <span className="mr-1">{c.emoji}</span>
                      <button className="hover:text-primary" onClick={() => renameColumn(c.id)}>{c.label}</button>
                      {columns.length > 1 && (
                        <button
                          onClick={() => deleteColumn(c.id)}
                          className="ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                          title="Delete column"
                        >
                          ×
                        </button>
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-t border-[color:var(--border)] transition-colors hover:bg-[color:var(--muted)]/50">
                    {columns.map((c) => (
                      <td key={c.id} className="px-2 py-1.5 align-top">
                        <input
                          value={row.values[c.id] ?? ""}
                          onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                          placeholder={`Add ${c.label.toLowerCase()}…`}
                          className="w-full rounded-lg bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:bg-white focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 align-top">
                      <button
                        onClick={() => cycleStatus(row.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${STATUS_META[row.status].className}`}
                      >
                        <span>{STATUS_META[row.status].emoji}</span>
                        {STATUS_META[row.status].label}
                      </button>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No lessons here yet — add one and start your quest! 🗡️
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {visibleRows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => cycleStatus(row.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_META[row.status].className}`}
                  >
                    <span>{STATUS_META[row.status].emoji}</span>
                    {STATUS_META[row.status].label}
                  </button>
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  {columns.map((c) => (
                    <label key={c.id} className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {c.emoji} {c.label}
                      </span>
                      <input
                        value={row.values[c.id] ?? ""}
                        onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                        placeholder={`Add ${c.label.toLowerCase()}…`}
                        className="mt-0.5 w-full rounded-lg border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
            {visibleRows.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-muted-foreground">
                No lessons here yet — add one and start your quest! 🗡️
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Made with 🌸 for study besties · Tap the status pill to cycle → not started · in progress · done
        </footer>
      </div>
    </main>
  );
}
