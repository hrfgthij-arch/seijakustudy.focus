Plan: Study tracker upgrades

Goal
Add a customizable priority column, optional time field per lesson, optional banner image and PDF embed, a resizable Pomodoro timer, and fix the mobile sticker cropping.

Data model changes (src/lib/study-store.ts)

- Bump localStorage key to v3 with a v2 migration.
- Add to Row: `priorityId` (string | null) and `time` (string | null, HH:MM).
- Add app-level settings: `priorities[]` (id, label, color), `bannerImage` (string | null), `pdfUrl` (string | null), and `timerSize` (width, height).
- Default priorities: Urgent, High, Medium, Low with distinct colors.
- Update seed rows and migration to fill the new fields.

New components

- ResizableBox: custom mouse-driven resize wrapper with min/max constraints and a corner handle.
- BannerUploader: file/url input to set or remove the header banner image.
- PdfWidget: file/url input plus an iframe viewer; only renders when the user enables it.
- PriorityManager: inline UI to add, rename, remove, and recolor priority levels.
- PriorityPill: dropdown/select for a row's priority.
- SleepTracker: tracks the sleep only if needed by user.

Timer changes (src/components/StudyTimer.tsx)

- Keep the existing 15/25/45 minute presets and completion beep.
- Remove inline-flex wrapper so it can fill a resizable container.
- Wrap the timer in ResizableBox in the index header and persist its size.

Header and banner (src/routes/index.tsx)

- Optional banner image above the title, hidden when none is set.
- Keep the clock; wrap the timer in the resizable container; keep summary chips.

Toolbar (src/routes/index.tsx)

- Add small buttons: "Manage priorities", "PDF viewer", "Banner image".
- Use inline panels instead of modals to avoid extra dependencies.

Table and cards

- Add a "Time" column after "Date" and a "Priority" column before "Status".
- Inputs: time picker and priority dropdown.
- Treat Date, Time, and Priority as system columns, hidden from the add/remove column flow.
- Update mobile cards to include time and priority fields.
- Show priority label and time in the calendar day list.
- Add a new table called sleep tracker which can be removed by user if not needed.

Calendar and progress page

- Display the time and priority on each lesson in the selected-day list.
- Keep the same calendar dot behavior.

Mobile stickers fix

- Reduce the mobile strip to a smaller subset (4 characters) and render them with `object-contain`.
- Use a slightly larger width/height so the full character is visible without cropping.

Progress page (src/routes/progress.tsx)

- Show time and priority on calendar day list items.

Files to touch

- src/lib/study-store.ts
- src/components/StudyTimer.tsx
- src/components/ResizableBox.tsx (new)
- src/components/BannerUploader.tsx (new)
- src/components/PdfWidget.tsx (new)
- src/components/PriorityManager.tsx (new)
- src/routes/index.tsx
- src/routes/progress.tsx
- src/routes/__root.tsx (optional global nav, if needed)

Validation

- Build the project and run the local preview to verify the timer resizes, PDF/banner toggles work, priority column and time inputs appear, and mobile stickers render correctly.