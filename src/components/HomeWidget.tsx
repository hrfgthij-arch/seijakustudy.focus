import { useRef, type ReactNode } from "react";

export type HomeWidgetLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  id: string;
  label: string;
  layout: HomeWidgetLayout;
  onChange: (layout: HomeWidgetLayout) => void;
  children: ReactNode;
  className?: string;
};

/** A lightweight home widget frame with a move handle and resize corner. */
export function HomeWidget({ id, label, layout, onChange, children, className = "" }: Props) {
  const gesture = useRef<{
    kind: "move" | "resize";
    startX: number;
    startY: number;
    start: HomeWidgetLayout;
  } | null>(null);

  function begin(kind: "move" | "resize", event: React.PointerEvent<HTMLButtonElement>) {
    gesture.current = { kind, startX: event.clientX, startY: event.clientY, start: layout };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (active.kind === "move") {
      onChange({ ...layout, x: Math.max(0, active.start.x + dx), y: Math.max(0, active.start.y + dy) });
    } else {
      onChange({ ...layout, width: Math.max(220, active.start.width + dx), height: Math.max(100, active.start.height + dy) });
    }
  }

  function end(event: React.PointerEvent<HTMLButtonElement>) {
    gesture.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may release capture before pointerup on touch screens.
    }
  }

  return (
    <div
      className={`relative min-w-0 ${className}`}
      style={{ transform: `translate(${layout.x}px, ${layout.y}px)`, width: layout.width, minHeight: layout.height }}
      data-widget={id}
    >
      <button
        type="button"
        aria-label={`Move ${label}`}
        title={`Drag to move ${label}`}
        onPointerDown={(event) => begin("move", event)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="absolute right-2 top-2 z-10 hidden cursor-grab rounded-md border border-[color:var(--border)] bg-white/75 px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur hover:text-primary active:cursor-grabbing md:block"
      >
        ⠿
      </button>
      {children}
      <button
        type="button"
        aria-label={`Resize ${label}`}
        title={`Drag to resize ${label}`}
        onPointerDown={(event) => begin("resize", event)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="absolute bottom-1 right-1 hidden h-4 w-4 cursor-se-resize rounded-sm text-primary/60 hover:text-primary md:block"
      >
        ◢
      </button>
    </div>
  );
}