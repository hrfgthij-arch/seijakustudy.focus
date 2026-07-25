
## 1. Search & sort on the main lessons table
- Add a search input (filters across subject, lesson, description).
- Add sort dropdown: Subject (A→Z), Status, Date (asc/desc), Priority.
- Applied on both desktop table and mobile cards.

## 2. Hover-to-edit description
- Description cell shows text as before.
- On hover, a small pencil icon appears in the corner.
- Click pencil → cell becomes an editable textarea with Save/Cancel; blur = save.
- Same behavior on mobile cards (tap the pencil).

## 3. New page: `/planner` — Self-Study Planner
Route: `src/routes/planner.tsx`. Two stacked sections:

**a) Weekly self-study planner (with time ranges)**
- Table with columns: Subject, Topic, Day (Mon–Sun), Start time, End time, Notes.
- Add/remove rows; stored per user.
- A shadcn Calendar next to it: pick a date to plan a week in advance; selected date scopes which "week of" the planner shows. Week key = ISO week from the chosen start-of-week.

**b) Consistency tracker (week grid)**
- Rows = planner items; columns = 7 days of the current week.
- Checkboxes per day; footer shows % consistency for the week.
- Results grouped week-wise, navigable back/forward.
- Setting: **Start week on Sunday (default) or Monday**. First visit shows a one-time prompt; also editable in settings panel.

## 4. To-do list
- **Desktop (lg+):** right-side column on `/` (index) with a To-do table (text + checkbox + delete).
- **Mobile:** new page `/todo` (`src/routes/todo.tsx`), linked from a bottom nav / header link.
- Shared store; syncs to cloud.

## 5. Auth (Lovable Cloud)
Enable Lovable Cloud. Sign-in methods:
- Email + password
- Google
- Magic link (email OTP) — this covers the "unique code" ask (Supabase emails a 6-digit code / link)

Auth page at `/auth`. Guest mode remains: unauthenticated users use localStorage as today. Header shows Sign in / account menu.

## 6. Cloud data model + sync
Tables (RLS: `auth.uid() = user_id`), plus GRANTs for `authenticated`, `service_role`:
- `profiles(id, week_start)` — week_start = 'sunday' | 'monday'
- `columns(id, user_id, label, emoji, position)`
- `priorities(id, user_id, label, color, position)`
- `rows(id, user_id, values jsonb, status, date, time, priority_id, position, updated_at)`
- `planner_items(id, user_id, subject, topic, day_of_week, start_time, end_time, notes, updated_at)`
- `consistency_ticks(id, user_id, planner_item_id, week_start_date, day_of_week, done, updated_at)`
- `todos(id, user_id, text, done, position, updated_at)`
- `sleep_entries(id, user_id, date, hours, note)`
- `settings(user_id, banner_image, pdf_url, pdf_name, timer_w, timer_h, show_sleep, show_pdf, week_start)`

## 7. Realtime + offline cache
- Supabase Realtime channel per table (filtered by `user_id`) → updates local cache instantly.
- Local cache layer (`src/lib/sync-store.ts`) built on IndexedDB (via `idb-keyval`), mirrors cloud rows.
- Writes: optimistic → local cache → outbox queue → push to Supabase when online.
- `navigator.onLine` + `online`/`offline` events flush the outbox. Conflicts resolved last-write-wins by `updated_at`.

## 8. Guest → account migration
- On successful signup (first login), detect localStorage guest data.
- Show a dialog: **Keep local**, **Keep cloud**, or **Merge**.
  - Keep local: overwrite cloud with guest data (bulk upsert).
  - Keep cloud: discard local, load cloud.
  - Merge: upsert local rows into cloud by id; keep cloud rows not present locally.
- After choice, clear guest localStorage and switch to cloud store.

## Files to add
- `src/routes/auth.tsx`, `src/routes/planner.tsx`, `src/routes/todo.tsx`
- `src/components/TodoList.tsx`, `src/components/WeekPlannerTable.tsx`, `src/components/ConsistencyGrid.tsx`, `src/components/DescriptionCell.tsx`, `src/components/SearchSortBar.tsx`, `src/components/MigrateGuestDataDialog.tsx`, `src/components/AuthMenu.tsx`
- `src/lib/sync-store.ts` (unified cloud+local store replacing `useStudyStore`), `src/lib/week.ts` (week math)
- Supabase migration with all tables, RLS, grants, triggers for `updated_at`.

## Files to touch
- `src/routes/__root.tsx` (nav links, auth provider)
- `src/routes/index.tsx` (search/sort bar, hover-edit description, desktop to-do sidebar)
- `src/routes/progress.tsx` (read from new store)
- `src/lib/study-store.ts` (thin wrapper delegating to sync-store, keeps guest path)

## Validation
- Typecheck + build.
- Manual: guest add row → sign up → migrate dialog → row appears in cloud.
- Two tabs signed in as same user: change on tab A appears on tab B without refresh.
- Offline: toggle DevTools offline, add row, go online → row syncs.
- Search/sort filters both layouts. Hover pencil edits description. Planner week toggles Sun/Mon.
