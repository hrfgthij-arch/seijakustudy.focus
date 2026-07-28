import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Description cell — displays a translucent single-line preview.
 * Click to open a floating, partially transparent popup with a full editable
 * textarea. Closes on outside click, blur, or Escape.
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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const width = Math.max(280, Math.min(460, r.width + 40));
    const viewportW = window.innerWidth;
    let left = r.left;
    if (left + width > viewportW - 8) left = Math.max(8, viewportW - width - 8);
    setPos({ top: r.bottom + 6, left, width });
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (popupRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      commit();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraft(value);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft, value]);

  function commit() {
    if (draft !== value) onChange(draft);
    setOpen(false);
  }

  const preview = value.trim() || placeholder;
  const isEmpty = !value.trim();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        title={value || placeholder}
        className={`block w-full truncate rounded-md border border-transparent bg-white/25 px-2 py-1.5 text-left text-sm backdrop-blur-sm transition-colors hover:border-[color:var(--border)] hover:bg-white/55 ${
          isEmpty ? "text-muted-foreground/60 italic" : "text-foreground"
        }`}
      >
        {preview}
      </button>
      {open &&
        typeof document !== "undefined" &&
        pos &&
        createPortal(
          <div
            ref={popupRef}
            className="fixed z-50 rounded-xl border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-md"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  commit();
                }
              }}
              rows={Math.max(4, Math.min(10, draft.split("\n").length + 1))}
              placeholder={placeholder}
              className="w-full resize-y rounded-md border border-white/60 bg-white/70 px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>Esc to cancel · ⌘/Ctrl+Enter to save</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit();
                }}
                className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
