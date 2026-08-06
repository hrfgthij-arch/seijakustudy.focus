import { useCallback, useEffect, useRef, useState } from "react";
import type { Block } from "@/lib/study-store";

export type PageSnapshot = { title: string; icon: string; blocks: Block[] };

const LIMIT = 100;
const COALESCE_MS = 700;

/**
 * In-memory undo/redo for one page. Text edits that land within a short window
 * of each other collapse into a single history step so a sentence isn't 40
 * separate undos.
 */
export function usePageHistory(
  current: PageSnapshot | null,
  apply: (snap: PageSnapshot) => void,
) {
  const undoStack = useRef<PageSnapshot[]>([]);
  const redoStack = useRef<PageSnapshot[]>([]);
  const lastPushAt = useRef(0);
  const suppress = useRef(false);
  const [, force] = useState(0);

  const record = useCallback((prev: PageSnapshot, coalesce = false) => {
    if (suppress.current) return;
    const now = Date.now();
    if (coalesce && now - lastPushAt.current < COALESCE_MS && undoStack.current.length) {
      lastPushAt.current = now;
      redoStack.current = [];
      force((v) => v + 1);
      return;
    }
    undoStack.current = [...undoStack.current.slice(-(LIMIT - 1)), prev];
    redoStack.current = [];
    lastPushAt.current = now;
    force((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev || !current) return false;
    redoStack.current = [...redoStack.current.slice(-(LIMIT - 1)), current];
    suppress.current = true;
    apply(prev);
    setTimeout(() => (suppress.current = false), 0);
    force((v) => v + 1);
    return true;
  }, [apply, current]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next || !current) return false;
    undoStack.current = [...undoStack.current.slice(-(LIMIT - 1)), current];
    suppress.current = true;
    apply(next);
    setTimeout(() => (suppress.current = false), 0);
    force((v) => v + 1);
    return true;
  }, [apply, current]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    record,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

export function countWords(blocks: Block[]): number {
  let n = 0;
  const walk = (list: Block[]) => {
    for (const b of list) {
      n += (b.text ?? "").trim().split(/\s+/).filter(Boolean).length;
      if (b.children) walk(b.children);
      if (b.cols) b.cols.forEach(walk);
      if (b.cells) n += b.cells.flat().join(" ").trim().split(/\s+/).filter(Boolean).length;
    }
  };
  walk(blocks);
  return n;
}
