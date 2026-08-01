import { useState } from "react";
import { DescriptionCell } from "@/components/DescriptionCell";
import { STATUS_META, type Column, type Priority, type Row } from "@/lib/study-store";

type Props = {
  rows: Row[];
  columns: Column[];
  priorities: Priority[];
  priorityMap: Map<string, Priority>;
  updateCell: (rowId: string, colId: string, v: string) => void;
  updateDate: (rowId: string, iso: string | null) => void;
  updateDueDate: (rowId: string, iso: string | null) => void;
  updateTime: (rowId: string, t: string | null) => void;
  updatePriority: (rowId: string, pid: string | null) => void;
  cycleStatus: (rowId: string) => void;
  deleteRow: (rowId: string) => void;
};

/** Mobile view: one compact line per lesson, expandable to the full details. */
export function LessonListMobile({
  rows,
  columns,
  priorities,
  priorityMap,
  updateCell,
  updateDate,
  updateDueDate,
  updateTime,
  updatePriority,
  cycleStatus,
  deleteRow,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="p-3 md:hidden">
        <div className="rounded-xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-muted-foreground">
          No lessons here yet — add one to start your study log.
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--border)] md:hidden">
      {rows.map((row) => {
        const title = row.values[columns[0]?.id] || "Untitled";
        const sub = row.values[columns[1]?.id] || "";
        const p = row.priorityId ? priorityMap.get(row.priorityId) : null;
        const expanded = openId === row.id;
        return (
          <li key={row.id}>
            <button
              onClick={() => setOpenId(expanded ? null : row.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              aria-expanded={expanded}
            >
              <span
                aria-hidden
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: p ? p.color : "oklch(0.85 0.02 250)" }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
                {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
              </span>
              <span
                className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_META[row.status].className}`}
              >
                {STATUS_META[row.status].icon}
              </span>
              <span className="flex-shrink-0 text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
            </button>

            {expanded && (
              <div className="space-y-2 bg-[color:var(--muted)]/30 px-3 pb-3.5 pt-1">
                {columns.map((c, i) => (
                  <label key={c.id} className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.emoji} {c.label}
                    </span>
                    {c.id === "description" ? (
                      <div className="mt-0.5 rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2">
                        <DescriptionCell
                          value={row.values[c.id] ?? ""}
                          onChange={(v) => updateCell(row.id, c.id, v)}
                          placeholder={`Add ${c.label.toLowerCase()}…`}
                        />
                      </div>
                    ) : (
                      <input
                        value={row.values[c.id] ?? ""}
                        onChange={(e) => updateCell(row.id, c.id, e.target.value)}
                        placeholder={i === 0 ? "Subject name" : `Add ${c.label.toLowerCase()}…`}
                        className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/25"
                      />
                    )}
                  </label>
                ))}

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">📅 Date</span>
                    <input
                      type="date"
                      value={row.date ?? ""}
                      onChange={(e) => updateDate(row.id, e.target.value || null)}
                      className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">⏳ Due date</span>
                    <input
                      type="date"
                      value={row.dueDate ?? ""}
                      onChange={(e) => updateDueDate(row.id, e.target.value || null)}
                      className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🕒 Time</span>
                    <input
                      type="time"
                      value={row.time ?? ""}
                      onChange={(e) => updateTime(row.id, e.target.value || null)}
                      className="mt-0.5 w-full rounded-md border border-[color:var(--border)] bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">⚡ Priority</span>
                    <select
                      value={row.priorityId ?? ""}
                      onChange={(e) => updatePriority(row.id, e.target.value || null)}
                      className="mt-0.5 w-full rounded-md border bg-white px-2.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                      style={{ borderColor: p ? p.color : "var(--border)", color: p ? p.color : undefined }}
                    >
                      <option value="">—</option>
                      {priorities.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => cycleStatus(row.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${STATUS_META[row.status].className}`}
                  >
                    <span>{STATUS_META[row.status].icon}</span>
                    {STATUS_META[row.status].label}
                  </button>
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
