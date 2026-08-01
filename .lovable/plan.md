## What I'll build

### 1. Self-study planner: editable time ranges + multi-subject cells
- Add a "Time rows" editor above the weekly grid: add a row (time or range like `18:00–19:30`), edit a row's label inline, delete a row. Stored in `settings.timeRanges`, so it syncs.
- Each cell holds multiple subjects: subjects render as removable chips, with a small `+` input to add another. Backed by the existing `PlannerSlot.subjects` array (the old single `subject` stays in sync for older data).

### 2. Pomodoro timer follows you while running
- When the timer is running, it detaches into a compact, partially transparent pill pinned to the top of the viewport (below the nav) on both mobile and desktop, so it stays visible while scrolling. Click it to expand / open fullscreen. Replaces today's mobile-only sticky timer.

### 3. Right column layout
Right column order becomes: **Spotify → Quick links → lessons table**; the **to-do list** and **sleep tracker** stay in the left sidebar (to-do above, sleep below it). Every widget keeps a Hide button.

### 4. One "Widgets" dropdown for all show/hide toggles
A single `⚙️ Widgets` button in the header opens a dropdown listing every optional block with a checkbox: Banner, PDF, Sleep tracker, Quick links, Spotify, Subject progress panel, Priorities editor. This is the one place to bring anything back after hiding it (the scattered "Show quick links" buttons get removed).

### 5. Merge-data banner bugs
- The banner will only be offered once per account, tracked by a persisted `merged:<userId>` marker in local storage, and cleared on merge **or** discard — so it never reappears after a choice.
- It will also only appear when the guest snapshot actually differs from the cloud data (compares row/todo/planner/sleep IDs); identical data means no banner, which kills the "pops up for no reason" case.

### 6. Lessons table: columns and due date
- New columns append to the **right** of existing user columns as real columns — the `<colgroup>` will be generated per-column with fixed percentage widths so nothing overlaps the description column.
- Hard cap of **8** user columns; the `+ Column` button disables with a hint at the cap.
- New built-in **Due date** column (alongside the existing Date/Time/Priority/Status), stored as `row.dueDate`, with overdue dates highlighted.

### 7. Mobile lessons view = collapsible list
On phones, each lesson renders as one compact row (subject · status dot · priority · due date) with a chevron; tapping expands it to reveal all columns, date, time, priority, status and delete. Collapsed by default.

### 8. Header shows a display name, not the email
- Add `settings.displayName`. The nav shows the name if set, otherwise nothing.
- The Widgets dropdown (and a small edit affordance next to the name) lets the user type/change their display name.

### 9. Spotify widget accepts codes
Input accepts and normalizes: full share URLs, `spotify:` URIs, a bare ID with a type picker, **and a pasted `<iframe …>` embed snippet** — the `src` is extracted and used. Invalid input shows a clear inline hint instead of an empty box.

### 10. Timer background customization
Timer settings gain a background picker: a set of gradient/solid presets, a custom color, or an image URL, plus an opacity slider. Applies to the widget, the sticky pill and fullscreen mode; stored in `settings.timerDisplay.background`.

### 11. Removed
The left-sidebar progress/donut panel is dropped from the desktop home page (the `/progress` page keeps it). Its space goes to the to-do list and sleep tracker.

## Technical notes
- `src/lib/study-store.ts`: bump to v6 — add `Row.dueDate`, `Settings.displayName`, `TimerDisplay.background`, `MAX_COLUMNS = 8`; rework merge gating with a per-user merged marker + snapshot diff.
- New: `src/components/WidgetsMenu.tsx`, `src/components/StickyTimerBar.tsx`, `src/components/LessonListMobile.tsx`.
- Edited: `src/routes/index.tsx` (layout, colgroup, due date, mobile list), `src/routes/planner.tsx` (time-range editor, multi-subject cells), `src/components/StudyTimer.tsx` + `TimerFullscreen.tsx` (background + sticky), `src/components/SpotifyPlayer.tsx` (code parsing), `src/routes/__root.tsx` (display name).
- No database migration needed — everything lives in the existing synced JSON state, with normalization defaults so existing saved data keeps working.
