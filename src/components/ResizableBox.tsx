import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (w: number, h: number) => void;
  children: ReactNode;
  className?: string;
};

export function ResizableBox({
  width,
  height,
  minWidth = 240,
  minHeight = 110,
  maxWidth = 640,
  maxHeight = 320,
  onResize,
  children,
  className,
}: Props) {
  const [size, setSize] = useState({ w: width, h: height });
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    setSize({ w: width, h: height });
  }, [width, height]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const w = Math.min(maxWidth, Math.max(minWidth, dragRef.current.startW + dx));
      const h = Math.min(maxHeight, Math.max(minHeight, dragRef.current.startH + dy));
      setSize({ w, h });
    }
    function onUp() {
      if (dragRef.current) {
        dragRef.current = null;
        onResize?.(size.w, size.h);
        document.body.style.userSelect = "";
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [size, minWidth, minHeight, maxWidth, maxHeight, onResize]);

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ width: size.w, height: size.h }}
    >
      {children}
      <button
        aria-label="Resize"
        onMouseDown={(e) => {
          dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
          document.body.style.userSelect = "none";
        }}
        className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm text-primary/60 hover:text-primary"
        style={{
          background:
            "linear-gradient(135deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%, transparent 70%, currentColor 70%, currentColor 80%, transparent 80%)",
        }}
      />
    </div>
  );
}
