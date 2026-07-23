import { useEffect, useState } from "react";

export type Status = "todo" | "progress" | "done";

export type Column = {
  id: string;
  label: string;
  emoji: string;
};

export type Priority = {
  id: string;
  label: string;
  color: string; // oklch or hex
};

export type Row = {
  id: string;
  values: Record<string, string>;
  status: Status;
  date: string | null; // ISO yyyy-mm-dd
  time: string | null; // HH:MM
  priorityId: string | null;
};

export type SleepEntry = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  hours: number;
  note: string;
};

export type Settings = {
  bannerImage: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  timerSize: { w: number; h: number };
  showSleep: boolean;
  showPdf: boolean;
};

export const DEFAULT_COLUMNS: Column[] = [
  { id: "subject", label: "Subject", emoji: "📘" },
  { id: "lesson", label: "Lesson", emoji: "✏️" },
  { id: "description", label: "Description", emoji: "📝" },
];

export const DEFAULT_PRIORITIES: Priority[] = [
  { id: "urgent", label: "Urgent", color: "oklch(0.62 0.2 25)" },
  { id: "high", label: "High", color: "oklch(0.7 0.17 55)" },
  { id: "medium", label: "Medium", color: "oklch(0.72 0.13 220)" },
  { id: "low", label: "Low", color: "oklch(0.7 0.09 250)" },
];

export const DEFAULT_SETTINGS: Settings = {
  bannerImage: null,
  pdfUrl: null,
  pdfName: null,
  timerSize: { w: 340, h: 130 },
  showSleep: false,
  showPdf: false,
};

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

const STORAGE_KEY = "sakura-study-tracker-v3";
const LEGACY_V2 = "sakura-study-tracker-v2";
const LEGACY_V1 = "sakura-study-tracker-v1";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type State = {
  columns: Column[];
  rows: Row[];
  priorities: Priority[];
  settings: Settings;
  sleep: SleepEntry[];
};

function migrateRow(r: Partial<Row> & { id: string; values: Record<string, string>; status: Status }): Row {
  return {
    id: r.id,
    values: r.values,
    status: r.status,
    date: r.date ?? null,
    time: r.time ?? null,
    priorityId: r.priorityId ?? null,
  };
}

function loadState(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        columns: parsed.columns ?? DEFAULT_COLUMNS,
        rows: (parsed.rows ?? []).map(migrateRow),
        priorities: parsed.priorities ?? DEFAULT_PRIORITIES,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        sleep: parsed.sleep ?? [],
      };
    }
    const v2 = window.localStorage.getItem(LEGACY_V2);
    if (v2) {
      const parsed = JSON.parse(v2) as { columns: Column[]; rows: Row[] };
      return {
        columns: parsed.columns ?? DEFAULT_COLUMNS,
        rows: (parsed.rows ?? []).map(migrateRow),
        priorities: DEFAULT_PRIORITIES,
        settings: DEFAULT_SETTINGS,
        sleep: [],
      };
    }
    const v1 = window.localStorage.getItem(LEGACY_V1);
    if (v1) {
      const parsed = JSON.parse(v1) as { columns: Column[]; rows: Omit<Row, "date" | "time" | "priorityId">[] };
      return {
        columns: parsed.columns ?? DEFAULT_COLUMNS,
        rows: (parsed.rows ?? []).map((r) => migrateRow(r as unknown as Row)),
        priorities: DEFAULT_PRIORITIES,
        settings: DEFAULT_SETTINGS,
        sleep: [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

const seedRows = (): Row[] => [
  { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution" }, status: "progress", date: null, time: null, priorityId: "high" },
  { id: uid(), values: { subject: "Japanese", lesson: "N5 Kanji", description: "Review chapter 3" }, status: "todo", date: null, time: null, priorityId: "medium" },
  { id: uid(), values: { subject: "History", lesson: "Edo Period", description: "Notes + timeline" }, status: "done", date: null, time: null, priorityId: "low" },
];

export function useStudyStore() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [rows, setRows] = useState<Row[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>(DEFAULT_PRIORITIES);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sleep, setSleep] = useState<SleepEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.columns?.length) {
      setColumns(saved.columns);
      setRows(saved.rows ?? []);
      setPriorities(saved.priorities ?? DEFAULT_PRIORITIES);
      setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
      setSleep(saved.sleep ?? []);
    } else {
      setRows(seedRows());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ columns, rows, priorities, settings, sleep })
    );
  }, [columns, rows, priorities, settings, sleep, hydrated]);

  return {
    columns, setColumns,
    rows, setRows,
    priorities, setPriorities,
    settings, setSettings,
    sleep, setSleep,
    hydrated,
  };
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
