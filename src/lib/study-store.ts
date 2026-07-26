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
  priorityId: string | null;
};

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
export type PlannerSlot = {
  id: string;
  weekday: number;
  time: string;
  subject: string;
  subjects?: string[];
  note: string;
};

// Consistency: per-habit list of ISO dates ticked
export type Habit = { id: string; label: string; dates: string[] };

export type WeekStart = "sunday" | "monday";

export type QuickLink = { id: string; label: string; url: string; icon?: string };

export type TimerDisplay = {
  theme: "light" | "dark";
  style: "digital" | "flip" | "minimal";
  showSeconds: boolean;
  showDate: boolean;
  showTimer: boolean;
};

export type Settings = {
  bannerImage: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  timerSize: { w: number; h: number };
  showSleep: boolean;
  showPdf: boolean;
  weekStart: WeekStart;
  timeRanges: string[];
  lessonsView: "important" | "all";
  showQuickLinks: boolean;
  timerDisplay: TimerDisplay;
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

export const DEFAULT_TIMER_DISPLAY: TimerDisplay = {
  theme: "light",
  style: "digital",
  showSeconds: false,
  showDate: true,
  showTimer: true,
};

export const DEFAULT_SETTINGS: Settings = {
  bannerImage: null,
  pdfUrl: null,
  pdfName: null,
  timerSize: { w: 340, h: 130 },
  showSleep: false,
  showPdf: false,
  weekStart: "sunday",
  timeRanges: DEFAULT_TIME_RANGES,
  lessonsView: "important",
  showQuickLinks: true,
  timerDisplay: DEFAULT_TIMER_DISPLAY,
};

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
  habits: Habit[];
  quickLinks: QuickLink[];
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
    habits: DEFAULT_HABITS,
    quickLinks: [],
  };
}

function migrateRow(r: any): Row {
  return {
    id: r.id,
    values: r.values ?? {},
    status: r.status,
    date: r.date ?? null,
    time: r.time ?? null,
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
    weekday: s.weekday,
    time: s.time,
    subject: s.subject ?? subjects[0] ?? "",
    subjects,
    note: s.note ?? "",
  };
}

function normalizeState(parsed: any): State {
  const base = emptyState();
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
      timerDisplay: { ...base.settings.timerDisplay, ...(parsed?.settings?.timerDisplay ?? {}) },
    },
    sleep: parsed?.sleep ?? [],
    todos: parsed?.todos ?? [],
    plannerSlots: (parsed?.plannerSlots ?? []).map(migrateSlot),
    habits: parsed?.habits?.length ? parsed.habits : base.habits,
    quickLinks: Array.isArray(parsed?.quickLinks) ? parsed.quickLinks : [],
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
  { id: uid(), values: { subject: "Math", lesson: "Integrals", description: "Practice u-substitution" }, status: "progress", date: null, time: null, priorityId: "high" },
  { id: uid(), values: { subject: "Japanese", lesson: "N5 Kanji", description: "Review chapter 3" }, status: "todo", date: null, time: null, priorityId: "medium" },
  { id: uid(), values: { subject: "History", lesson: "Edo Period", description: "Notes + timeline" }, status: "done", date: null, time: null, priorityId: "low" },
];

function hasMeaningfulData(s: State) {
  return s.rows.length > 0 || s.todos.length > 0 || s.plannerSlots.length > 0 || s.sleep.length > 0;
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
  const [state, setLocalState] = useState<State>(() => sharedState ?? emptyState());
  const [isHydrated, setIsHydrated] = useState(hydrated);
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

    // Restore guest snapshot pending merge, if any
    try {
      const snapRaw = window.localStorage.getItem(GUEST_SNAPSHOT_KEY);
      if (snapRaw) setGuestSnapshot(normalizeState(JSON.parse(snapRaw)));
    } catch {}
  }, []);

  // Auth subscription — hook up cloud sync
  useEffect(() => {
    if (!isHydrated) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function handleUser(uid: string | null) {
      currentUserRef.current = uid;
      setUserId(uid);
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      if (!uid) return;

      const localSnapshot = sharedState ?? emptyState();
      const { data: remote } = await fetchRemote(uid);

      if (!remote) {
        // First time this user syncs — push local
        suppressPush.current = true;
        setSharedState(localSnapshot);
        suppressPush.current = false;
        await pushRemote(uid, localSnapshot);
      } else if (hasMeaningfulData(localSnapshot) && hasMeaningfulData(remote)) {
        // Both have data — stash guest snapshot for user to decide merge
        try {
          window.localStorage.setItem(GUEST_SNAPSHOT_KEY, JSON.stringify(localSnapshot));
        } catch {}
        setGuestSnapshot(localSnapshot);
        suppressPush.current = true;
        setSharedState(remote);
        suppressPush.current = false;
      } else {
        // Adopt whichever has data
        const chosen = hasMeaningfulData(remote) ? remote : localSnapshot;
        suppressPush.current = true;
        setSharedState(chosen);
        suppressPush.current = false;
        if (!hasMeaningfulData(remote)) await pushRemote(uid, chosen);
      }

      // Realtime subscription — skip echoes of our own recent writes so we don't
      // yank characters out of an input mid-typing.
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
    const sleepIds = new Set(cur.sleep.map((s) => s.id));
    const merged: State = {
      ...cur,
      rows: [...cur.rows, ...guestSnapshot.rows.filter((r) => !rowIds.has(r.id))],
      todos: [...cur.todos, ...guestSnapshot.todos.filter((t) => !todoIds.has(t.id))],
      plannerSlots: [...cur.plannerSlots, ...guestSnapshot.plannerSlots.filter((s) => !slotIds.has(s.id))],
      sleep: [...cur.sleep, ...guestSnapshot.sleep.filter((s) => !sleepIds.has(s.id))],
    };
    setSharedState(merged);
    try {
      window.localStorage.removeItem(GUEST_SNAPSHOT_KEY);
    } catch {}
    setGuestSnapshot(null);
  }, [guestSnapshot]);

  const discardGuestSnapshot = useCallback(() => {
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
    setHabits: setter("habits"),
    setQuickLinks: setter("quickLinks"),
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
