## 1. Planner: full-day grid, no custom ranges

- Replace editable time-range rows with a fixed 24-row day grid: **12 AM → 11 PM** (every hour of the day).
- Remove "Edit time ranges", "+ Row" and "Reset hours"; existing planned subjects are mapped onto the matching hour row so nothing is lost.
- The grid scrolls vertically inside the card and defaults its scroll to ~7 AM so the useful part of the day is visible immediately.
- A **12h / 24h toggle** in the planner header (and respected everywhere times show: planner, lessons table, sleep tracker, clock). Saved per user, default 12h.

## 2. Google-Calendar-style tasks in the planner

Clicking a cell (or "+ Task") opens an event editor with:

- Title
- Start and end time (so a task can span multiple hours, e.g. 7:00–8:30)
- Date / day of the week
- Description / notes
- Colour label (a small palette, like Calendar's event colours)
- All-day toggle
- Repeat: none / every week / weekdays
- Mark as done

Calendar-like behaviours users actually like, added here:

- Events render as coloured blocks spanning their duration, not one-line chips.
- **"Today" button + red current-time line** across the grid.
- **Week / Day / Agenda views** — Week on desktop, Day + Agenda list on mobile.
- Click an event to edit, drag-free resize handled through the editor for reliability.
- Overlapping events sit side by side in the same hour.
- Quick-add: type a title in a cell and press Enter to create a 1-hour event.
- Weekly repeats appear automatically on every future week.

The habit consistency table stays below, unchanged.

## 3. Mobile optimisation

- Correct viewport/scale so nothing renders zoomed-out or clipped.
- Fluid type scale and tighter spacing under 640px; no horizontal page scroll anywhere.
- Header, toolbars, and widget rows switch to the grid pattern that survives narrow widths (text truncates, icons stay fixed).
- Stickers scale down and reposition so they never overlap content or crop.
- Planner and lessons use list/agenda layouts on phones instead of wide tables.
- Timer pill, dialogs, and menus sized for touch (min 44px targets).

## 4. Themes

A theme picker (in the widgets/settings menu) with several palettes:

- **Seijaku Blue** (default), **Sakura Pink**, **Crimson Red**, **Matcha Green**, **Lavender**, **Midnight Dark**.

Each theme retints background, cards, primary, accents, chips, and the planner event colours. Choice is saved with the user's account so it follows them across devices.

## 5. Aesthetic pass

- Unified card style (radius, border, soft shadow, hover lift) across every page.
- Calmer, more consistent chips/badges tied to the active theme.
- Softer layered background gradient + subtle grain per theme.
- Gentler transitions; no added clutter.

### Order of work

Planner (1 + 2) first and finished completely, then mobile scaling, then themes and the aesthetic pass.

### Technical notes

- `study-store.ts` → v8: `settings.timeFormat: "12h" | "24h"`, `settings.theme`, and a new `PlannerEvent` type (`id, week, weekday, start, end, title, description, color, allDay, repeat, done`). v7 `PlannerSlot` subjects migrate into single-hour events. `timeRanges` is dropped from the UI but kept in the type for safe migration.
- Themes implemented as `[data-theme="..."]` blocks in `src/styles.css` overriding the existing oklch tokens; `data-theme` set on `<html>` from settings. No hardcoded colours in components.
