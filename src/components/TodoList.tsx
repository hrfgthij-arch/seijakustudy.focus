import { useState } from "react";
import { uid, useStudyStore, type Todo } from "@/lib/study-store";

export function TodoList({ compact = false }: { compact?: boolean }) {
  const { todos, setTodos } = useStudyStore();
  const [text, setText] = useState("");

  function add() {
    const t = text.trim();
    if (!t) return;
    const item: Todo = { id: uid(), text: t, done: false, createdAt: new Date().toISOString() };
    setTodos((list) => [item, ...list]);
    setText("");
  }
  function toggle(id: string) {
    setTodos((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function remove(id: string) {
    setTodos((list) => list.filter((t) => t.id !== id));
  }

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className={`rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">📝 To-do</h2>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{remaining} left</span>
      </div>
      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Add a task…"
          className="flex-1 rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          onClick={add}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Add
        </button>
      </div>
      {todos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-4 text-center text-xs text-muted-foreground">
          Nothing to do yet 🎉
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {todos.map((t) => (
            <li key={t.id} className="group flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-[color:var(--border)]">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.text}</span>
              <button
                onClick={() => remove(t.id)}
                className="text-xs text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
