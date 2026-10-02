---
name: design-grid
description: >-
  Lay out dubizzle Egypt screens on the measured grid — container and gutters, breakpoints,
  spacing scale and spacing relationships, listing grid and list density, search-page columns,
  cards, alignment, RTL with logical properties, safe areas and overflow. Use whenever a screen
  needs a layout, when someone asks about spacing, padding, margins, columns, grid, breakpoints,
  "make it responsive", "it feels cramped / too empty", card layout, or when a design looks
  generated because of its layout.
---

# Grid and spacing — dubizzle Egypt

dubizzle is a **high-density scanning product** (`RULES.md` §0). The measured layout is the
grid; general web advice ("start with too much white space") is overridden by it.

## The measured frame (`design-kit/layout/layout.json`)

| | Value |
|---|---|
| Root | 1rem = 10px |
| Container | max **1280px** desktop, 1200px tablet; formula `width: min(100% - 2 * gutter, max); margin-inline: auto` |
| Gutter | **2.4rem**, compact **1.6rem** |
| Breakpoints | **768px is the real split** (182 media queries). Secondary: 360, 480, 950, 1280 (`RULES.md` §1) |
| Search page (desktop) | `grid-template-columns: minmax(0, 30.4rem) minmax(0, 1fr)`, gap 1.6rem — 304px filter rail + results |
| Search page (mobile) | single column; filters in a full-screen sheet |
| Results grid | **1 / 2 / 3 columns** at base / 768 / 1280, gap **1.2rem** — tighter than feels comfortable, keep it |
| Results list | gap 1.2rem mobile, 1.6rem 768+; on mobile the item carries the white background (1.2rem 1.6rem padding) |
| Card padding / radius | 1.2rem / 0.8rem desktop; 0.8rem / 0.6rem mobile (grid). List card 1.2rem radius desktop, 0.8rem mobile |
| Home category grid | 4 columns |
| Header | sticky; search field 4.8rem tall |

Exact card internals: `docs/LIVE-MEASUREMENTS.md`. Use `AdCard` / `AdListCard`, don't re-lay them out.

## Spacing

- Only `--space-1`…`--space-10` (0.4 → 6.4rem, 4px base). **`--space-4` (1.6rem) is the default.**
  No 13px, 18px, 1.5×.
- **Space shows relationship:** inside a group < between groups < between sections. A card's
  inset is smaller than the gap between cards; the gap between sections is larger again.
- Group with proximity first; add a divider, border or surface only when space can't do it.
- Use `gap` on flex/grid instead of margins on children — space never doubles or collapses.
- Vary rhythm deliberately (tight inside, larger between); uniform spacing everywhere flattens
  hierarchy.
- Name space by role in specs: inset (padding), stack (vertical gap), inline (horizontal gap),
  gutter.

## Grids in CSS

- Where the layout is measured as "N per row at breakpoint X", write exactly that:
  `repeat(3, minmax(0, 1fr))` at ≥1280 etc. `minmax(0, …)` stops a long word from blowing out a track.
- For new, unmeasured card rows: `repeat(auto-fill, minmax(min(<card-min>, 100%), 1fr))` —
  collapses to one column with no media query. `auto-fill` keeps track sizes stable when there
  are few results (`auto-fit` would stretch them).
- Add a breakpoint where the **content** breaks, not at a device width — but the measured
  breakpoints above come first.
- Content keeps its max width on wide screens; only backgrounds go full-bleed.

## Grid vs list

Use the grid when people scan by photo (home rails, similar ads); the list when they compare
price, specs, location (search results). Live offers both on search — keep that split, don't
merge them.

## Cards

- One level only — **never a card inside a card**. Separate content inside a card with space
  or a divider.
- Radius ≤1.2rem (`RULES.md`), one shadow token per card type. Grid cards are flat on live; list
  cards have `--shadow-card`.
- Real listing grids are ragged because real content is ragged — don't equalise heights by
  padding thin content.

## RTL and alignment

- Logical properties only: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`,
  `text-align: start`, `border-inline-start`, `inline-size`. `npm run check:rtl` fails a physical
  direction; a genuine exception carries `/* rtl-ok: why */`.
- `flex-direction: row` mirrors by itself under `dir="rtl"` — don't add `row-reverse` hacks.
- Mirror directional things (back/next chevrons, sliders, carousels, progress); don't mirror
  photos, logos, clocks, checkmarks. Confirm with `rtl-arabic`.
- Every edge aligns to the same start line; indent only to show subordination. The most
  important content sits top and **start** (right in Arabic).
- Focus order follows visual order — no reordering with `order` / `grid-area` against the DOM.

## Mobile specifics

- No horizontal page scroll at 320–768 except intended carousels: `min-width: 0` on flex/grid
  children, `overflow-wrap: anywhere` for user text, `max-width: 100%` on media.
- Sticky bottom bars and the Sell FAB clear the safe area:
  `padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom))` (needs `viewport-fit=cover`).
- Full-height sheets use `dvh` / `svh`, not `100vh` (see `mobile-native`).
- Mobile is not a narrower desktop: search and location are dropdowns on desktop and full pages
  on mobile (`MobileSearchPage`, `MobileLocationPage`).
- Touch targets ≥24px with spacing between neighbours; 44px for primary mobile controls.

## Check

- [ ] Container, gutters, breakpoints and column counts from `layout.json`
- [ ] Every space a `--space-*` token; inner < outer relationships hold
- [ ] No nested cards; density matches live
- [ ] Works at 320, 375, 768, 1280, 1440 with real long content; no sideways scroll
- [ ] Logical properties only; mirrors in Arabic
- [ ] Safe areas on sticky mobile bars

## Layout slop to catch

Everything boxed in identical cards · identical 3-column feature rows on product surfaces ·
nested cards · coloured side-stripe borders · centred everything · "breathing room" margins
that push results below the fold · uniform spacing with no grouping · numbered 01/02/03
sections that carry nothing · physical left/right CSS · off-scale values · content stretched
edge-to-edge on wide screens.

## Sources

Read first-hand: Impeccable `reference/layout.md`, `craft-floor.md` · Apple HIG Layout (JSON
feed) · Android window size classes and the adaptive Material codelab · MDN logical properties,
`env()` · WCAG 1.4.12 · Anthropic frontend-design. Via search only: Material 3 margins and
columns, Refactoring UI spacing, Nathan Curtis "Space in Design Systems", the auto-fill/minmax
pattern. Not read: Every Layout, NN/g on cards. Every dubizzle number above is from
`design-kit/layout/layout.json`, `RULES.md` or `docs/LIVE-MEASUREMENTS.md`.
