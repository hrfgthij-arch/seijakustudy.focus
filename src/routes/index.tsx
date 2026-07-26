import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DescriptionCell } from "@/components/DescriptionCell";
import { TodoList } from "@/components/TodoList";
import stickerKurisu from "@/assets/sticker-kurisu.png";
import stickerViolet from "@/assets/sticker-violet.png";
import stickerMahiru from "@/assets/sticker-mahiru.png";
import stickerKaori from "@/assets/sticker-kaori.png";
import stickerSandrone from "@/assets/sticker-sandrone.png";
import stickerSkirk from "@/assets/sticker-skirk.png";
import stickerNavia from "@/assets/sticker-navia.png";
import { Calendar } from "@/components/ui/calendar";
import { Donut } from "@/components/Donut";
import { ClockWidget, MobileStickyTimer, StudyTimer } from "@/components/StudyTimer";
import { QuickLinksTable } from "@/components/QuickLinksTable";
import { ResizableBox } from "@/components/ResizableBox";
import { BannerUploader } from "@/components/BannerUploader";
import { PdfWidget } from "@/components/PdfWidget";
import { PriorityManager } from "@/components/PriorityManager";
import { SleepTracker } from "@/components/SleepTracker";
import {
  STATUS_META,
  subjectStats,
  uid,
  useStudyStore,
  type Column,
  type Priority,
  type Row,
  type Status,
} from "@/lib/study-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sakura Bloom — Plan, Study, Progress" },
      { name: "description", content: "A cozy anime-themed planner: track lessons, plan days on the calendar, and watch each subject bloom." },
      { property: "og:title", content: "Sakura Bloom — Plan, Study, Progress" },
      { property: "og:description", content: "A cozy anime-themed planner: track lessons, plan days on the calendar, and watch each subject bloom." },
    ],
  }),
  component: Index,
});

const STICKERS = [
  { src: stickerKurisu, style: { top: "8%", left: "1.5%" }, size: 118, r: "-9deg", delay: "0s" },
  { src: stickerSkirk, style: { top: "32%", left: "1%" }, size: 114, r: "5deg", delay: "0.6s" },
  { src: stickerMahiru, style: { top: "56%", left: "1.5%" }, size: 112, r: "-4deg", delay: "1.1s" },
  { src: stickerSandrone, style: { top: "80%", left: "2%" }, size: 110, r: "-10deg", delay: "1.5s" },
  { src: stickerViolet, style: { top: "14%", right: "1.5%" }, size: 118, r: "8deg", delay: "0.3s" },
  { src: stickerNavia, style: { top: "46%", right: "1%" }, size: 114, r: "-6deg", delay: "0.9s" },
  { src: stickerKaori, style: { top: "78%", right: "1.5%" }, size: 112, r: "7deg", delay: "1.3s" },
];

// Mobile: fewer stickers, larger box, object-contain so nothing is cropped.
const MOBILE_STRIP = [stickerKurisu, stickerViolet, stickerMahiru, stickerNavia];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Index() {
  const {
    columns, setColumns,
    rows, setRows,
    priorities, setPriorities,
    settings, setSettings,
    sleep, setSleep,
    quickLinks, setQuickLinks,
    hydrated,
    userId, guestSnapshot, mergeGuestSnapshot, discardGuestSnapshot,
  } = useStudyStore();

  const [filter, setFilter] = useState<"all" | Status>("all");
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [showBanner, setShowBanner] = useState(false);
  const [showPriorityMgr, setShowPriorityMgr] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"none" | "subject" | "status" | "date">("none");

  // Default the selected day to today only after hydration to avoid SSR/CSR locale mismatch.
  useEffect(() => {
    if (hydrated && !selectedDay) setSelectedDay(new Date());
  }, [hydrated, selectedDay]);

  const importantPriorityIds = new Set(["urgent", "high"]);
  const importantOnly = settings.lessonsView === "important";

  const visibleRows = useMemo(() => {
    let list = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        Object.values(r.values).some((v) => v?.toLowerCase().includes(q)),
      );
    }
    if (importantOnly && !q && filter === "all") {
      const important = list.filter(
        (r) => (r.priorityId && importantPriorityIds.has(r.priorityId)) || r.status === "progress",
      );
      list = important.length ? important : list.slice(0, 5);
    }
    if (sortBy !== "none") {
      const statusOrder: Record<Status, number> = { todo: 0, progress: 1, done: 2 };
      list = [...list].sort((a, b) => {
        if (sortBy === "status") return statusOrder[a.status] - statusOrder[b.status];
        if (sortBy === "date") return (a.date ?? "9999").localeCompare(b.date ?? "9999");
        const sa = (a.values["subject"] ?? "").toLowerCase();
        const sb = (b.values["subject"] ?? "").toLowerCase();
        return sa.localeCompare(sb);
      });
    }
    return list;
  }, [rows, filter, search, sortBy, importantOnly]);

  const counts = useMemo(() => ({
    all: rows.length,
    todo: rows.filter((r) => r.status === "todo").length,
    progress: rows.filter((r) => r.status === "progress").length,
    done: rows.filter((r) => r.status === "done").length,
  }), [rows]);

  const stats = useMemo(() => subjectStats(rows), [rows]);
  const overallPct = counts.all ? Math.round((counts.done / counts.all) * 100) : 0;

  const plannedDays = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.date && set.add(r.date));
    return Array.from(set).map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
  }, [rows]);

  const dayRows = useMemo(() => {
    if (!selectedDay) return [];
    const iso = toISO(selectedDay);
    return rows.filter((r) => r.date === iso);
  }, [rows, selectedDay]);

  const priorityMap = useMemo(() => {
    const m = new Map<string, Priority>();
    priorities.forEach((p) => m.set(p.id, p));
    return m;
  }, [priorities]);

  function addRow() {
    const values: Record<string, string> = {};
    columns.forEach((c) => (values[c.id] = ""));
    setRows((r) => [
      ...r,
      {
        id: uid(),
        values,
        status: "todo",
        date: selectedDay ? toISO(selectedDay) : null,
        time: null,
        priorityId: null,
      },
    ]);
  }

  function updateCell(rowId: string, colId: string, v: string) {
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [colId]: v } } : row)));
  }
  function updateDate(rowId: string, iso: string | null) {
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, date: iso } : row)));
  }
  function updateTime(rowId: string, t: string | null) {
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, time: t } : row)));
  }
  function updatePriority(rowId: string, pid: string | null) {
    setRows((r) => r.map((row) => (row.id === rowId ? { ...row, priorityId: pid } : row)));
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
    setColumns((c: Column[]) => [...c, { id, label, emoji }]);
    setRows((rs) => rs.map((r) => ({ ...r, values: { ...r.values, [id]: "" } })));
  }
  function renameColumn(colId: string) {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    const label = window.prompt("Rename column", col.label);
    if (!label) return;
    setColumns((c: Column[]) => c.map((x) => (x.id === colId ? { ...x, label } : x)));
  }
  function deleteColumn(colId: string) {
    if (columns.length <= 1) return;
    if (!window.confirm("Delete this column?")) return;
    setColumns((c: Column[]) => c.filter((x) => x.id !== colId));
    setRows((rs) => rs.map((r) => {
      const rest = { ...r.values };
      delete rest[colId];
      return { ...r, values: rest };
    }));
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10 md:py-14">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
        {STICKERS.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt=""
            className="absolute animate-float object-contain drop-shadow-[0_12px_22px_oklch(0.55_0.16_255/0.25)]"
            style={{
              ...s.style,
              width: s.size,
              height: s.size,
              transform: `rotate(${s.r})`,
              animationDelay: s.delay,
            }}
            loading="lazy"
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Optional banner */}
        {settings.bannerImage && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] shadow-[var(--shadow-cute)]">
            <img src={settings.bannerImage} alt="" className="max-h-56 w-full object-cover" />
          </div>
        )}

        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Study Planner
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Sakura Bloom
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan your days, track every lesson, and watch each subject bloom into progress. 🌸
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/progress"
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                📊 View progress page
              </Link>
              <button
                onClick={() => setShowBanner((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                🖼️ Banner
              </button>
              <button
                onClick={() => setSettings({ ...settings, showPdf: !settings.showPdf })}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                📎 {settings.showPdf ? "Hide" : "Embed"} PDF
              </button>
              <button
                onClick={() => setSettings({ ...settings, showSleep: !settings.showSleep })}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                🌙 {settings.showSleep ? "Hide" : "Add"} sleep tracker
              </button>
              <button
                onClick={() => setShowPriorityMgr((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                ⚡ Priorities
              </button>
              <Link
                to="/planner"
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
              >
                🗓️ Planner
              </Link>
              <Link
                to="/todo"
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary md:hidden"
              >
                📝 To-do
              </Link>
              {!userId && (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                >
                  ☁️ Sign in to sync
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap items-start gap-2">
              <ClockWidget />
              <ResizableBox
                width={settings.timerSize.w}
                height={settings.timerSize.h}
                onResize={(w, h) => setSettings({ ...settings, timerSize: { w, h } })}
              >
                <StudyTimer />
              </ResizableBox>
            </div>
            <div className="flex flex-wrap gap-2">
              <SummaryChip label="Total" value={counts.all} tone="neutral" />
              <SummaryChip label="In progress" value={counts.progress} tone="progress" />
              <SummaryChip label="Done" value={counts.done} tone="done" />
            </div>
          </div>
        </header>

        {guestSnapshot && userId && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">Guest data found on this device</div>
              <div className="text-xs text-muted-foreground">
                Merge your local lessons, todos, and planner slots into your synced account, or discard them.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={mergeGuestSnapshot} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                Merge into account
              </button>
              <button onClick={discardGuestSnapshot} className="rounded-md border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive">
                Discard
              </button>
            </div>
          </div>
        )}

        {(showBanner || showPriorityMgr) && (
          <div className="mb-6 space-y-3">
            {showBanner && (
              <BannerUploader
                value={settings.bannerImage}
                onChange={(v) => setSettings({ ...settings, bannerImage: v })}
                onClose={() => setShowBanner(false)}
              />
            )}
            {showPriorityMgr && (
              <PriorityManager
                priorities={priorities}
                onChange={setPriorities}
                onClose={() => setShowPriorityMgr(false)}
              />
            )}
          </div>
        )}

        {/* Mobile sticker strip — fewer, larger, contain */}
        <div className="mb-6 flex justify-center gap-3 xl:hidden">
          {MOBILE_STRIP.map((s, i) => (
            <img
              key={i}
              src={s}
              alt=""
              className="h-20 w-20 flex-shrink-0 animate-float object-contain drop-shadow-[0_6px_10px_oklch(0.55_0.16_255/0.25)]"
              style={{ animationDelay: `${i * 0.25}s` }}
              loading="lazy"
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4 rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 shadow-[var(--shadow-cute)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Subjects</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall {overallPct}%
                </span>
              </div>
              <div className="flex justify-center border-b border-[color:var(--border)] pb-4">
                <Donut pct={overallPct} size={104} stroke={10} label="All lessons" sublabel={`${counts.done}/${counts.all} done`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.length === 0 && (
                  <p className="col-span-2 text-center text-xs text-muted-foreground">Add lessons to see progress here.</p>
                )}
                {stats.map((s) => (
                  <Donut
                    key={s.subject}
                    pct={s.pct}
                    size={64}
                    stroke={7}
                    label={s.subject}
                    sublabel={`${s.done}/${s.total}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4">
              <TodoList compact />
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur">
              <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-4 py-3 md:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search lessons…"
                    className="min-w-0 flex-1 rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="none">No sort</option>
                    <option value="subject">Sort: Subject</option>
                    <option value="status">Sort: Status</option>
                    <option value="date">Sort: Date</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
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
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-sm" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    {columns.map((c, i) => {
                      const isFirst = i === 0;
                      const isDescription = c.id === "description" || i === columns.length - 1;
                      return <col key={c.id} style={{ width: isFirst ? "14%" : isDescription ? "auto" : "16%" }} />;
                    })}
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "140px" }} />
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
                      <th className="px-4 py-3 font-semibold">📅 Date</th>
                      <th className="px-2 py-3 font-semibold">🕒 Time</th>
                      <th className="px-2 py-3 font-semibold">⚡ Priority</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, idx) => {
                      const p = row.priorityId ? priorityMap.get(row.priorityId) : null;
                      return (
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
                              {c.id === "description" ? (
                                <div className="px-1 py-1.5">
                                  <DescriptionCell
                                    value={row.values[c.id] ?? ""}
                                    onChange={(v) => updateCell(row.id, c.id, v)}
                                    placeholder={`Add ${c.label.toLowerCase()}…`}
                                  />
                                </div>
                              ) : (
                                <input
                                  value={row.values[c.id] ?? ""}
                                  onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                                  placeholder={`Add ${c.label.toLowerCase()}…`}
                                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-[color:var(--ring)] focus:bg-white focus:ring-2 focus:ring-primary/25"
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 align-top">
                            <input
                              type="date"
                              value={row.date ?? ""}
                              onChange={(e) => updateDate(row.id, e.target.value || null)}
                              className="w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-xs text-foreground outline-none focus:border-[color:var(--ring)] focus:bg-white focus:ring-2 focus:ring-primary/25"
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              type="time"
                              value={row.time ?? ""}
                              onChange={(e) => updateTime(row.id, e.target.value || null)}
                              className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-2 text-xs text-foreground outline-none focus:border-[color:var(--ring)] focus:bg-white focus:ring-2 focus:ring-primary/25"
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="relative">
                              <select
                                value={row.priorityId ?? ""}
                                onChange={(e) => updatePriority(row.id, e.target.value || null)}
                                className="w-full appearance-none rounded-full border px-2 py-1 pl-6 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                                style={{
                                  borderColor: p ? p.color : "var(--border)",
                                  color: p ? p.color : "var(--muted-foreground)",
                                  backgroundColor: p ? `color-mix(in oklch, ${p.color} 12%, white)` : "white",
                                }}
                              >
                                <option value="">—</option>
                                {priorities.map((pr) => (
                                  <option key={pr.id} value={pr.id}>{pr.label}</option>
                                ))}
                              </select>
                              <span
                                aria-hidden
                                className="pointer-events-none absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                                style={{ backgroundColor: p ? p.color : "oklch(0.85 0.02 250)" }}
                              />
                            </div>
                          </td>
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
                      );
                    })}
                    {visibleRows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length + 5} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
                  const p = row.priorityId ? priorityMap.get(row.priorityId) : null;
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
                            {c.id === "description" ? (
                              <div className="mt-0.5 rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2">
                                <DescriptionCell
                                  value={row.values[c.id] ?? ""}
                                  onChange={(v) => updateCell(row.id, c.id, v)}
                                  placeholder={`Add ${c.label.toLowerCase()}…`}
                                />
                              </div>
                            ) : (
                              <input
                                value={row.values[c.id] ?? ""}
                                onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                                placeholder={i === 0 ? "Subject name" : `Add ${c.label.toLowerCase()}…`}
                                className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/25"
                              />
                            )}
                          </label>
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">📅 Date</span>
                            <input
                              type="date"
                              value={row.date ?? ""}
                              onChange={(e) => updateDate(row.id, e.target.value || null)}
                              className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🕒 Time</span>
                            <input
                              type="time"
                              value={row.time ?? ""}
                              onChange={(e) => updateTime(row.id, e.target.value || null)}
                              className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                            />
                          </label>
                        </div>
                        <label className="block">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">⚡ Priority</span>
                          <select
                            value={row.priorityId ?? ""}
                            onChange={(e) => updatePriority(row.id, e.target.value || null)}
                            className="mt-0.5 w-full rounded-md border bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                            style={{ borderColor: p ? p.color : "var(--border)", color: p ? p.color : undefined }}
                          >
                            <option value="">—</option>
                            {priorities.map((pr) => (
                              <option key={pr.id} value={pr.id}>{pr.label}</option>
                            ))}
                          </select>
                        </label>
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

            {/* PDF widget (opt-in) */}
            {settings.showPdf && (
              <PdfWidget
                url={settings.pdfUrl}
                name={settings.pdfName}
                onChange={(url, name) => setSettings({ ...settings, pdfUrl: url, pdfName: name })}
                onClose={() => setSettings({ ...settings, showPdf: false })}
              />
            )}

            {/* Sleep tracker (opt-in) */}
            {settings.showSleep && (
              <SleepTracker
                entries={sleep}
                onChange={setSleep}
                onHide={() => setSettings({ ...settings, showSleep: false })}
              />
            )}

            {/* Calendar planner */}
            <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur">
              <div className="border-b border-[color:var(--border)] px-4 py-3 md:px-5">
                <h2 className="text-sm font-bold text-foreground">📅 Plan your days</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Dots mark days that already have lessons. Pick a day to see or plan for it.</p>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr] md:p-5">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  modifiers={{ planned: plannedDays }}
                  modifiersClassNames={{
                    planned: "relative font-semibold text-primary after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                  }}
                  className="pointer-events-auto rounded-xl border border-[color:var(--border)] bg-white p-2"
                />
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedDay ? selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "Pick a day"}
                    </h3>
                    <span className="text-[11px] font-semibold text-muted-foreground">{dayRows.length} lesson{dayRows.length === 1 ? "" : "s"}</span>
                  </div>
                  {dayRows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-xs text-muted-foreground">
                      Nothing planned yet. Add a lesson above and assign this date, or plan ahead here.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {[...dayRows].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99")).map((r: Row) => {
                        const s = STATUS_META[r.status];
                        const subject = r.values[columns[0]?.id] || "Untitled";
                        const lesson = r.values[columns[1]?.id] || "";
                        const p = r.priorityId ? priorityMap.get(r.priorityId) : null;
                        return (
                          <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {r.time && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-primary">
                                  {r.time}
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">{subject}</div>
                                {lesson && <div className="truncate text-xs text-muted-foreground">{lesson}</div>}
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                              {p && (
                                <span
                                  className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                                  style={{ borderColor: p.color, color: p.color, backgroundColor: `color-mix(in oklch, ${p.color} 12%, white)` }}
                                >
                                  {p.label}
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.className}`}>
                                <span>{s.icon}</span>{s.label}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Tap the status pill to cycle · Click a column header to rename · Drag the timer's corner to resize · Everything saves to your browser
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
