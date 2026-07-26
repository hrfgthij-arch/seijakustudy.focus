import { useEffect, useRef, useState } from "react";

/**
 * Description cell — always renders a translucent textbox so the full content
 * is visible on hover. Click to focus and edit; commits on blur or Ctrl/Cmd+Enter.
 */
export function DescriptionCell({
  value,
  onChange,
  placeholder = "Add a description…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Keep the local draft in sync with external changes when the user is not editing.
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  const active = focused || hovered;

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onBlur={() => {
        setFocused(false);
        if (draft !== value) onChange(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          ref.current?.blur();
        }
        if (e.key === "Escape") {
          setDraft(value);
          ref.current?.blur();
        }
      }}
      rows={Math.max(2, Math.min(6, draft.split("\n").length))}
      placeholder={placeholder}
      className={`w-full resize-none rounded-md border px-2 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 ${
        focused
          ? "border-primary bg-white/80 backdrop-blur ring-2 ring-primary/25"
          : active
          ? "border-[color:var(--border)] bg-white/55 backdrop-blur"
          : "border-transparent bg-white/25 backdrop-blur-sm"
      }`}
    />
  );
}
