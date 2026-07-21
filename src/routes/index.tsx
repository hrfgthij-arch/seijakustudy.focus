import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import stickerKurisu from "@/assets/sticker-kurisu.png";
import stickerViolet from "@/assets/sticker-violet.png";
import stickerMahiru from "@/assets/sticker-mahiru.png";
import stickerKaori from "@/assets/sticker-kaori.png";
import stickerSandrone from "@/assets/sticker-sandrone.png";
import stickerSkirk from "@/assets/sticker-skirk.png";
import stickerNavia from "@/assets/sticker-navia.png";

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
  { id: "subject", label: "Subject", emoji: "📘" },
  { id: "lesson", label: "Lesson", emoji: "✏️" },
  { id: "description", label: "Description", emoji: "📝" },
];

const STATUS_META: Record<Status, { label: string; className: string; dot: string; icon: string }> = {
  todo: {
    label: "Not started",
    icon: "○",
    dot: "bg-[oklch(0.7_0.03_250)]",
    className:
      "bg-[oklch(0.95_0.02_250)] text-[oklch(0.4_0.05_250)] border-[oklch(0.86_0.03_250)]",
  },
  progress: {
    label: "In progress",
    icon: "◐",
    dot: "bg-[oklch(0.72_0.13_230)]",
    className:
      "bg-[oklch(0.94_0.05_230)] text-[oklch(0.35_0.13_240)] border-[oklch(0.82_0.09_230)]",
  },
  done: {
    label: "Completed",
    icon: "✓",
    dot: "bg-[oklch(0.55_0.16_260)]",
    className:
      "bg-[oklch(0.93_0.06_260)] text-[oklch(0.35_0.14_265)] border-[oklch(0.78_0.11_260)]",
  },
};

// Stickers pinned to page margins so they never overlap the tracker card.
const STICKERS = [
  { src: stickerKurisu, style: { top: "4%", left: "1.5%" }, size: 118, r: "-9deg", delay: "0s" },
  { src: stickerViolet, style: { top: "3%", right: "1.5%" }, size: 112, r: "8deg", delay: "0.5s" },
  { src: stickerSkirk, style: { top: "34%", left: "1%" }, size: 108, r: "5deg", delay: "1s" },
  { src: stickerNavia, style: { top: "34%", right: "1%" }, size: 110, r: "-6deg", delay: "1.4s" },
  { src: stickerMahiru, style: { bottom: "6%", left: "2%" }, size: 108, r: "-4deg", delay: "0.8s" },
  { src: stickerKaori, style: { bottom: "18%", right: "2%" }, size: 110, r: "7deg", delay: "0.2s" },
  { src: stickerSandrone, style: { bottom: "3%", right: "10%" }, size: 96, r: "-10deg", delay: "1.2s" },
];

const MOBILE_STRIP = [stickerKurisu, stickerViolet, stickerMahiru, stickerKaori, stickerSkirk, stickerNavia, stickerSandrone];

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
        { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution" }, status: "progress" },
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
    const emoji = window.prompt("An emoji for this column? (optional)", "🔹") || "🔹";
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
      const rest = { ...r.values };
      delete rest[colId];
      return { ...r, values: rest };
    }));
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10 md:py-14">
      {/* Floating stickers — desktop only, pinned to page margins */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
        {STICKERS.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt=""
            className="absolute animate-float drop-shadow-[0_12px_22px_oklch(0.55_0.16_255/0.25)]"
            style={{
              ...s.style,
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

      <div className="relative mx-auto max-w-4xl">
        {/* Header row */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Study Tracker
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Your study log
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize lessons by subject, status, and anything you want to track.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryChip label="Total" value={counts.all} tone="neutral" />
            <SummaryChip label="In progress" value={counts.progress} tone="progress" />
            <SummaryChip label="Done" value={counts.done} tone="done" />
          </div>
        </header>

        {/* Mobile / tablet sticker strip */}
        <div className="mb-6 flex justify-center gap-2 overflow-x-auto pb-1 xl:hidden">
          {MOBILE_STRIP.map((s, i) => (
            <img
              key={i}
              src={s}
              alt=""
              className="h-14 w-14 flex-shrink-0 animate-float drop-shadow-[0_6px_10px_oklch(0.55_0.16_255/0.25)]"
              style={{ animationDelay: `${i * 0.25}s` }}
              loading="lazy"
            />
          ))}
        </div>

        {/* Tracker card */}
        <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur">
          {/* Toolbar: filters + actions on one row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3 md:px-5">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "todo", "progress", "done"] as const).map((k) => {
                const active = filter === k;
                const label = k === "all" ? "All" : STATUS_META[k].label;
                return (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent bg-[color:var(--muted)] text-foreground hover:bg-[color:var(--accent)]"
                    }`}
                  >
                    {label}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-white/60 text-muted-foreground"}`}>
                      {counts[k]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addColumn}
                className="rounded-lg border border-dashed border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                + Column
              </button>
              <button
                onClick={addRow}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-cute)] hover:opacity-90"
              >
                + New lesson
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                {columns.map((c, i) => {
                  const isFirst = i === 0;
                  const isDescription = c.id === "description" || i === columns.length - 1;
                  return <col key={c.id} style={{ width: isFirst ? "18%" : isDescription ? "auto" : "22%" }} />;
                })}
                <col style={{ width: "150px" }} />
                <col style={{ width: "44px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--muted)]/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {columns.map((c) => (
                    <th key={c.id} className="group px-4 py-3 font-semibold">
                      <span className="mr-1.5">{c.emoji}</span>
                      <button className="hover:text-primary" onClick={() => renameColumn(c.id)}>
                        {c.label}
                      </button>
                      {columns.length > 1 && (
                        <button
                          onClick={() => deleteColumn(c.id)}
                          className="ml-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          title="Delete column"
                          aria-label={`Delete column ${c.label}`}
                        >
                          ×
                        </button>
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`group border-b border-[color:var(--border)] transition-colors ${
                      idx % 2 === 1 ? "bg-[color:var(--muted)]/30" : "bg-transparent"
                    } hover:bg-[color:var(--accent)]/40`}
                  >
                    {columns.map((c, ci) => (
                      <td key={c.id} className={`relative px-2 py-1.5 align-top ${ci === 0 ? "pl-4" : ""}`}>
                        {ci === 0 && (
                          <span className="pointer-events-none absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                        <input
                          value={row.values[c.id] ?? ""}
                          onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                          placeholder={`Add ${c.label.toLowerCase()}…`}
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-[color:var(--ring)] focus:bg-white focus:ring-2 focus:ring-primary/25"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 align-top">
                      <button
                        onClick={() => cycleStatus(row.id)}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${STATUS_META[row.status].className}`}
                      >
                        <span className="text-sm leading-none">{STATUS_META[row.status].icon}</span>
                        {STATUS_META[row.status].label}
                      </button>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No lessons here yet — add one to start your study log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 p-3 md:hidden">
            {visibleRows.map((row) => {
              const subject = row.values[columns[0]?.id] || "Untitled";
              return (
                <article key={row.id} className="rounded-xl border border-[color:var(--border)] bg-white p-3.5 shadow-sm">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{subject}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cycleStatus(row.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[row.status].className}`}
                      >
                        <span>{STATUS_META[row.status].icon}</span>
                        {STATUS_META[row.status].label}
                      </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {columns.map((c, i) => (
                      <label key={c.id} className="block">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {c.emoji} {c.label}
                        </span>
                        <input
                          value={row.values[c.id] ?? ""}
                          onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                          placeholder={i === 0 ? "Subject name" : `Add ${c.label.toLowerCase()}…`}
                          className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/25"
                        />
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
            {visibleRows.length === 0 && (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-muted-foreground">
                No lessons here yet — add one to start your study log.
              </div>
            )}
          </div>
        </section>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Tap the status pill to cycle · Click a column header to rename it · Everything saves to your browser
        </footer>
      </div>
    </main>
  );
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: "neutral" | "progress" | "done" }) {
  const toneClass =
    tone === "done"
      ? "bg-[oklch(0.93_0.06_260)] text-[oklch(0.35_0.14_265)] border-[oklch(0.82_0.1_260)]"
      : tone === "progress"
      ? "bg-[oklch(0.94_0.05_230)] text-[oklch(0.35_0.13_240)] border-[oklch(0.83_0.09_230)]"
      : "bg-white/80 text-foreground border-[color:var(--border)]";
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm ${toneClass}`}>
      <span className="uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
