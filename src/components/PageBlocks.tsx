import { useRef, useState } from "react";
import { BLOCK_MENU, emptyBlock, type Block, type BlockType } from "@/lib/study-store";

/** Grow a textarea to fit its content so text never scrolls inside a block. */
function AutoText({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function fit(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        fit(el);
      }}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        fit(e.currentTarget);
        onChange(e.target.value);
      }}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground/50 ${className ?? ""}`}
    />
  );
}

const CALLOUT_TINT: Record<string, string> = {
  blue: "oklch(0.58 0.15 258)",
  pink: "oklch(0.68 0.15 355)",
  green: "oklch(0.58 0.13 155)",
  amber: "oklch(0.72 0.15 65)",
  purple: "oklch(0.55 0.16 300)",
};

function spotifyEmbed(raw: string) {
  const m = /(?:open\.spotify\.com\/(?:embed\/)?)([a-z]+)\/([a-zA-Z0-9]+)/.exec(raw ?? "");
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
}

export function BlockView({
  block,
  onChange,
  index = 1,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  index?: number;
}) {
  const set = (patch: Partial<Block>) => onChange(patch);

  switch (block.type) {
    case "h1":
      return <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Heading 1" className="text-2xl font-bold text-foreground sm:text-3xl" />;
    case "h2":
      return <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Heading 2" className="text-xl font-bold text-foreground sm:text-2xl" />;
    case "h3":
      return <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Heading 3" className="text-base font-bold text-foreground sm:text-lg" />;
    case "text":
      return <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Write something…" className="text-sm leading-relaxed text-foreground" />;
    case "bullet":
      return (
        <div className="flex gap-2">
          <span className="mt-1 select-none text-primary">•</span>
          <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="List item" className="text-sm leading-relaxed text-foreground" />
        </div>
      );
    case "numbered":
      return (
        <div className="flex gap-2">
          <span className="mt-0.5 w-5 shrink-0 select-none text-right text-sm font-semibold text-primary">{index}.</span>
          <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="List item" className="text-sm leading-relaxed text-foreground" />
        </div>
      );
    case "toggle":
      return (
        <div>
          <div className="flex gap-2">
            <button
              onClick={() => set({ open: !block.open })}
              aria-label={block.open ? "Collapse" : "Expand"}
              className="mt-0.5 select-none text-xs text-muted-foreground hover:text-primary"
            >
              {block.open ? "▾" : "▸"}
            </button>
            <AutoText
              value={block.text}
              onChange={(text) => set({ text })}
              placeholder="Toggle title"
              className="text-sm font-semibold leading-relaxed text-foreground"
            />
          </div>
          {block.open && (
            <div className="ml-4 mt-1 border-l border-[color:var(--border)] pl-3">
              <BlockList blocks={block.children ?? []} onChange={(children) => set({ children })} nested />
            </div>
          )}
        </div>
      );
    case "columns": {
      const cols = block.cols ?? [[], []];
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {cols.map((col, i) => (
            <div key={i} className="rounded-xl border border-dashed border-[color:var(--border)] p-2">
              <BlockList
                blocks={col}
                nested
                onChange={(next) => set({ cols: cols.map((c, j) => (i === j ? next : c)) })}
              />
            </div>
          ))}
        </div>
      );
    }

    case "todo":
      return (
        <div className="flex gap-2">
          <input
            type="checkbox"
            checked={!!block.checked}
            onChange={(e) => set({ checked: e.target.checked })}
            className="mt-1 h-4 w-4 shrink-0 accent-primary"
          />
          <AutoText
            value={block.text}
            onChange={(text) => set({ text })}
            placeholder="To-do"
            className={`text-sm leading-relaxed ${block.checked ? "text-muted-foreground line-through" : "text-foreground"}`}
          />
        </div>
      );
    case "quote":
      return (
        <div className="border-l-4 border-primary/60 pl-3">
          <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Quote" className="text-sm italic leading-relaxed text-muted-foreground" />
        </div>
      );
    case "callout": {
      const tint = CALLOUT_TINT[block.color ?? "blue"] ?? CALLOUT_TINT.blue;
      return (
        <div
          className="flex gap-2 rounded-xl border p-3"
          style={{ borderColor: `color-mix(in oklab, ${tint} 35%, transparent)`, background: `color-mix(in oklab, ${tint} 10%, transparent)` }}
        >
          <input
            value={block.emoji ?? "💡"}
            onChange={(e) => set({ emoji: e.target.value.slice(0, 2) })}
            className="h-6 w-7 shrink-0 rounded bg-transparent text-center text-base outline-none"
            aria-label="Callout emoji"
          />
          <AutoText value={block.text} onChange={(text) => set({ text })} placeholder="Callout…" className="text-sm leading-relaxed text-foreground" />
          <select
            value={block.color ?? "blue"}
            onChange={(e) => set({ color: e.target.value })}
            className="h-6 shrink-0 rounded bg-transparent text-[10px] font-semibold text-muted-foreground outline-none"
            aria-label="Callout colour"
          >
            {Object.keys(CALLOUT_TINT).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "code":
      return (
        <AutoText
          value={block.text}
          onChange={(text) => set({ text })}
          placeholder="const cute = true"
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--muted)] p-3 font-mono text-xs text-foreground"
        />
      );
    case "divider":
      return <hr className="my-2 border-t border-[color:var(--border)]" />;
    case "link":
      return (
        <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3">
          <input
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="Link title"
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <input
            value={block.url ?? ""}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="https://…"
            className="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
          {block.url && (
            <a href={block.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] font-semibold text-primary hover:underline">
              Open ↗
            </a>
          )}
        </div>
      );
    case "image":
      return (
        <div className="space-y-1.5">
          <input
            value={block.url ?? ""}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="Image URL"
            className="w-full rounded-md border border-[color:var(--border)] bg-white/70 px-2 py-1 text-xs outline-none focus:border-primary"
          />
          {block.url && (
            <img src={block.url} alt={block.text || "Page image"} loading="lazy" className="max-h-80 w-full rounded-xl object-contain" />
          )}
        </div>
      );
    case "pdf":
      return (
        <div className="space-y-1.5">
          <input
            value={block.url ?? ""}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="PDF URL"
            className="w-full rounded-md border border-[color:var(--border)] bg-white/70 px-2 py-1 text-xs outline-none focus:border-primary"
          />
          {block.url && (
            <iframe src={block.url} title="PDF embed" className="h-96 w-full rounded-xl border border-[color:var(--border)]" />
          )}
        </div>
      );
    case "spotify": {
      const src = spotifyEmbed(block.url ?? "");
      return (
        <div className="space-y-1.5">
          <input
            value={block.url ?? ""}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="Spotify link or embed code"
            className="w-full rounded-md border border-[color:var(--border)] bg-white/70 px-2 py-1 text-xs outline-none focus:border-primary"
          />
          {src && <iframe src={src} title="Spotify" loading="lazy" className="h-40 w-full rounded-xl border-0" allow="encrypted-media" />}
        </div>
      );
    }
    case "table": {
      const cells = block.cells ?? [["", ""]];
      const setCell = (r: number, c: number, v: string) => {
        const next = cells.map((row) => [...row]);
        next[r][c] = v;
        set({ cells: next });
      };
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-sm">
            <tbody>
              {cells.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-[color:var(--border)] p-0">
                      <input
                        value={cell}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        className={`w-full bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-primary/5 ${r === 0 ? "font-semibold" : ""}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-1 flex gap-2 text-[11px] font-semibold text-muted-foreground">
            <button onClick={() => set({ cells: [...cells, cells[0].map(() => "")] })} className="hover:text-primary">
              + Row
            </button>
            <button onClick={() => set({ cells: cells.map((r) => [...r, ""]) })} className="hover:text-primary">
              + Column
            </button>
            {cells.length > 1 && (
              <button onClick={() => set({ cells: cells.slice(0, -1) })} className="hover:text-destructive">
                − Row
              </button>
            )}
            {cells[0].length > 1 && (
              <button onClick={() => set({ cells: cells.map((r) => r.slice(0, -1)) })} className="hover:text-destructive">
                − Column
              </button>
            )}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export function AddBlockMenu({ onAdd, label = "+ Add a block" }: { onAdd: (type: BlockType) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
      >
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-white p-1 shadow-lg animate-pop-in">
            {BLOCK_MENU.map((m) => (
              <button
                key={m.type}
                onClick={() => {
                  onAdd(m.type);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[color:var(--muted)]"
              >
                <span className="mt-0.5 w-6 shrink-0 text-center text-xs font-bold text-primary">{m.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">{m.label}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Full editable block list with drag-reorder, duplicate and delete. */
export function BlockList({
  blocks,
  onChange,
  nested = false,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
  nested?: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  function patch(id: string, p: Partial<Block>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }
  function remove(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function duplicate(id: string) {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = { ...blocks[i], id: Math.random().toString(36).slice(2, 10) };
    onChange([...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)]);
  }
  function insertAfter(id: string | null, type: BlockType) {
    const nb = emptyBlock(type);
    if (!id) return onChange([...blocks, nb]);
    const i = blocks.findIndex((b) => b.id === id);
    onChange([...blocks.slice(0, i + 1), nb, ...blocks.slice(i + 1)]);
  }
  function drop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragId);
    const to = blocks.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragId(null);
  }

  return (
    <div className="space-y-1">
      {blocks.map((b, i) => (
        <div
          key={b.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop(b.id)}
          className={`group relative rounded-lg px-1 py-1 transition-colors hover:bg-[color:var(--muted)]/50 ${
            dragId === b.id ? "opacity-40" : ""
          }`}
        >
          <div className="flex items-start gap-1.5">
            <span
              draggable
              onDragStart={() => setDragId(b.id)}
              onDragEnd={() => setDragId(null)}
              title="Drag to reorder"
              className="mt-1.5 cursor-grab select-none px-1 text-xs text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            >
              ⠿
            </span>
            <div className="min-w-0 flex-1">
              <BlockView
                block={b}
                index={blocks.slice(0, i + 1).filter((x) => x.type === "numbered").length}
                onChange={(p) => patch(b.id, p)}
              />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => insertAfter(b.id, "text")} title="Add block below" className="rounded px-1 text-xs text-muted-foreground hover:text-primary">
                +
              </button>
              <button onClick={() => duplicate(b.id)} title="Duplicate" className="rounded px-1 text-xs text-muted-foreground hover:text-primary">
                ⧉
              </button>
              <button onClick={() => remove(b.id)} title="Delete" className="rounded px-1 text-xs text-muted-foreground hover:text-destructive">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className={nested ? "pt-1" : "pt-2"}>
        <AddBlockMenu onAdd={(t) => insertAfter(null, t)} label={nested ? "+ Block" : "+ Add a block"} />
      </div>
    </div>
  );
}
