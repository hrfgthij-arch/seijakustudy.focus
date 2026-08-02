## My answers first

**Name: "Seijaku Study".** It's distinctive, matches the calm/focus mood, and your published address is already `seijakustudy.lovable.app`. "Sakura Bloom" reads more generic-cute. I'd retitle the whole site to Seijaku Study (nav, page titles, meta descriptions) and keep the soft blue aesthetic.

**Planner: multiple subjects + custom time ranges — not Google Calendar.** Google Calendar sync would need each user to connect their own Google account through an OAuth connector, only works for signed-in users, and pushes your planner into Google's data model (one event = one title, no habit ticks). Your planner data already syncs across devices through your own account, so Google adds account plumbing without adding much. Custom time ranges + multi-subject cells is fully under your control and works for guests too. (If you later want Calendar, it's best added as a one-way "export my week to Google" button rather than the source of truth.)

## What I'll build

**1. Rename to Seijaku Study**
Nav/brand, all route `head()` titles and descriptions (`index`, `progress`, `planner`, `todo`, `sleep`, `links`, `auth`), and on-page headings.

**2. Planner: custom time ranges + multi-subject cells**

- Replace the fixed 06:00–20:00 hourly rows with editable time ranges (e.g. "07:00–08:30"), stored in settings; add / rename / delete / reorder rows, with a "reset to default hours" action.
- Each cell holds multiple subject chips: type + Enter to add, ✕ to remove, plus a per-cell note. Existing single-subject slots migrate into the chip list automatically.
- If the user swtiches to a new week it shows a freash new table ready to fill.

**3. Spotify**

- Header shows only "🎧 Spotify Player" — once a playlist is loaded, the paste box and the raw code are hidden behind a small "Change" toggle, so the embed alone is visible.
- Spotify is desktop-only: removed from mobile rendering and from the mobile widgets menu.

**4. Draggable timer pill**
The running-timer pill becomes drag-and-drop anywhere on screen (pointer events, works with touch), clamped inside the viewport, position remembered locally, with a double-tap-to-recentre. Buttons stay clickable (drag only starts past a small movement threshold).

**5. Progress page = self-study planner progress only**  
Replaces the lesson-subject donuts with:

- Overall week consistency donut (habit ticks completed ÷ habit×7).
- One donut per habit for the current week, plus its streak.
- A planner-coverage stat: how many planned slots this week have subjects filled in.
- Week switcher (prev / this week / next) matching the planner's week-start setting.
The lesson calendar/day list on that page is removed.

**6. Aesthetic pass (restrained)**
Softer layered blue background with a subtle grain, one consistent card style (unified radius, border, hover lift), tighter type scale, calmer chip/badge colours, gentle transitions. No heavy animation, no clutter — stickers stay as they are, just spaced consistently.

Also fixing quietly: the hydration mismatch that logs an error on first load of the tracker page.

## 7. Drag and drop columns on the lessons table

The user can drag any column on the lessons table and rearrage it however they want.

### Technical notes

- `study-store.ts` bumps to v7: `settings.timeRanges` becomes the planner's row source, `PlannerSlot.subjects: string[]` becomes canonical (v6 `subject` migrated in), plus a local-only stored timer pill position.
- Timer pill drag lives in `StudyTimer.tsx` using pointer events; position kept in `localStorage`, not cloud state, so it doesn't churn sync.
- Progress page reads `habits` + `plannerSlots` only; `subjectStats` stays exported for the tracker sidebar.