import { useEffect, useState } from "react";
import { useStudyStore } from "@/lib/study-store";

const EVENT = "seijaku:open-tutorial";

export function openTutorial() {
  window.dispatchEvent(new Event(EVENT));
}

const STEPS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "🌿",
    title: "Your tracker",
    body: "The home page is your lesson table. Add rows, set a status, priority and due date, and add up to eight custom columns. Search and sort live in the toolbar.",
  },
  {
    emoji: "🗓",
    title: "Planner",
    body: "Drag on any hour to create a task with a time range, notes, colour and repeats. Switch between week, day and agenda views, and tick your habits underneath.",
  },
  {
    emoji: "📄",
    title: "Pages",
    body: "Build free-form pages from blocks: headings, checklists, toggles, tables, columns and embeds. Drag the ⠿ handle to reorder, and Ctrl+Z undoes anything.",
  },
  {
    emoji: "🃏",
    title: "Flashcards",
    body: "Make decks by hand or straight from a subject's lessons, then review them with spaced repetition or test yourself in quiz mode.",
  },
  {
    emoji: "⏱",
    title: "Timer & focus",
    body: "The Pomodoro timer is resizable, has a full-screen mode and logs your focused minutes, which feed your streak and heatmap on the Progress page.",
  },
  {
    emoji: "⚙️",
    title: "Make it yours",
    body: "Settings holds themes, fonts, density, patterns, stickers and your data export. The Widgets dropdown shows or hides any panel.",
  },
];

export function Tutorial() {
  const { settings, setSettings, hydrated } = useStudyStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  useEffect(() => {
    if (hydrated && !settings.tutorialSeen) setOpen(true);
  }, [hydrated, settings.tutorialSeen]);

  if (!open) return null;
  const s = STEPS[step];

  function close() {
    setOpen(false);
    if (!settings.tutorialSeen) setSettings({ ...settings, tutorialSeen: true });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center">
      <div className="absolute inset-0 bg-black/40 animate-veil-in" onClick={close} />
      <div
        role="dialog"
        aria-label="How to use Seijaku Study"
        className="relative w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-white p-5 shadow-[var(--shadow-cute)] animate-sheet-up"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            How to use this website
          </span>
          <button onClick={close} aria-label="Close" className="text-sm text-muted-foreground hover:text-primary">
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-start gap-3">
          <span className="text-3xl animate-soft-float">{s.emoji}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        </div>

        <div className="mb-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-[color:var(--border)]"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={close}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((v) => v - 1)}
                className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (step === STEPS.length - 1 ? close() : setStep((v) => v + 1))}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "Start studying ✨" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
