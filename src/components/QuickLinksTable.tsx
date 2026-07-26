import { useState } from "react";
import { uid, type QuickLink } from "@/lib/study-store";

type Props = {
  links: QuickLink[];
  onChange: (l: QuickLink[]) => void;
  onHide?: () => void;
  compact?: boolean;
};

function normalizeUrl(u: string) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export function QuickLinksTable({ links, onChange, onHide, compact }: Props) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    const l = label.trim();
    const u = url.trim();
    if (!l || !u) return;
    onChange([...links, { id: uid(), label: l, url: normalizeUrl(u) }]);
    setLabel("");
    setUrl("");
  }
  function remove(id: string) {
    onChange(links.filter((x) => x.id !== id));
  }
  function update(id: string, patch: Partial<QuickLink>) {
    onChange(links.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <section className={`rounded-2xl border border-[color:var(--border)] bg-white/85 shadow-[var(--shadow-cute)] backdrop-blur ${compact ? "" : ""}`}>
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-4 py-2.5">
        <h2 className="text-sm font-bold text-foreground">🔗 Quick links</h2>
        {onHide && (
          <button onClick={onHide} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Hide
          </button>
        )}
      </div>
      <div className="p-3">
        {links.length === 0 ? (
          <p className="rounded-md border border-dashed border-[color:var(--border)] px-3 py-3 text-center text-[11px] text-muted-foreground">
            No links yet. Add your favorite study sites below.
          </p>
        ) : (
          <ul className="mb-2 divide-y divide-[color:var(--border)]/70 overflow-hidden rounded-lg border border-[color:var(--border)] bg-white/70">
            {links.map((l) => (
              <li key={l.id} className="group flex items-center gap-2 px-2.5 py-1.5 text-sm">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
                  title={l.url}
                >
                  {l.label}
                </a>
                <button
                  onClick={() => {
                    const nl = window.prompt("Label", l.label);
                    if (nl == null) return;
                    const nu = window.prompt("URL", l.url);
                    if (nu == null) return;
                    update(l.id, { label: nl.trim() || l.label, url: normalizeUrl(nu.trim() || l.url) });
                  }}
                  className="rounded px-1 text-xs text-muted-foreground opacity-0 hover:text-primary group-hover:opacity-100"
                  aria-label="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => remove(l.id)}
                  className="rounded px-1 text-xs text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-1.5">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="min-w-0 flex-1 rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="https://…"
            className="min-w-0 flex-[2] rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button
            onClick={add}
            className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
