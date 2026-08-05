import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DEFAULT_APPEARANCE,
  THEMES,
  useStudyStore,
  type Appearance,
  type ThemeId,
} from "@/lib/study-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Seijaku Study" },
      { name: "description", content: "Tune the look, feel and widgets of your Seijaku Study workspace: themes, fonts, density, stickers and data tools." },
      { property: "og:title", content: "Settings — Seijaku Study" },
      { property: "og:description", content: "Tune the look, feel and widgets of your Seijaku Study workspace: themes, fonts, density, stickers and data tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const TABS = [
  { id: "appearance", label: "Appearance", emoji: "🎨" },
  { id: "preferences", label: "Preferences", emoji: "⚙️" },
  { id: "widgets", label: "Widgets", emoji: "🧩" },
  { id: "data", label: "Data", emoji: "💾" },
  { id: "secrets", label: "Secrets", emoji: "🔮" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ACCENTS: { id: Appearance["accent"]; label: string; swatch: string }[] = [
  { id: "theme", label: "Theme default", swatch: "var(--primary)" },
  { id: "sky", label: "Sky", swatch: "oklch(0.6 0.14 230)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.62 0.17 5)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.68 0.14 70)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.55 0.18 295)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.55 0.12 165)" },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-[color:var(--border)] py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-[color:var(--border)] bg-white/80 text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on} aria-label={label}
      className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-primary" : "bg-[color:var(--border)]"}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SettingsPage() {
  const store = useStudyStore();
  const { settings, setSettings, rows, todos, plannerEvents, pages } = store;
  const [tab, setTab] = useState<TabId>("appearance");
  const [taps, setTaps] = useState(0);
  const a = settings.appearance ?? DEFAULT_APPEARANCE;

  const setA = (patch: Partial<Appearance>) => setSettings({ ...settings, appearance: { ...a, ...patch } });
  const unlocked = settings.unlocks?.secretStickers;

  function exportData() {
    const blob = new Blob([JSON.stringify({ ...store, hydrated: undefined }, (k, v) => (typeof v === "function" ? undefined : v), 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url;
    a2.download = `seijaku-study-${new Date().toISOString().slice(0, 10)}.json`;
    a2.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Settings
          </div>
          <h1 className="text-3xl font-bold text-foreground">Make it yours 🎨</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every knob here saves instantly and syncs to your account.</p>
        </header>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[color:var(--border)] bg-white/80 text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-4 shadow-[var(--shadow-cute)] backdrop-blur md:p-6 animate-pop-in" key={tab}>
          {tab === "appearance" && (
            <>
              <Row label="Theme" hint="The overall colour mood.">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSettings({ ...settings, theme: t.id as ThemeId })}
                    title={t.label}
                    aria-label={t.label}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.theme === t.id ? "border-primary" : "border-transparent"
                    }`}
                    style={{ background: t.swatch }}
                  />
                ))}
              </Row>
              <Row label="Accent" hint="Override just the highlight colour.">
                {ACCENTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setA({ accent: c.id })}
                    title={c.label}
                    aria-label={c.label}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      a.accent === c.id ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ background: c.swatch }}
                  />
                ))}
              </Row>
              <Row label="Font" hint="Headings and body typeface.">
                {(["fredoka", "quicksand", "serif", "mono"] as const).map((f) => (
                  <Chip key={f} on={a.font === f} onClick={() => setA({ font: f })}>
                    {f}
                  </Chip>
                ))}
              </Row>
              <Row label="Density" hint="Cosy breathes, compact fits more.">
                {(["cosy", "compact"] as const).map((d) => (
                  <Chip key={d} on={a.density === d} onClick={() => setA({ density: d })}>
                    {d}
                  </Chip>
                ))}
              </Row>
              <Row label="Corners" hint="How round the cards look.">
                {(["round", "soft", "sharp"] as const).map((r) => (
                  <Chip key={r} on={a.radius === r} onClick={() => setA({ radius: r })}>
                    {r}
                  </Chip>
                ))}
              </Row>
              <Row label="Background pattern" hint="A subtle texture behind everything.">
                {(["none", "dots", "grid", "stars"] as const).map((p) => (
                  <Chip key={p} on={a.pattern === p} onClick={() => setA({ pattern: p })}>
                    {p}
                  </Chip>
                ))}
              </Row>
              <Row label="Animations" hint="Fluid pops and hovers.">
                <Toggle on={a.animations} onToggle={() => setA({ animations: !a.animations })} label="Animations" />
              </Row>
            </>
          )}

          {tab === "preferences" && (
            <>
              <Row label="Display name" hint="Shown in the top bar instead of your email.">
                <input
                  value={settings.displayName ?? ""}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value || null })}
                  placeholder="Your name"
                  className="w-40 rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                />
              </Row>
              <Row label="Time format" hint="Used by the clock, planner and timer.">
                {(["12h", "24h"] as const).map((f) => (
                  <Chip key={f} on={settings.timeFormat === f} onClick={() => setSettings({ ...settings, timeFormat: f })}>
                    {f}
                  </Chip>
                ))}
              </Row>
              <Row label="Week starts on" hint="Applies to the planner and habit grid.">
                {(["sunday", "monday"] as const).map((w) => (
                  <Chip key={w} on={settings.weekStart === w} onClick={() => setSettings({ ...settings, weekStart: w })}>
                    {w}
                  </Chip>
                ))}
              </Row>
              <Row label="Lessons shown" hint="Important only, or the whole table.">
                {(["important", "all"] as const).map((v) => (
                  <Chip key={v} on={settings.lessonsView === v} onClick={() => setSettings({ ...settings, lessonsView: v })}>
                    {v}
                  </Chip>
                ))}
              </Row>
            </>
          )}

          {tab === "widgets" && (
            <>
              <Row label="To-do beside the planner" hint="Desktop only.">
                <Toggle on={settings.showPlannerTodo} onToggle={() => setSettings({ ...settings, showPlannerTodo: !settings.showPlannerTodo })} label="Planner to-do" />
              </Row>
              <Row label="Quick links table"><Toggle on={settings.showQuickLinks} onToggle={() => setSettings({ ...settings, showQuickLinks: !settings.showQuickLinks })} label="Quick links" /></Row>
              <Row label="Spotify player" hint="Desktop only."><Toggle on={settings.showSpotify} onToggle={() => setSettings({ ...settings, showSpotify: !settings.showSpotify })} label="Spotify" /></Row>
              <Row label="Sleep tracker"><Toggle on={settings.showSleep} onToggle={() => setSettings({ ...settings, showSleep: !settings.showSleep })} label="Sleep" /></Row>
              <Row label="PDF widget"><Toggle on={settings.showPdf} onToggle={() => setSettings({ ...settings, showPdf: !settings.showPdf })} label="PDF" /></Row>
              <Row label="Anime stickers" hint="The friends around the edges.">
                <Toggle on={a.stickers} onToggle={() => setA({ stickers: !a.stickers })} label="Stickers" />
              </Row>
              <Row label="Sticker pack">
                {(["all", "anime", "genshin"] as const).map((p) => (
                  <Chip key={p} on={a.stickerPack === p} onClick={() => setA({ stickerPack: p })}>
                    {p}
                  </Chip>
                ))}
                {unlocked && (
                  <Chip on={a.stickerPack === "secret"} onClick={() => setA({ stickerPack: "secret" })}>
                    ✨ secret
                  </Chip>
                )}
              </Row>
            </>
          )}

          {tab === "data" && (
            <>
              <Row label="Your stuff" hint="A quick count of everything stored.">
                <span className="text-xs font-semibold text-muted-foreground">
                  {rows.length} lessons · {plannerEvents.length} events · {todos.length} to-dos · {pages.length} pages
                </span>
              </Row>
              <Row label="Export" hint="Download a JSON backup.">
                <button onClick={exportData} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  Download backup
                </button>
              </Row>
              <Row label="Reset appearance" hint="Puts the look back to defaults.">
                <button
                  onClick={() => setSettings({ ...settings, appearance: DEFAULT_APPEARANCE })}
                  className="rounded-md border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  Reset
                </button>
              </Row>
            </>
          )}

          {tab === "secrets" && (
            <div className="py-2 text-center">
              <button
                onClick={() => {
                  const n = taps + 1;
                  setTaps(n);
                  if (n >= 5 && !unlocked) {
                    setSettings({ ...settings, unlocks: { ...settings.unlocks, secretStickers: true } });
                  }
                }}
                className="text-5xl transition-transform hover:scale-110 active:scale-95"
                aria-label="Mystery button"
              >
                {unlocked ? "🔓" : "🔮"}
              </button>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {unlocked ? "Secret sticker pack unlocked!" : "Something is hiding here…"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {unlocked
                  ? "Pick it under Widgets → Sticker pack."
                  : `Tap the orb a few more times. (${Math.min(taps, 5)}/5)`}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
