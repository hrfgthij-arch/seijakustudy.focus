import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Status = "todo" | "progress" | "done";

export type Column = { id: string; label: string; emoji: string };
export type Priority = { id: string; label: string; color: string };

export type Row = {
  id: string;
  values: Record<string, string>;
  status: Status;
  date: string | null;
  time: string | null;
  dueDate: string | null;
  priorityId: string | null;
};

/** Maximum number of user-defined columns in the lessons table. */
export const MAX_COLUMNS = 8;


export type SleepEntry = {
  id: string;
  date: string;
  hours: number;
  note: string;
  sleepTime?: string | null;
  wakeTime?: string | null;
};

export type Todo = { id: string; text: string; done: boolean; createdAt: string };

// Planner: `subjects` is the multi-subject field; `subject` kept for backward compat.
// `week` is the ISO date of that week's first day — each week gets a fresh table.
export type PlannerSlot = {
  id: string;
  week?: string;
  weekday: number;
  time: string;
  subject: string;
  subjects?: string[];
  note: string;
};

// Consistency: per-habit list of ISO dates ticked
export type Habit = { id: string; label: string; dates: string[] };

export type WeekStart = "sunday" | "monday";

export type TimeFormat = "12h" | "24h";

/** A Google-Calendar-style planner event. `start`/`end` are minutes from midnight. */
export type PlannerEvent = {
  id: string;
  /** ISO date of the first day of the week this event belongs to. */
  week: string;
  weekday: number;
  start: number;
  end: number;
  title: string;
  description: string;
  color: string;
  allDay: boolean;
  repeat: "none" | "weekly" | "weekdays";
  done: boolean;
};

export const EVENT_COLORS: { id: string; label: string; css: string }[] = [
  { id: "blue", label: "Blueberry", css: "oklch(0.58 0.15 258)" },
  { id: "pink", label: "Flamingo", css: "oklch(0.68 0.15 355)" },
  { id: "green", label: "Basil", css: "oklch(0.58 0.13 155)" },
  { id: "amber", label: "Tangerine", css: "oklch(0.72 0.15 65)" },
  { id: "purple", label: "Grape", css: "oklch(0.55 0.16 300)" },
  { id: "red", label: "Tomato", css: "oklch(0.6 0.19 25)" },
  { id: "teal", label: "Peacock", css: "oklch(0.62 0.11 205)" },
  { id: "graphite", label: "Graphite", css: "oklch(0.55 0.02 250)" },
];

export function eventColorCss(id: string) {
  return (EVENT_COLORS.find((c) => c.id === id) ?? EVENT_COLORS[0]).css;
}

/** 24 hour rows: 12 AM through 11 PM. */
export const DAY_HOURS: number[] = Array.from({ length: 24 }, (_, i) => i);

export function formatMinutes(mins: number, fmt: TimeFormat = "12h") {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  if (fmt === "24h") return `${String(h).padStart(2, "0")}:${mm}`;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix}`;
}

export function formatHourLabel(hour: number, fmt: TimeFormat = "12h") {
  if (fmt === "24h") return `${String(hour).padStart(2, "0")}:00`;
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

/** "HH:MM" -> minutes; tolerant of "07:00–08:30" legacy labels. */
export function parseTimeToMinutes(value: string): number {
  const m = /(\d{1,2}):(\d{2})/.exec(value ?? "");
  if (!m) return 8 * 60;
  return Math.min(23 * 60 + 59, Number(m[1]) * 60 + Number(m[2]));
}

export function minutesToInput(mins: number) {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type ThemeId = "seijaku" | "sakura" | "crimson" | "matcha" | "lavender" | "midnight";

export const THEMES: { id: ThemeId; label: string; emoji: string; swatch: string }[] = [
  { id: "seijaku", label: "Seijaku Blue", emoji: "🌊", swatch: "oklch(0.55 0.16 255)" },
  { id: "sakura", label: "Sakura Pink", emoji: "🌸", swatch: "oklch(0.65 0.16 350)" },
  { id: "crimson", label: "Crimson", emoji: "🍁", swatch: "oklch(0.55 0.19 25)" },
  { id: "matcha", label: "Matcha", emoji: "🍵", swatch: "oklch(0.55 0.13 155)" },
  { id: "lavender", label: "Lavender", emoji: "💜", swatch: "oklch(0.55 0.16 300)" },
  { id: "midnight", label: "Midnight", emoji: "🌙", swatch: "oklch(0.72 0.12 265)" },
];

export type QuickLink = { id: string; label: string; url: string; icon?: string };

export type TimerBackground = {
  /** "preset" uses a built-in gradient key, "color" a solid CSS color, "image" a URL. */
  kind: "preset" | "color" | "image";
  value: string;
  opacity: number;
};

export type TimerDisplay = {
  theme: "light" | "dark";
  style: "digital" | "flip" | "minimal";
  showSeconds: boolean;
  showDate: boolean;
  showTimer: boolean;
  background: TimerBackground;
};

/** Notion-lite custom pages. */
export type BlockType =
  | "h1"
  | "h2"
  | "h3"
  | "text"
  | "bullet"
  | "numbered"
  | "todo"
  | "toggle"
  | "quote"
  | "callout"
  | "divider"
  | "code"
  | "table"
  | "columns"
  | "link"
  | "image"
  | "pdf"
  | "spotify";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  emoji?: string;
  color?: string;
  url?: string;
  cells?: string[][];
  /** toggle: nested blocks; columns: uses `cols` instead. */
  children?: Block[];
  open?: boolean;
  cols?: Block[][];
};

export type Page = {
  id: string;
  title: string;
  icon: string;
  cover: string | null;
  blocks: Block[];
  favorite?: boolean;
  fullWidth?: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Page cover gradients. */
export const PAGE_COVERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "None", css: "" },
  { id: "dawn", label: "Dawn", css: "linear-gradient(120deg, oklch(0.9 0.07 30), oklch(0.88 0.08 340))" },
  { id: "sea", label: "Sea", css: "linear-gradient(120deg, oklch(0.88 0.07 230), oklch(0.9 0.06 190))" },
  { id: "moss", label: "Moss", css: "linear-gradient(120deg, oklch(0.9 0.06 150), oklch(0.92 0.05 110))" },
  { id: "dusk", label: "Dusk", css: "linear-gradient(120deg, oklch(0.62 0.11 285), oklch(0.5 0.12 250))" },
  { id: "paper", label: "Paper", css: "linear-gradient(120deg, oklch(0.96 0.01 90), oklch(0.93 0.02 60))" },
];

export function pageCoverCss(id: string | null) {
  return PAGE_COVERS.find((c) => c.id === id)?.css ?? "";
}

/** Flashcards + spaced repetition. */
export type Flashcard = {
  id: string;
  front: string;
  back: string;
  /** ISO date the card is next due. */
  due: string;
  /** Days until the next review after the last rating. */
  interval: number;
  ease: number;
  reps: number;
};

export type Deck = {
  id: string;
  name: string;
  emoji: string;
  cards: Flashcard[];
  createdAt: string;
};

export type Grade = {
  id: string;
  subject: string;
  title: string;
  score: number;
  max: number;
  weight: number;
  date: string;
};

export function emptyCard(front = "", back = ""): Flashcard {
  return { id: uid(), front, back, due: new Date().toISOString().slice(0, 10), interval: 0, ease: 2.5, reps: 0 };
}

export function emptyDeck(name = "New deck", emoji = "🃏"): Deck {
  return { id: uid(), name, emoji, cards: [], createdAt: new Date().toISOString() };
}

/** SM-2-lite scheduling. */
export function scheduleCard(card: Flashcard, rating: "again" | "hard" | "good" | "easy"): Flashcard {
  let ease = card.ease;
  let interval = card.interval;
  if (rating === "again") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 0;
  } else if (rating === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
  } else if (rating === "good") {
    interval = interval === 0 ? 1 : Math.round(interval * ease);
  } else {
    ease = ease + 0.15;
    interval = interval === 0 ? 3 : Math.round(interval * ease * 1.3);
  }
  const due = new Date();
  due.setDate(due.getDate() + Math.max(0, interval));
  return { ...card, ease, interval, reps: card.reps + 1, due: due.toISOString().slice(0, 10) };
}

export const BLOCK_MENU: { type: BlockType; label: string; emoji: string; hint: string }[] = [
  { type: "text", label: "Text", emoji: "¶", hint: "Plain paragraph" },
  { type: "h1", label: "Heading 1", emoji: "H₁", hint: "Big section title" },
  { type: "h2", label: "Heading 2", emoji: "H₂", hint: "Section title" },
  { type: "h3", label: "Heading 3", emoji: "H₃", hint: "Small title" },
  { type: "bullet", label: "Bulleted list", emoji: "•", hint: "One idea per line" },
  { type: "numbered", label: "Numbered list", emoji: "1.", hint: "Ordered steps" },
  { type: "todo", label: "Checklist", emoji: "☑", hint: "Tickable task" },
  { type: "toggle", label: "Toggle", emoji: "▸", hint: "Collapsible section" },
  { type: "quote", label: "Quote", emoji: "❝", hint: "Highlight a line" },
  { type: "callout", label: "Callout", emoji: "💡", hint: "Emoji + tinted box" },
  { type: "code", label: "Code", emoji: "‹›", hint: "Monospace block" },
  { type: "divider", label: "Divider", emoji: "―", hint: "Section break" },
  { type: "table", label: "Table", emoji: "▦", hint: "Editable grid" },
  { type: "columns", label: "Two columns", emoji: "▥", hint: "Side-by-side stacks" },
  { type: "link", label: "Link card", emoji: "🔗", hint: "Bookmark a URL" },
  { type: "image", label: "Image", emoji: "🖼", hint: "Paste an image URL" },
  { type: "pdf", label: "PDF embed", emoji: "📄", hint: "Embed a PDF" },
  { type: "spotify", label: "Spotify", emoji: "🎧", hint: "Embed a playlist" },
];


export const CALLOUT_COLORS = ["blue", "pink", "green", "amber", "purple"] as const;

/** Look-and-feel knobs exposed in the Settings hub. */
export type Appearance = {
  accent: "theme" | "sky" | "rose" | "amber" | "violet" | "emerald";
  font: "fredoka" | "quicksand" | "serif" | "mono";
  density: "cosy" | "compact";
  radius: "round" | "soft" | "sharp";
  pattern: "none" | "dots" | "grid" | "stars";
  stickers: boolean;
  stickerPack: "all" | "anime" | "genshin" | "secret";
  animations: boolean;
};

export const DEFAULT_APPEARANCE: Appearance = {
  accent: "theme",
  font: "fredoka",
  density: "cosy",
  radius: "round",
  pattern: "none",
  stickers: true,
  stickerPack: "all",
  animations: true,
};

export type Unlocks = { secretStickers: boolean; logoTaps: number };

export const DEFAULT_UNLOCKS: Unlocks = { secretStickers: false, logoTaps: 0 };

export type Settings = {
  bannerImage: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  displayName: string | null;
  timerSize: { w: number; h: number };
  showSleep: boolean;
  showPdf: boolean;
  showProgressPanel: boolean;
  weekStart: WeekStart;
  timeRanges: string[];
  lessonsView: "important" | "all";
  showQuickLinks: boolean;
  timerDisplay: TimerDisplay;
  spotifyUrl: string | null;
  showSpotify: boolean;
  timeFormat: TimeFormat;
  theme: ThemeId;
  showPlannerTodo: boolean;
  appearance: Appearance;
  unlocks: Unlocks;
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

export const DEFAULT_TIME_RANGES: string[] = Array.from({ length: 15 }, (_, i) => `${String(6 + i).padStart(2, "0")}:00`);

export const TIMER_BG_PRESETS: { id: string; label: string; css: string; dark: boolean }[] = [
  { id: "sky", label: "Sky", css: "linear-gradient(135deg, oklch(0.94 0.05 240), oklch(0.88 0.08 260))", dark: false },
  { id: "sakura", label: "Sakura", css: "linear-gradient(135deg, oklch(0.95 0.04 350), oklch(0.9 0.07 320))", dark: false },
  { id: "mint", label: "Mint", css: "linear-gradient(135deg, oklch(0.95 0.05 170), oklch(0.9 0.07 200))", dark: false },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg, oklch(0.9 0.09 60), oklch(0.86 0.11 25))", dark: false },
  { id: "midnight", label: "Midnight", css: "linear-gradient(135deg, oklch(0.28 0.07 265), oklch(0.16 0.05 260))", dark: true },
  { id: "plain", label: "Plain", css: "oklch(1 0 0)", dark: false },
];

export const DEFAULT_TIMER_BACKGROUND: TimerBackground = { kind: "preset", value: "sky", opacity: 0.6 };

export const DEFAULT_TIMER_DISPLAY: TimerDisplay = {
  theme: "light",
  style: "digital",
  showSeconds: false,
  showDate: true,
  showTimer: true,
  background: DEFAULT_TIMER_BACKGROUND,
};

export const DEFAULT_SETTINGS: Settings = {
  bannerImage: null,
  pdfUrl: null,
  pdfName: null,
  displayName: null,
  timerSize: { w: 340, h: 130 },
  showSleep: false,
  showPdf: false,
  showProgressPanel: false,
  weekStart: "sunday",
  timeRanges: DEFAULT_TIME_RANGES,
  lessonsView: "important",
  showQuickLinks: true,
  timerDisplay: DEFAULT_TIMER_DISPLAY,
  spotifyUrl: null,
  showSpotify: true,
  timeFormat: "12h",
  theme: "seijaku",
  showPlannerTodo: true,
  appearance: DEFAULT_APPEARANCE,
  unlocks: DEFAULT_UNLOCKS,
};


/** Resolve a timer background into inline style props. */
export function timerBackgroundStyle(bg?: TimerBackground): React.CSSProperties {
  const b = bg ?? DEFAULT_TIMER_BACKGROUND;
  if (b.kind === "image" && b.value) {
    return { backgroundImage: `url(${b.value})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 1 };
  }
  if (b.kind === "color") return { background: b.value || "white" };
  const preset = TIMER_BG_PRESETS.find((p) => p.id === b.value) ?? TIMER_BG_PRESETS[0];
  return { background: preset.css };
}


export const DEFAULT_HABITS: Habit[] = [
  { id: "study", label: "Studied today", dates: [] },
  { id: "review", label: "Reviewed notes", dates: [] },
];

export const STATUS_META: Record<Status, { label: string; className: string; dot: string; icon: string }> = {
  todo: {
    label: "Not started",
    icon: "○",
    dot: "bg-[oklch(0.7_0.03_250)]",
    className: "bg-[oklch(0.95_0.02_250)] text-[oklch(0.4_0.05_250)] border-[oklch(0.86_0.03_250)]",
  },
  progress: {
    label: "In progress",
    icon: "◐",
    dot: "bg-[oklch(0.72_0.13_230)]",
    className: "bg-[oklch(0.94_0.05_230)] text-[oklch(0.35_0.13_240)] border-[oklch(0.82_0.09_230)]",
  },
  done: {
    label: "Completed",
    icon: "✓",
    dot: "bg-[oklch(0.55_0.16_260)]",
    className: "bg-[oklch(0.93_0.06_260)] text-[oklch(0.35_0.14_265)] border-[oklch(0.78_0.11_260)]",
  },
};

const STORAGE_KEY = "sakura-study-tracker-v4";
const LEGACY_V3 = "sakura-study-tracker-v3";
const LEGACY_V2 = "sakura-study-tracker-v2";
const LEGACY_V1 = "sakura-study-tracker-v1";
const GUEST_SNAPSHOT_KEY = "sakura-guest-snapshot";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export type State = {
  columns: Column[];
  rows: Row[];
  priorities: Priority[];
  settings: Settings;
  sleep: SleepEntry[];
  todos: Todo[];
  plannerSlots: PlannerSlot[];
  plannerEvents: PlannerEvent[];
  habits: Habit[];
  quickLinks: QuickLink[];
  pages: Page[];
};

function emptyState(): State {
  return {
    columns: DEFAULT_COLUMNS,
    rows: [],
    priorities: DEFAULT_PRIORITIES,
    settings: DEFAULT_SETTINGS,
    sleep: [],
    todos: [],
    plannerSlots: [],
    plannerEvents: [],
    habits: DEFAULT_HABITS,
    quickLinks: [],
    pages: [],
  };
}

export function emptyBlock(type: BlockType = "text"): Block {
  const b: Block = { id: uid(), type, text: "" };
  if (type === "callout") {
    b.emoji = "💡";
    b.color = "blue";
  }
  if (type === "table") b.cells = [["", ""], ["", ""]];
  return b;
}

export function emptyPage(): Page {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: "Untitled page",
    icon: "📄",
    cover: null,
    blocks: [emptyBlock("text")],
    createdAt: now,
    updatedAt: now,
  };
}

function migrateBlock(b: any): Block {
  const type: BlockType = BLOCK_MENU.some((m) => m.type === b?.type) ? b.type : "text";
  const out: Block = { id: b?.id ?? uid(), type, text: typeof b?.text === "string" ? b.text : "" };
  if (typeof b?.checked === "boolean") out.checked = b.checked;
  if (typeof b?.emoji === "string") out.emoji = b.emoji;
  if (typeof b?.color === "string") out.color = b.color;
  if (typeof b?.url === "string") out.url = b.url;
  if (Array.isArray(b?.cells)) out.cells = b.cells.map((r: any) => (Array.isArray(r) ? r.map((c: any) => String(c ?? "")) : [""]));
  if (type === "table" && !out.cells) out.cells = [["", ""], ["", ""]];
  return out;
}

function migratePage(p: any): Page {
  const now = new Date().toISOString();
  return {
    id: p?.id ?? uid(),
    title: typeof p?.title === "string" ? p.title : "Untitled page",
    icon: typeof p?.icon === "string" && p.icon ? p.icon : "📄",
    cover: typeof p?.cover === "string" ? p.cover : null,
    blocks: Array.isArray(p?.blocks) ? p.blocks.map(migrateBlock) : [emptyBlock("text")],
    createdAt: typeof p?.createdAt === "string" ? p.createdAt : now,
    updatedAt: typeof p?.updatedAt === "string" ? p.updatedAt : now,
  };
}


function migrateRow(r: any): Row {
  return {
    id: r.id,
    values: r.values ?? {},
    status: r.status,
    date: r.date ?? null,
    time: r.time ?? null,
    dueDate: r.dueDate ?? null,
    priorityId: r.priorityId ?? null,
  };
}


function migrateSlot(s: any): PlannerSlot {
  const subjects: string[] = Array.isArray(s?.subjects)
    ? s.subjects.filter(Boolean)
    : s?.subject
    ? [s.subject]
    : [];
  return {
    id: s.id ?? Math.random().toString(36).slice(2, 10),
    week: typeof s.week === "string" ? s.week : "",
    weekday: s.weekday,
    time: s.time,
    subject: s.subject ?? subjects[0] ?? "",
    subjects,
    note: s.note ?? "",
  };
}

function migrateEvent(e: any): PlannerEvent {
  const start = typeof e?.start === "number" ? e.start : parseTimeToMinutes(String(e?.start ?? "08:00"));
  const end = typeof e?.end === "number" ? e.end : start + 60;
  return {
    id: e?.id ?? Math.random().toString(36).slice(2, 10),
    week: typeof e?.week === "string" ? e.week : "",
    weekday: Number(e?.weekday ?? 0),
    start,
    end: Math.max(start + 15, end),
    title: e?.title ?? "",
    description: e?.description ?? "",
    color: e?.color ?? "blue",
    allDay: !!e?.allDay,
    repeat: e?.repeat === "weekly" || e?.repeat === "weekdays" ? e.repeat : "none",
    done: !!e?.done,
  };
}

/** v7 planner slots (one hour label + subject chips) become one event each. */
function slotsToEvents(slots: PlannerSlot[]): PlannerEvent[] {
  const out: PlannerEvent[] = [];
  for (const s of slots) {
    const subjects = s.subjects?.length ? s.subjects : s.subject ? [s.subject] : [];
    if (!subjects.length && !s.note) continue;
    const start = parseTimeToMinutes(s.time);
    out.push({
      id: `mig-${s.id}`,
      week: s.week ?? "",
      weekday: s.weekday,
      start,
      end: Math.min(1440, start + 60),
      title: subjects.join(", ") || "Study",
      description: s.note ?? "",
      color: "blue",
      allDay: false,
      repeat: "none",
      done: false,
    });
  }
  return out;
}

function normalizeState(parsed: any): State {
  const base = emptyState();
  const plannerSlots: PlannerSlot[] = (parsed?.plannerSlots ?? []).map(migrateSlot);
  const plannerEvents: PlannerEvent[] = Array.isArray(parsed?.plannerEvents)
    ? parsed.plannerEvents.map(migrateEvent)
    : slotsToEvents(plannerSlots);
  return {
    columns: parsed?.columns?.length ? parsed.columns : base.columns,
    rows: (parsed?.rows ?? []).map(migrateRow),
    priorities: parsed?.priorities?.length ? parsed.priorities : base.priorities,
    settings: {
      ...base.settings,
      ...(parsed?.settings ?? {}),
      timeRanges:
        Array.isArray(parsed?.settings?.timeRanges) && parsed.settings.timeRanges.length
          ? parsed.settings.timeRanges
          : base.settings.timeRanges,
      timeFormat: parsed?.settings?.timeFormat === "24h" ? "24h" : "12h",
      theme: THEMES.some((t) => t.id === parsed?.settings?.theme) ? parsed.settings.theme : base.settings.theme,
      timerDisplay: {
        ...base.settings.timerDisplay,
        ...(parsed?.settings?.timerDisplay ?? {}),
        background: {
          ...base.settings.timerDisplay.background,
          ...(parsed?.settings?.timerDisplay?.background ?? {}),
        },
      },
      appearance: { ...base.settings.appearance, ...(parsed?.settings?.appearance ?? {}) },
      unlocks: { ...base.settings.unlocks, ...(parsed?.settings?.unlocks ?? {}) },
    },
    sleep: parsed?.sleep ?? [],
    todos: parsed?.todos ?? [],
    plannerSlots,
    plannerEvents,
    habits: parsed?.habits?.length ? parsed.habits : base.habits,
    quickLinks: Array.isArray(parsed?.quickLinks) ? parsed.quickLinks : [],
    pages: Array.isArray(parsed?.pages) ? parsed.pages.map(migratePage) : [],
  };

}

function loadLocal(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_V3) ||
      window.localStorage.getItem(LEGACY_V2) ||
      window.localStorage.getItem(LEGACY_V1);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveLocal(state: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const seedRows = (): Row[] => [
  { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution" }, status: "progress", date: null, time: null, dueDate: null, priorityId: "high" },
  { id: uid(), values: { subject: "Japanese", lesson: "N5 Kanji", description: "Review chapter 3" }, status: "todo", date: null, time: null, dueDate: null, priorityId: "medium" },
  { id: uid(), values: { subject: "History", lesson: "Edo Period", description: "Notes + timeline" }, status: "done", date: null, time: null, dueDate: null, priorityId: "low" },
];


function hasMeaningfulData(s: State) {
  return s.rows.length > 0 || s.todos.length > 0 || s.plannerSlots.length > 0 || s.plannerEvents.length > 0 || s.sleep.length > 0;
}

const MERGE_RESOLVED_KEY = "sakura-merge-resolved-v1";

function isMergeResolved(uid: string) {
  try {
    const list = JSON.parse(window.localStorage.getItem(MERGE_RESOLVED_KEY) ?? "[]");
    return Array.isArray(list) && list.includes(uid);
  } catch {
    return false;
  }
}

function markMergeResolved(uid: string) {
  try {
    const list = JSON.parse(window.localStorage.getItem(MERGE_RESOLVED_KEY) ?? "[]");
    const next = Array.isArray(list) ? list : [];
    if (!next.includes(uid)) next.push(uid);
    window.localStorage.setItem(MERGE_RESOLVED_KEY, JSON.stringify(next));
  } catch {}
}

/** True when the local snapshot holds at least one item the cloud copy lacks. */
function hasExtraData(local: State, remote: State) {
  const ids = new Set<string>([
    ...remote.rows.map((r) => r.id),
    ...remote.todos.map((t) => t.id),
    ...remote.plannerSlots.map((p) => p.id),
    ...remote.plannerEvents.map((p) => p.id),
    ...remote.sleep.map((s) => s.id),
  ]);
  const localIds = [
    ...local.rows.map((r) => r.id),
    ...local.todos.map((t) => t.id),
    ...local.plannerSlots.map((p) => p.id),
    ...local.plannerEvents.map((p) => p.id),
    ...local.sleep.map((s) => s.id),
  ];
  return localIds.some((id) => !ids.has(id));
}


// ---- Cloud sync ---- //

async function fetchRemote(userId: string): Promise<{ data: State | null; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from("study_state" as any)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { data: null, updatedAt: null };
  return { data: normalizeState((data as any).data), updatedAt: (data as any).updated_at };
}

async function pushRemote(userId: string, state: State) {
  await supabase
    .from("study_state" as any)
    .upsert({ user_id: userId, data: state as any }, { onConflict: "user_id" });
}

// Singleton hook: multiple mounts share state via a broadcast channel of listeners
type Listener = (s: State) => void;
const listeners = new Set<Listener>();
let sharedState: State | null = null;
let hydrated = false;

function setSharedState(s: State) {
  sharedState = s;
  listeners.forEach((l) => l(s));
}

export function useStudyStore() {
  // Always start from the empty state so the first client render matches SSR;
  // real data arrives in the effects below (avoids hydration mismatches).
  const [state, setLocalState] = useState<State>(() => emptyState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [guestSnapshot, setGuestSnapshot] = useState<State | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressPush = useRef(false);
  const currentUserRef = useRef<string | null>(null);
  const lastPushAtRef = useRef(0);

  // Register listener
  useEffect(() => {
    const l: Listener = (s) => setLocalState(s);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Initial hydrate from local
  useEffect(() => {
    if (hydrated) {
      if (sharedState) setLocalState(sharedState);
      setIsHydrated(true);
      return;
    }
    const saved = loadLocal();
    let initial: State;
    if (saved) initial = saved;
    else {
      initial = emptyState();
      initial.rows = seedRows();
    }
    hydrated = true;
    setSharedState(initial);
    setIsHydrated(true);

    // Guest snapshots are restored per-account inside handleUser, so a resolved
    // merge never comes back.

  }, []);

  // Auth subscription — hook up cloud sync
  useEffect(() => {
    if (!isHydrated) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let syncedUserId: string | null = null;

    async function handleUser(uid: string | null) {
      // Ignore repeated auth events for the same already-synced user
      // (INITIAL_SESSION, TOKEN_REFRESHED, etc.) — otherwise the merge banner
      // would re-appear on every token refresh.
      if (uid && uid === syncedUserId) {
        currentUserRef.current = uid;
        setUserId(uid);
        return;
      }
      currentUserRef.current = uid;
      setUserId(uid);
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      if (!uid) {
        syncedUserId = null;
        return;
      }

      const localSnapshot = sharedState ?? emptyState();
      const { data: remote } = await fetchRemote(uid);

      if (!remote) {
        suppressPush.current = true;
        setSharedState(localSnapshot);
        suppressPush.current = false;
        await pushRemote(uid, localSnapshot);
      } else if (hasMeaningfulData(localSnapshot) && hasMeaningfulData(remote)) {
        // Offer the merge only when: (a) this account never resolved a merge,
        // and (b) the local data actually contains something the cloud lacks.
        if (!isMergeResolved(uid) && hasExtraData(localSnapshot, remote)) {
          try {
            window.localStorage.setItem(
              GUEST_SNAPSHOT_KEY,
              JSON.stringify({ userId: uid, state: localSnapshot }),
            );
          } catch {}
          setGuestSnapshot(localSnapshot);
        } else {
          try {
            window.localStorage.removeItem(GUEST_SNAPSHOT_KEY);
          } catch {}
          setGuestSnapshot(null);
        }
        suppressPush.current = true;
        setSharedState(remote);
        suppressPush.current = false;

      } else {
        const chosen = hasMeaningfulData(remote) ? remote : localSnapshot;
        suppressPush.current = true;
        setSharedState(chosen);
        suppressPush.current = false;
        if (!hasMeaningfulData(remote)) await pushRemote(uid, chosen);
      }

      syncedUserId = uid;

      channel = supabase
        .channel(`study-state-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "study_state", filter: `user_id=eq.${uid}` },
          async () => {
            if (Date.now() - lastPushAtRef.current < 2500) return;
            const { data: fresh } = await fetchRemote(uid);
            if (fresh) {
              suppressPush.current = true;
              setSharedState(fresh);
              suppressPush.current = false;
            }
          }
        )
        .subscribe();
    }

    supabase.auth.getUser().then(({ data }) => handleUser(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      handleUser(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [isHydrated]);

  // Persist changes: local always; remote debounced when signed in
  useEffect(() => {
    if (!isHydrated) return;
    saveLocal(state);
    if (suppressPush.current) return;
    const uid = currentUserRef.current;
    if (!uid) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (navigator.onLine !== false) {
        lastPushAtRef.current = Date.now();
        pushRemote(uid, state).catch(() => {});
      }
    }, 600);
  }, [state, isHydrated]);

  // Retry push when we come back online
  useEffect(() => {
    function onOnline() {
      const uid = currentUserRef.current;
      if (uid && sharedState) pushRemote(uid, sharedState).catch(() => {});
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const update = useCallback((partial: Partial<State> | ((s: State) => Partial<State>)) => {
    const next = { ...(sharedState ?? emptyState()) };
    const patch = typeof partial === "function" ? partial(next) : partial;
    Object.assign(next, patch);
    setSharedState(next);
  }, []);

  const setter = <K extends keyof State>(key: K) => (value: State[K] | ((prev: State[K]) => State[K])) => {
    const prev = (sharedState ?? emptyState())[key];
    const nextVal = typeof value === "function" ? (value as (p: State[K]) => State[K])(prev) : value;
    update({ [key]: nextVal } as Partial<State>);
  };

  const mergeGuestSnapshot = useCallback(() => {
    if (!guestSnapshot) return;
    const cur = sharedState ?? emptyState();
    const rowIds = new Set(cur.rows.map((r) => r.id));
    const todoIds = new Set(cur.todos.map((t) => t.id));
    const slotIds = new Set(cur.plannerSlots.map((s) => s.id));
    const eventIds = new Set(cur.plannerEvents.map((e) => e.id));
    const sleepIds = new Set(cur.sleep.map((s) => s.id));
    const merged: State = {
      ...cur,
      rows: [...cur.rows, ...guestSnapshot.rows.filter((r) => !rowIds.has(r.id))],
      todos: [...cur.todos, ...guestSnapshot.todos.filter((t) => !todoIds.has(t.id))],
      plannerSlots: [...cur.plannerSlots, ...guestSnapshot.plannerSlots.filter((s) => !slotIds.has(s.id))],
      plannerEvents: [...cur.plannerEvents, ...guestSnapshot.plannerEvents.filter((e) => !eventIds.has(e.id))],
      sleep: [...cur.sleep, ...guestSnapshot.sleep.filter((s) => !sleepIds.has(s.id))],
      pages: [
        ...cur.pages,
        ...guestSnapshot.pages.filter((p) => !new Set(cur.pages.map((x) => x.id)).has(p.id)),
      ],

    };
    setSharedState(merged);
    if (currentUserRef.current) markMergeResolved(currentUserRef.current);
    try {
      window.localStorage.removeItem(GUEST_SNAPSHOT_KEY);
    } catch {}
    setGuestSnapshot(null);
  }, [guestSnapshot]);

  const discardGuestSnapshot = useCallback(() => {
    if (currentUserRef.current) markMergeResolved(currentUserRef.current);
    try {
      window.localStorage.removeItem(GUEST_SNAPSHOT_KEY);
    } catch {}
    setGuestSnapshot(null);
  }, []);


  return {
    ...state,
    setColumns: setter("columns"),
    setRows: setter("rows"),
    setPriorities: setter("priorities"),
    setSettings: setter("settings"),
    setSleep: setter("sleep"),
    setTodos: setter("todos"),
    setPlannerSlots: setter("plannerSlots"),
    setPlannerEvents: setter("plannerEvents"),
    setHabits: setter("habits"),
    setQuickLinks: setter("quickLinks"),
    setPages: setter("pages"),

    hydrated: isHydrated,
    userId,
    guestSnapshot,
    mergeGuestSnapshot,
    discardGuestSnapshot,
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
  return Array.from(map, ([subject, s]) => ({ subject, ...s, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 })).sort(
    (a, b) => b.total - a.total
  );
}
