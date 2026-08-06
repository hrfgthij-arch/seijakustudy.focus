# Seijaku Study — sidebar, undo/redo, and student features

## 1. Desktop app sidebar

A collapsible left sidebar on desktop (icon-only when collapsed, off-canvas drawer on mobile) becomes the main navigation:

Tracker · Planner · Progress · Pages · Flashcards · Grades · Deadlines · To-do · Sleep · Links · Settings

- Pages appear as an expandable group listing your custom pages with their icons, plus a "+ New page" button.
- The current route stays highlighted; the Pages group stays open when you're inside a page.
- The top bar keeps only the logo, display name, theme picker, widgets dropdown and account button — the duplicated nav links are removed.
- The "Planner" badge pill above the planner title is removed (same for other redundant section chips), so pages start with a clean title.

## 2. Undo / redo for pages and blocks

Every page edit — typing, block add/delete/duplicate, drag-reorder, table cell edits, icon/title change — is pushed onto a history stack (last 100 steps, per page, text edits coalesced so a sentence isn't 40 undos).

- Buttons in the page header plus Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.
- A small "Undone — redo" toast after each undo.
- History is in-memory (session), so it never bloats the synced data.

## 3. Pages: clean paper look

- The page editor and page list drop the themed blue/gradient canvas for a plain neutral paper surface with soft borders; text and accents still follow your theme.
- New block types: toggle/collapsible, numbered list, image, and a "columns" block (2 side-by-side stacks).
- Page extras: cover colour/gradient picker, word count, full-width toggle, duplicate page, favourite/pin to sidebar, and search across pages from the pages list.

## 4. New student features

- **Flashcards & quiz** (`/flashcards`): decks (create from scratch or generate from a lesson's rows), flip-card study mode, spaced repetition (again / hard / good / easy scheduling), and a quiz mode with score at the end.
- **Grades & GPA** (`/grades`): log test/assignment scores per subject with weights, see per-subject averages, an overall GPA/percentage, and a simple trend line.
- **Focus stats & streaks**: daily focus goal, current/longest streak, a 12-week study heatmap and small achievement badges — shown on `/progress` and summarised on the tracker.
- **Deadlines** (`/deadlines`): one countdown board pulling due dates from lessons and planner events, grouped Overdue / Today / This week / Later, with a "due soon" count badge in the sidebar.

## 5. Tutorial + polish

- A "How to use this website" entry in the Widgets dropdown opens a guided walkthrough modal (illustrated steps for tracker, planner, pages, flashcards, timer, settings) with a "don't show again" flag, auto-shown once for new users.
- Aesthetic pass: softer layered surfaces and shadows, gentle entrance animations on cards/rows, refined empty states with stickers, nicer scrollbars, and consistent spacing/typography across pages. All motion respects reduced-motion.

## Technical notes

- Store bumped to v10: `flashcardDecks`, `grades`, `focusLog`/`streak`, page `favorite`/`cover`/`fullWidth`, `settings.tutorialSeen`, new block types; migration keeps all v9 data.
- Sidebar built with the existing shadcn sidebar primitives in `src/routes/__root.tsx` + a new `src/components/AppSidebar.tsx`; widths use explicit `var(--sidebar-width)`.
- Undo/redo lives in a `usePageHistory` hook local to the pages routes — no store schema change.
- New routes: `flashcards.tsx`, `grades.tsx`, `deadlines.tsx`, each with its own head() metadata.
- Paper surface added as a `--paper` token in `src/styles.css`; no hardcoded colour classes.
