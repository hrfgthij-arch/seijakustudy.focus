import { useEffect, useRef, useState } from "react";
import { openTutorial } from "@/components/Tutorial";


export type WidgetToggle = {
  id: string;
  label: string;
  emoji: string;
  on: boolean;
  onToggle: () => void;
};

/**
 * Single dropdown that holds every show/hide switch, so a widget hidden from
 * its own header can always be brought back from one predictable place.
 */
export function WidgetsMenu({ toggles }: { toggles: WidgetToggle[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:text-primary"
      >
        ⚙️ Widgets
        <span className="text-[10px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-60 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/95 p-1 shadow-lg backdrop-blur">
          {toggles.map((t) => (
            <button
              key={t.id}
              onClick={t.onToggle}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-foreground hover:bg-[color:var(--muted)]"
            >
              <span>
                {t.emoji} {t.label}
              </span>
              <span
                className={`inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${
                  t.on ? "bg-primary" : "bg-[color:var(--border)]"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full bg-white transition-transform ${
                    t.on ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          ))}
          <div className="my-1 border-t border-[color:var(--border)]" />
          <button
            onClick={() => {
              setOpen(false);
              openTutorial();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary hover:bg-primary/10"
          >
            📖 How to use this website
          </button>
        </div>

      )}
    </div>
  );
}
