
## Changes

### 1. Clock + Timer widget (header)
- Remove seconds from the clock (show `HH:MM` only, keep weekday + date).
- Add a **Pomodoro-style countdown timer** next to the clock:
  - Presets: 15 / 25 / 45 min + custom input.
  - Start / Pause / Reset buttons.
  - Beeps + toast when it hits 0.
  - Styled to match the clock card (blue palette, same rounded/backdrop look).

### 2. Sticker layout polish
- Re-tune the 7 stickers so they are perfectly evenly spaced vertically on both sides (desktop `xl+`):
  - Left column: 4 stickers at ~8%, 32%, 56%, 80%.
  - Right column: 3 stickers at ~14%, 46%, 78%.
- Nudge sizes/rotations for visual balance; keep the floating animation and mobile strip untouched.

### 3. New title & description
- Replace "Your study log" → **"Study Sakura"** (or similar cute blue-themed name — final wording in build).
- New description: short, cute, planner-focused (e.g. "Track lessons, plan ahead, and see your progress bloom.").
- Update `__root.tsx` head + index route head metadata to match.

### 4. Subject progress view (circular chart)
Compute per-subject completion: `% = done rows / total rows` grouped by the first column value (Subject).

- **Desktop (`lg+`)**: Add a **left sidebar column** inside the main container showing each subject as a small SVG donut chart + subject name + `x/y` count. Sticky at top on scroll.
- **Mobile / tablet**: Add a **new route `/progress`** dedicated to the same circular charts (one per subject, grid layout), plus a link/tab in the header ("Progress").
- Layout becomes: `[Sidebar (lg+ only)] [Tracker card]` — grid with `lg:grid-cols-[220px_1fr]`.

Charts are plain SVG (stroke-dasharray donut) — no chart lib needed.

### 5. Calendar planner
- Add a **Calendar** section below the tracker (and available on the new `/progress` page too).
- Each row gets an optional `date` field (ISO string). Add a "Date" column automatically (hidden from the customizable column list — treated as a system field on the row).
- Calendar UI: month grid, click a day to see lessons planned for that day; days with lessons show a dot.
- Uses shadcn `Calendar` (already available via components.json). Store `date` on each row alongside `values` and `status`; migrate old localStorage entries gracefully (default `date: null`).

### 6. Routing
- New file `src/routes/progress.tsx` for the mobile progress page (also linkable from desktop).
- Add nav links in `__root.tsx` header: Home · Progress.
- Each route gets its own `head()` metadata.

### Files to touch
- `src/routes/index.tsx` — clock (no seconds), timer, sticker spacing, sidebar donuts, calendar, date field, title/desc.
- `src/routes/progress.tsx` — new page with per-subject donuts + calendar.
- `src/routes/__root.tsx` — nav links + updated title/meta.
- Reuse `src/components/ui/calendar.tsx` (shadcn) — add if missing.

### Data model change
```ts
type Row = {
  id: string;
  values: Record<string, string>;
  status: Status;
  date: string | null; // NEW — ISO yyyy-mm-dd
};
```
Storage key bumped to `sakura-study-tracker-v2` with one-time migration from v1.
