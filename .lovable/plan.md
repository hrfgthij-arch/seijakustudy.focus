# Seijaku Study — Notion-style customization

Keep the current structure (tracker, planner, progress, sleep, links) and layer on a Settings hub, custom pages, a planner-side to-do list, and smoother task animations.

## 1. Settings hub (`/settings`)

One page reachable from a gear in the nav, grouped into tabs:

- **Appearance** — theme picker (existing 6 themes) plus accent tint, font choice (Fredoka / Quicksand / serif / mono), UI density (cosy / compact), corner roundness, background pattern, stickers on/off and sticker pack choice.
- **Preferences** — display name, 12h/24h, week start (Sun/Mon), default planner view, "important lessons only" default.
- **Widgets** — master list of every widget (timer, sleep, Spotify, quick links, PDF, banner, to-do) with show/hide switches; the existing Widgets dropdown stays as a shortcut.
- **Lessons** — column manager (rename/reorder/remove, 8 max) and the priority manager, moved here.
- **Data** — export JSON, import JSON, reset local data, sign-in state.
- **Fun extras** — a small "secrets" card: click the sprout logo 5 times to unlock a hidden sticker pack + confetti toast; a random daily encouragement line; an unlockable "focus streak" badge.

Everything saves into the existing settings object in the study store (bumped to v9 with defaults for the new keys) so it syncs to the account.

## 2. Custom pages (Notion-lite)

New routes: `/pages` (list of user pages, create / rename / emoji icon / delete) and `/pages/$pageId` (the editor).

A page is a list of blocks, rendered top to bottom, each added from a `+` menu and reorderable by drag:

- Heading (H1/H2/H3), paragraph text, bulleted list, checklist, quote, callout (with emoji + colour), divider, code
- Simple table (add/remove rows and columns, editable cells)
- Embeds: link card, image / sticker, PDF (reuses the PDF widget), Spotify (reuses the Spotify player)

Editing is inline and click-to-edit — no slash-command grammar, no databases, no nested pages. Each block gets a hover handle for drag, duplicate, delete. Pages appear in the nav under a "Pages" entry and are stored in the study store so they sync and work for guests.

## 3. Planner: to-do sidebar

On desktop the planner gets a right-hand column with the existing `TodoList`, sticky under the header, hideable from the Widgets dropdown. On mobile it stays on the `/todo` page (unchanged). The planner grid shrinks to accommodate it without breaking the hour rows.

## 4. Fluid task pop-ups

- Event dialog opens with a scale + fade spring transition instead of an instant swap, closes in reverse, and on mobile slides up as a sheet.
- Event blocks animate in when created, pulse gently on save, and fade out on delete.
- Hovering an event lifts it slightly with a soft shadow; the current-time line pulses.
- All motion respects `prefers-reduced-motion`.

## Technical notes

- Store `v9`: add `settings.appearance` (accent, font, density, radius, pattern, stickerPack, stickersOn), `settings.unlocks`, and a `pages: Page[]` collection with `blocks: Block[]`; migration keeps all v8 data intact.
- Appearance options apply as `data-*` attributes on `<html>` plus CSS variables in `src/styles.css` — no hardcoded colour classes.
- New files: `src/routes/settings.tsx`, `src/routes/pages.index.tsx`, `src/routes/pages.$pageId.tsx`, `src/components/blocks/*`, `src/components/SettingsSection.tsx`.
- Animations via CSS transitions/keyframes on existing components (no new animation dependency).
- Each new route gets its own `head()` metadata.
