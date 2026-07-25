import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

export function DescriptionCell({
  value,
  onChange,
  placeholder = "Add a description…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            onChange(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={2}
        className="w-full resize-none rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="group flex items-start gap-1.5">
      <span className={`flex-1 whitespace-pre-wrap text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
        {value || placeholder}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-0.5 flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-[color:var(--muted)] hover:text-primary group-hover:opacity-100"
        aria-label="Edit description"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
