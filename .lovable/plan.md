# Blue restyle + sticker swap

## Palette (in `src/styles.css`)
Move from pink to blue-led tokens (oklch):
- Background: icy sky gradient (very light blue → soft periwinkle).
- Primary: cornflower/indigo.
- Accent: pale sky.
- Status pills:
  - Not started → slate/steel
  - In progress → sky blue
  - Done → deeper indigo with a ✓
- Shadow tint switched from pink to blue for cohesion.

## Layout — more organized
- Single centered content column: **header → summary chips → filter tabs + toolbar (one row) → table**.
- Table:
  - Fixed, intentional column widths (Subject narrow, Lesson medium, Description wide, Status + delete fixed).
  - Sticky header, subtle zebra striping, row hover with a thin left indigo accent bar.
  - Inputs get a visible resting border so cells read as real fields.
- Summary chips (Total · In progress · Done) sit in the header, right side.
- Mobile: cards get a clearer header (subject as title, status pill right), labeled fields underneath.
- Stickers move to page margins with fixed corner offsets so they never overlap the tracker; on mobile they render as a small horizontal strip above the tracker.

## Sticker set — replace all 5 current ones
Generate 7 new transparent chibi PNGs into `src/assets/`, delete the 5 old ones.

Anime:
1. **Steins;Gate — Kurisu Makise** (lab coat, red hair)
2. **Violet Evergarden — Violet** (blonde braid, brooch, letter)
3. **Otonari no Tenshi-sama — Mahiru Shiina** (silver hair, soft smile)
4. **Your Lie in April — Kaori Miyazono** (blonde wavy hair, violin)

Genshin Impact:
5. **Sandrone** (Fatui Harbinger, puppet/mechanical vibe)
6. **Skirk** (icy blue hair, sword)
7. **Navia** (blonde curls, parasol, Fontaine outfit)

All sticker-book style, transparent background, consistent line weight, blue-tinted drop shadow, gentle float animation.

## Files touched
- `src/styles.css` — blue palette + shadow/gradient tokens.
- `src/routes/index.tsx` — new sticker imports, reorganized layout, updated status classes, tighter table.
- `src/routes/__root.tsx` — small title/description tweak.
- `src/assets/` — add 7 new stickers, delete 5 old ones.

## Unchanged behavior
Add/rename/delete columns, add/edit/delete rows, tap pill to cycle status, filter tabs, localStorage persistence — all preserved.
