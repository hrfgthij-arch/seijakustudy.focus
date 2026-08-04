import { useEffect, useRef, useState } from "react";
import {
  PAGE_WIDGETS,
  newBlock,
  uid,
  useStudyStore,
  subjectStats,
  formatMinutes,
  eventColorCss,
  type Block,
  type BlockType,
  type Page,
} from "@/lib/study-store";
import { Donut } from "@/components/Donut";
import { StudyTimer } from "@/components/StudyTimer";
import { TodoList } from "@/components/TodoList";

const BLOCK_MENU: { type: BlockType; label: string; hint: string; emoji: string }[] = [
  { type: "text", label: "Text", hint: "Plain paragraph", emoji: "¶" },
  { type: "h1", label: "Heading 1", hint: "Big section title", emoji: "H1" },
  { type: "h2", label: "Heading 2", hint: "Medium title", emoji: "H2" },
  { type: "h3", label: "Heading 3", hint: "Small title", emoji: "H3" },
  { type: "bullet", label: "Bullet list", hint: "A simple list", emoji: "•" },
  { type: "todo", label: "To-do", hint: "Checkbox item", emoji: "☑" },
  { type: "quote", label: "Quote", hint: "Highlighted line", emoji: "❝" },
  { type: "callout", label: "Callout", hint: "Boxed note", emoji: "💡" },
  { type: "divider", label: "Divider", hint: "Section break", emoji: "—" },
  { type: "image", label: "Image", hint: "Paste an image link", emoji: "🖼" },
  { type: "widget", label: "Widget", hint: "Embed a Seijaku widget", emoji: "🧩" },
];

function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={`w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/50 ${className ?? ""}`}
    />
  );
}

function WidgetBlock({ id }: { id: string }) {
  const { rows, plannerEvents, quickLinks, settings } = useStudyStore();

  if (id === "timer") return <StudyTimer />;
  if (id === "todos") return <TodoList compact />;
  if (id === "quicklinks")
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-4">
        <h3 className="mb-2 text-sm font-bold text-foreground">🔗 Quick links</h3>
        {quickLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No links saved yet.</p>
        ) : (
          <ul className="space-y-1">
            {quickLinks.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {l.icon ?? "🔗"} {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  if (id === "progress") {
    const stats = subjectStats(rows).slice(0, 4);
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-4">
        <h3 className="mb-3 text-sm font-bold text-foreground">🍩 Subject progress</h3>
        {stats.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add lessons to see progress.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {stats.map((s) => (
              <div key={s.subject} className="flex flex-col items-center gap-1">
                <Donut pct={s.pct} size={62} />
                <span className="max-w-[80px] truncate text-[11px] font-semibold text-muted-foreground">{s.subject}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (id === "today") {
    const weekday = new Date().getDay();
    const items = plannerEvents
      .filter((e) => e.weekday === weekday)
      .sort((a, b) => a.start - b.start)
      .slice(0, 6);
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-4">
        <h3 className="mb-2 text-sm font-bold text-foreground">🗓️ Today's plan</h3>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing planned for today.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-xs">
                <span className="h-4 w-1 rounded-full" style={{ background: eventColorCss(e.color) }} />
                <span className={`flex-1 truncate ${e.done ? "line-through opacity-60" : "text-foreground"}`}>{e.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {e.allDay ? "All day" : formatMinutes(e.start, settings.timeFormat)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return <p className="text-xs text-muted-foreground">Unknown widget.</p>;
}

export function PageBlockEditor({ page, onChange }: { page: Page; onChange: (p: Page) => void }) {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  function patch(p: Partial<Page>) {
    onChange({ ...page, ...p, updatedAt: new Date().toISOString() });
  }
  function setBlocks(next: Block[]) {
    patch({ blocks: next.length ? next : [newBlock("text", "")] });
  }
  function updateBlock(id: string, p: Partial<Block>) {
    setBlocks(page.blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }
  function insertAfter(id: string, type: BlockType = "text") {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const next = [...page.blocks];
    next.splice(idx + 1, 0, newBlock(type, ""));
    setBlocks(next);
  }
  function removeBlock(id: string) {
    setBlocks(page.blocks.filter((b) => b.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const to = idx + dir;
    if (to < 0 || to >= page.blocks.length) return;
    const next = [...page.blocks];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    setBlocks(next);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>, block: Block) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertAfter(block.id, block.type === "bullet" || block.type === "todo" ? block.type : "text");
    }
    if (e.key === "Backspace" && block.text === "" && page.blocks.length > 1) {
      e.preventDefault();
      removeBlock(block.id);
    }
    if (e.key === "/" && block.text === "") {
      setMenuFor(block.id);
    }
  }

  return (
    <div className="animate-[fadeSlide_.28s_ease-out]">
      {page.cover && (
        <div
          className="mb-4 h-32 w-full rounded-2xl bg-cover bg-center sm:h-44"
          style={{ backgroundImage: `url(${page.cover})` }}
        />
      )}
      <div className="mb-4 flex items-start gap-2">
        <button
          onClick={() => {
            const icon = window.prompt("Page emoji", page.icon);
            if (icon) patch({ icon });
          }}
          className="rounded-xl px-1 text-3xl transition-transform hover:scale-110"
          title="Change icon"
        >
          {page.icon}
        </button>
        <input
          value={page.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Untitled"
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-3xl"
        />
      </div>

      <div className="space-y-1">
        {page.blocks.map((block) => (
          <div key={block.id} className="group relative flex items-start gap-1.5">
            <div className="flex shrink-0 flex-col items-center pt-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                onClick={() => setMenuFor(menuFor === block.id ? null : block.id)}
                className="rounded px-1 text-[11px] text-muted-foreground hover:text-primary"
                title="Change block type"
              >
                ⋮⋮
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {block.type === "divider" ? (
                <hr className="my-3 border-[color:var(--border)]" />
              ) : block.type === "image" ? (
                <div>
                  {block.src ? (
                    <img src={block.src} alt={block.text || "Page image"} className="max-h-80 rounded-xl object-contain" />
                  ) : null}
                  <input
                    value={block.src ?? ""}
                    onChange={(e) => updateBlock(block.id, { src: e.target.value })}
                    placeholder="Paste an image URL…"
                    className="mt-1 w-full rounded-lg border border-dashed border-[color:var(--border)] bg-white/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              ) : block.type === "widget" ? (
                <div>
                  {block.src ? (
                    <WidgetBlock id={block.src} />
                  ) : (
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-[color:var(--border)] p-3">
                      {PAGE_WIDGETS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => updateBlock(block.id, { src: w.id })}
                          className="rounded-full border border-[color:var(--border)] bg-white px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary"
                        >
                          {w.emoji} {w.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : block.type === "todo" ? (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={!!block.checked}
                    onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                    className="mt-1.5 h-4 w-4 accent-[color:var(--primary)]"
                  />
                  <AutoTextarea
                    value={block.text}
                    onChange={(v) => updateBlock(block.id, { text: v })}
                    onKeyDown={(e) => handleKey(e, block)}
                    placeholder="To-do"
                    className={`py-1 text-sm ${block.checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                  />
                </div>
              ) : block.type === "bullet" ? (
                <div className="flex items-start gap-2">
                  <span className="pt-1.5 text-primary">•</span>
                  <AutoTextarea
                    value={block.text}
                    onChange={(v) => updateBlock(block.id, { text: v })}
                    onKeyDown={(e) => handleKey(e, block)}
                    placeholder="List item"
                    className="py-1 text-sm text-foreground"
                  />
                </div>
              ) : block.type === "quote" ? (
                <div className="border-l-2 border-primary pl-3">
                  <AutoTextarea
                    value={block.text}
                    onChange={(v) => updateBlock(block.id, { text: v })}
                    onKeyDown={(e) => handleKey(e, block)}
                    placeholder="Quote"
                    className="py-1 text-sm italic text-muted-foreground"
                  />
                </div>
              ) : block.type === "callout" ? (
                <div className="flex items-start gap-2 rounded-xl border border-[color:var(--border)] bg-primary/5 px-3 py-2">
                  <span className="pt-0.5">💡</span>
                  <AutoTextarea
                    value={block.text}
                    onChange={(v) => updateBlock(block.id, { text: v })}
                    onKeyDown={(e) => handleKey(e, block)}
                    placeholder="Something worth remembering…"
                    className="text-sm text-foreground"
                  />
                </div>
              ) : (
                <AutoTextarea
                  value={block.text}
                  onChange={(v) => updateBlock(block.id, { text: v })}
                  onKeyDown={(e) => handleKey(e, block)}
                  placeholder={block.type === "text" ? "Type '/' for blocks…" : "Heading"}
                  className={
                    block.type === "h1"
                      ? "py-1 text-2xl font-bold text-foreground"
                      : block.type === "h2"
                      ? "py-1 text-xl font-bold text-foreground"
                      : block.type === "h3"
                      ? "py-1 text-base font-bold text-foreground"
                      : "py-1 text-sm text-foreground"
                  }
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => move(block.id, -1)} className="px-1 text-[11px] text-muted-foreground hover:text-primary" title="Move up">
                ↑
              </button>
              <button onClick={() => move(block.id, 1)} className="px-1 text-[11px] text-muted-foreground hover:text-primary" title="Move down">
                ↓
              </button>
              <button
                onClick={() => removeBlock(block.id)}
                className="px-1 text-[11px] text-muted-foreground hover:text-destructive"
                title="Delete block"
              >
                ✕
              </button>
            </div>

            {menuFor === block.id && (
              <div className="absolute left-6 top-8 z-30 w-56 animate-[popIn_.16s_ease-out] overflow-hidden rounded-xl border border-[color:var(--border)] bg-white p-1 shadow-xl">
                {BLOCK_MENU.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => {
                      updateBlock(block.id, { type: m.type, text: block.text.replace(/^\//, "") });
                      setMenuFor(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[color:var(--muted)]"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[color:var(--border)] text-[10px] font-bold">
                      {m.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-foreground">{m.label}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{m.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setBlocks([...page.blocks, newBlock("text", "")])}
          className="rounded-full border border-dashed border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          + Block
        </button>
        <button
          onClick={() => setBlocks([...page.blocks, { ...newBlock("widget", ""), id: uid() }])}
          className="rounded-full border border-dashed border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          + Widget
        </button>
        <button
          onClick={() => {
            const cover = window.prompt("Cover image URL (leave blank to remove)", page.cover ?? "");
            patch({ cover: cover?.trim() ? cover.trim() : null });
          }}
          className="rounded-full border border-dashed border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          🖼 Cover
        </button>
      </div>
    </div>
  );
}
