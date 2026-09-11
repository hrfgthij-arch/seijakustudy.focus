# Fix missing study pages and refine the Seijaku Study experience

## User-facing result
- Flashcards, Grades, and Deadlines open from the sidebar instead of showing 404.
- Each page will use the existing Seijaku Study data and visual language, with useful empty states and controls that match the rest of the app.
- The Pomodoro timer will keep its digital and minimal clock styles, with flip-clock removed from the settings and fullscreen display.
- Existing themes, stickers, planner, pages, widgets, authentication, and study-tracking behavior will remain intact.
- The workspace will receive a restrained visual polish: clearer hierarchy, more consistent surfaces, calmer spacing, improved navigation states, and better mobile presentation.

## Implementation steps
1. Add the missing `/flashcards`, `/grades`, and `/deadlines` route files with route-specific metadata and working views backed by the current study store.
2. Connect the existing sidebar navigation to those routes using typed TanStack Router links and preserve the current due-soon indicator.
3. Remove the flip-clock option and rendering path from timer settings/fullscreen display, retaining timer reset, fullscreen, themes, backgrounds, digital/minimal styles, and persisted timer preferences.
4. Add a small compatibility migration so any saved `flip` preference becomes `digital` rather than breaking an existing user’s timer.
5. Refine shared visual styling and the affected page layouts using the existing semantic theme tokens, preserving the current blue-led aesthetic, alternate themes, anime stickers, and responsive structure.
6. Verify every sidebar destination, the timer settings flow, mobile layout, and the production build; fix any route, type, or runtime errors found.

## Technical details
- Route files will be created under `src/routes/`; the generated route tree will be regenerated automatically and will not be edited manually.
- Flashcards will use the existing `decks` and card-related store types, Grades will use `grades`, and Deadlines will derive from lesson due dates and planner events.
- Timer changes will update `TimerDisplay` and its migration/default handling in `src/lib/study-store.ts`, `src/components/StudyTimer.tsx`, and `src/components/TimerFullscreen.tsx`.
- Visual changes will stay within the existing token-based system in `src/styles.css` and shared shell/page code; no new external service or data model is required.
