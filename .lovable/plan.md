# Notion-ish customisation, Google Calendar sync, and a Settings hub

## 1. Custom pages ("Spaces")

A new **Pages** section in the nav where you create your own pages — Notion-inspired, but lighter and still Seijaku-shaped.

- Sidebar list of your pages: emoji icon, title, rename, duplicate, delete, drag to reorder, favourite.
- Each page is a stack of blocks. Press `/` in an empty block to open a block menu:
  - Heading 1/2/3, plain text, bullet list, numbered list, to-do checkbox
  - Quote, callout (with emoji + theme colour), divider, code, image (upload or URL), simple table
  - **Embed blocks unique to this app**: study timer, to-do list, quick links, a subject progress donut, planner-week summary
- Inline formatting: bold, italic, underline, strikethrough, highlight, link — via a small selection toolbar plus keyboard shortcuts.
- Drag-handle on hover to reorder or delete a block; Enter makes a new block, Backspace merges.
- Per-page cover image and emoji icon, plus a "full width" toggle.
- Everything saves to your account like the rest of the app, so pages follow you across devices.

Deliberately *not* Notion: no nested databases, no relations, no multi-level page tree (one flat list with favourites), no sharing/permissions.

## 2. Settings page

One explorable `/settings` page with sections (quick theme picker stays in the nav):

- **Appearance** — theme palettes, light/soft/contrast density, card corner style, background grain/gradient toggle, sticker visibility & count.
- **Time & week** — 12h/24h, week starts Sunday/Monday, default planner view (week/day/agenda).
- **Widgets** — show/hide timer, to-do, quick links, sleep, Spotify, PDF, banner (replaces the scattered menus, which keep working).
- **Lessons** — columns, max columns, priority levels editor, "important only" default.
- **Integrations** — Google Calendar connect/disconnect and sync status.
- **Data** — export everything as JSON, import back, clear local cache, sign out.
- Small discoverable extras: keyboard-shortcut sheet, and a few playful toggles (confetti on completing a task, sticker mood) to reward exploring.

## 3. Google Calendar two-way sync

Each user links **their own** Google account (not a shared one).

- "Connect Google Calendar" in Settings → Integrations opens a Google consent popup.
- Choose which calendar to sync (default: primary).
- **Pull**: Google events for the visible week appear in the planner grid with their Google colour and a small Google badge.
- **Push**: tasks you create/edit/delete in the planner are mirrored to the linked Google calendar (title, time range, description, colour, weekly/weekday repeat).
- A stored link between each planner event and its Google event id prevents duplicates; "Sync now" button plus automatic refresh when you change week.
- Conflicts resolve last-write-wins, with the timestamp shown in Settings.
- Disconnecting stops syncing and leaves existing events in place.

Note: this needs a Google OAuth client configured once for the app — I'll open the setup card when we build it.

## 4. Planner: to-do in the sidebar

- Desktop: planner becomes grid + right-hand column holding the to-do list (and a compact "today's events" list under it); collapsible.
- Mobile: to-do appears as a sheet from a button in the planner header, keeping the day view full-width.
- Checking a planner task off can optionally add it to the to-do list and vice versa (toggle in Settings).

## 5. Fluid task popups

- Replace the abrupt task dialog with a spring-eased popover that grows from the clicked cell/event on desktop, and a draggable bottom sheet on mobile.
- Events animate in/out (fade + scale), moving/resizing tweens instead of snapping, hover lift on blocks.
- Backdrop blurs gently; Esc and swipe-down close; focus is trapped and restored.
- Motion respects `prefers-reduced-motion`.

### Order of work

Pages editor → Settings page → planner sidebar + fluid popups → Google Calendar sync last (it needs the OAuth setup step).

### Technical notes

- Store → v9: `pages: Page[]` (`id, icon, title, cover, blocks: Block[], favourite, order, fullWidth, createdAt/updatedAt`), `settings.appearance`, `settings.weekStart` surfaced in settings, `settings.integrations.google`.
- Block editor built in-house with contentEditable-free controlled inputs (one component per block type) to avoid heavy dependencies and keep SSR-safe.
- Google Calendar uses the per-user App User Connector for `google_calendar`; the connection key is stored encrypted server-side and all Google API calls happen in server functions — never in the browser.
- Sync mapping stored on each `PlannerEvent` as `googleEventId` + `googleUpdatedAt`.
- Animations via CSS transitions/keyframes and a small spring utility; no new animation library.
