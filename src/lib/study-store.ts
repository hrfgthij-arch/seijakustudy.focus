import { useEffect, useState } from "react";

export type Status = "todo" | "progress" | "done";

export type Column = {
  id: string;
  label: string;
  emoji: string;
};

export type Row = {
  id: string;
  values: Record<string, string>;
  status: Status;
  date: string | null; // ISO yyyy-mm-dd
};

export const DEFAULT_COLUMNS: Column[] = [
  { id: "subject", label: "Subject", emoji: "📘" },
  { id: "lesson", label: "Lesson", emoji: "✏️" },
  { id: "description", label: "Description", emoji: "📝" },
];

export const STATUS_META: Record<
  Status,
  { label: string; className: string; dot: string; icon: string }
> = {
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

const STORAGE_KEY = "sakura-study-tracker-v2";
const LEGACY_KEY = "sakura-study-tracker-v1";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type State = { columns: Column[]; rows: Row[] };

function loadState(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { columns: Column[]; rows: Omit<Row, "date">[] };
      return {
        columns: parsed.columns ?? DEFAULT_COLUMNS,
        rows: (parsed.rows ?? []).map((r) => ({ ...r, date: null })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

const seedRows = (): Row[] => [
  { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution" }, status: "progress", date: null },
  { id: uid(), values: { subject: "Japanese", lesson: "N5 Kanji", description: "Review chapter 3" }, status: "todo", date: null },
  { id: uid(), values: { subject: "History", lesson: "Edo Period", description: "Notes + timeline" }, status: "done", date: null },
];

export function useStudyStore() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [rows, setRows] = useState<Row[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.columns?.length) {
      setColumns(saved.columns);
      setRows(saved.rows ?? []);
    } else {
      setRows(seedRows());
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as State;
          setColumns(parsed.columns);
          setRows(parsed.rows);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, rows }));
  }, [columns, rows, hydrated]);

  return { columns, setColumns, rows, setRows, hydrated };
}

export function subjectStats(rows: Row[], subjectColId = "subject") {
  const map = new Map<string, { total: number; done: number; progress: number; todo: number }>();
  for (const r of rows) {
    const subj = (r.values[subjectColId] || "Untitled").trim() || "Untitled";
    const entry = map.get(subj) ?? { total: 0, done: 0, progress: 0, todo: 0 };
    entry.total += 1;
    entry[r.status] += 1;
    map.set(subj, entry);
  }
  return Array.from(map, ([subject, s]) => ({ subject, ...s, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}
