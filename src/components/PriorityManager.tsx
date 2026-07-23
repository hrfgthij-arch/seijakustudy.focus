import { useState } from "react";
import { uid, type Priority } from "@/lib/study-store";

type Props = {
  priorities: Priority[];
  onChange: (p: Priority[]) => void;
  onClose: () => void;
};

const PALETTE = [
  "oklch(0.62 0.2 25)",
  "oklch(0.7 0.17 55)",
  "oklch(0.75 0.15 95)",
  "oklch(0.7 0.14 150)",
  "oklch(0.72 0.13 220)",
  "oklch(0.6 0.16 260)",
  "oklch(0.55 0.18 300)",
  "oklch(0.7 0.09 250)",
];

export function PriorityManager({ priorities, onChange, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  function add() {
    const v = label.trim();
    if (!v) return;
    onChange([...priorities, { id: uid(), label: v, color }]);
    setLabel("");
  }
  function remove(id: string) {
    onChange(priorities.filter((p) => p.id !== id));
  }
  function rename(id: string, v: string) {
    onChange(priorities.map((p) => (p.id === id ? { ...p, label: v } : p)));
  }
  function recolor(id: string, c: string) {
    onChange(priorities.map((p) => (p.id === id ? { ...p, color: c } : p)));
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/95 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">⚡ Priority levels</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
      </div>

      <ul className="space-y-2">
        {priorities.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5">
            <span
              className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: p.color }}
            />
            <input
              value={p.label}
              onChange={(e) => rename(p.id, e.target.value)}
              className="flex-1 rounded-md bg-transparent px-1 text-sm outline-none focus:bg-[color:var(--muted)]"
            />
            <div className="flex gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => recolor(p.id, c)}
                  aria-label="Set color"
                  className={`h-4 w-4 rounded-full border ${p.color === c ? "ring-2 ring-primary" : "border-black/10"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={() => remove(p.id)}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              aria-label="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New level (e.g. Critical)…"
          className="flex-1 rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <div className="flex gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="Pick color"
              className={`h-5 w-5 rounded-full border ${color === c ? "ring-2 ring-primary" : "border-black/10"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={add}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Add
        </button>
      </div>
    </div>
  );
}
