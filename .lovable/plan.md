# Fix bugs and add requested features

## Bugs to fix

### 1. "Plan your days…" tagline duplicates atop the Description column
Cause: the header row and the lessons table both share the same responsive grid parent. When the viewport shrinks or a column is added the header block collapses into the same column track and stacks on top of the Description column.
Fix in `src/routes/index.tsx`: move the tagline block out of the responsive grid into its own full-width `<div>` above the `grid lg:grid-cols-[240px_1fr]` wrapper, and give the tagline `col-span-full` fallback. No content change to the text itself.

### 2. Typing anywhere causes visible "glitch" (input flicker / caret jump)
Cause: `useStudyStore` recreates a new `state` object on every keystroke, which pushes to every listener; each edit also runs the debounced cloud push. On slower devices this re-renders the whole page and steals focus. Two fixes:
- Debounce cell writes locally: `DescriptionCell` and text-cell inputs keep a local `draft` and only call `setRows` on blur / Ctrl+Enter (already true for description — extend to every editable cell in `index.tsx`, `planner.tsx`, `todo.tsx`, `SleepTracker`).
- Split shared state re-renders: give `useStudyStore` a `useSyncExternalStore` selector variant `useStudyStoreSlice(fn)` so components subscribe only to the slice they read. Callers that mutate use a stable `store.set*` returned from a ref, not a re-created closure.

### 3. Description editor UX
`DescriptionCell` becomes:
- Hover → text turns into a translucent textbox (readonly) previewing the full text.
- Click → same textbox becomes editable, autofocused, caret at end, shows everything entered (auto-grow with `field-sizing: content` fallback to rows).
- Style: `bg-white/40 backdrop-blur border-white/60` when hovered, `bg-white/70` when focused.

## Feature changes

### 4. Self-Study Planner — multi-subject cells and custom time ranges
- Change `PlannerSlot` in `study-store.ts` from one subject per `weekday|time` to `subjects: string[]` (array) plus keep `note`.
- Add editable `timeRanges: string[]` on `settings` (default the current 06:00–20:00 hourly list). Settings UI in `planner.tsx`: add / remove / rename a range (e.g. `07:30–09:00`).
- Cell UI: chip list with `+ subject` inline input; Enter appends, × removes.

### 5. Pomodoro timer — sticky on mobile, translucent, full-screen mode
- Wrap the existing `StudyTimer` in a new `MobileStickyTimer` that, on `<lg` widths and only while `running`, renders a `position: fixed; bottom: 12px; right: 12px` translucent card (`bg-white/55 backdrop-blur`) that persists across scroll. Hidden when not running.
- All timer surfaces get `bg-white/70 backdrop-blur` (partially transparent).
- Add a ⛶ fullscreen button on the timer. Clicking opens a new `TimerFullscreen` overlay (portal, `fixed inset-0 z-50`) that by default shows the giant clock + timer. A `⋮` menu in the corner opens a settings panel:
  - Theme: Light / Dark
  - Clock style: Digital / Flip clock / Minimal
  - Show seconds: on/off
  - Show date: on/off
  - Show timer: on/off
- Persist these in `settings.timerDisplay`.

### 6. Lessons — show only important by default
- Add `settings.lessonsView: "important" | "all"` (default `important`).
- "Important" = rows whose `priorityId` is `urgent` or `high`, OR status = `progress`. If none match, fall back to first 5.
- Add a ⚙️ button on the lessons toolbar opening a small popover: toggle All/Important, plus a multi-select of which priorities count as important.

### 7. Quick Links
- New `quickLinks: { id, label, url, icon? }[]` on state.
- Desktop: new `QuickLinksTable` component; render in the right column above the lessons table with a "Hide" toggle (`settings.showQuickLinks`, default true). Reveal via a small "Show quick links" button when hidden.
- Mobile: add `src/routes/links.tsx` route + a "🔗 Links" chip in the header.
- Table columns: Label · URL (click to open in new tab) · ✎ · 🗑. Add-row inline form at the bottom.

### 8. Sleep tracker — weekly table near clock
- Replace `SleepTracker` box UI with a compact 7-row table (`Day | Sleep time | Wake time | Hours | Note`). Hours is auto-calculated from times (handles crossing midnight).
- Move it into the header cluster next to `ClockWidget` / `StudyTimer` (same wrap container). Still gated by `settings.showSleep`.
- Data model: extend `SleepEntry` with `sleepTime: string | null`, `wakeTime: string | null`. Existing `hours` remains derived/manual. Migration in `normalizeState`.

## Technical notes

- Store version bump to v5 in `study-store.ts`; migrate v4 → v5 preserving all fields, defaulting new ones (`timeRanges`, `lessonsView`, `showQuickLinks`, `quickLinks`, `timerDisplay`, `PlannerSlot.subjects` from prior single `subject`).
- New files: `src/components/QuickLinksTable.tsx`, `src/components/TimerFullscreen.tsx`, `src/components/MobileStickyTimer.tsx`, `src/routes/links.tsx`.
- Edited files: `src/lib/study-store.ts`, `src/components/DescriptionCell.tsx`, `src/components/StudyTimer.tsx`, `src/components/SleepTracker.tsx`, `src/routes/index.tsx`, `src/routes/planner.tsx`, `src/routes/__root.tsx` (nav link for Links on mobile).
- No backend/schema changes required — state is a JSON blob in `study_state.data`.
- Verification: run build, then Playwright the preview at mobile + desktop viewports to confirm no duplicated tagline, no input flicker, sticky timer while running, fullscreen overlay opens, quick links table renders and hides, sleep table sits beside the clock.
