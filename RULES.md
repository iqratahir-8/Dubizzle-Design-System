# Design Rules — dubizzle Egypt

Constraints for generating dubizzle Egypt interfaces. These are not preferences. A value outside these sets is a defect, not a variation.

Read this before generating any screen. Run `npm run check:design <file>` after.

**Also read first, per task:**
- `PRODUCT.md` — who the product serves and what each surface must do (product/business alignment).
- `docs/DECISIONS.md` — decisions & discoveries the code won't tell you (e.g. list-card prices are charcoal, grid-card prices red). Don't re-litigate or re-break these; add to it when you learn something new.
- `docs/REFERENCES.md` — live URLs + measured values per surface (ground truth). Build a page by refreshing its live capture and verifying against its row, not from a blank file.
- After building a component, run the `token-check` skill (tokens, not literals).

---

## 0. The one-paragraph brief

dubizzle Egypt is a **high-density classifieds marketplace**. It is flat, fast, utilitarian, and red-on-white. People come to it to scan a hundred listings and leave. Every pixel serves scanning speed. It is not a SaaS landing page, not a startup homepage, not a dashboard. When in doubt, choose the denser, plainer, more boring option — that is almost always what ships.

---

## 1. Closed value sets

Anything not in these lists is wrong. Use the CSS custom property, never the literal.

### Color
Only the palette. `--red-01…07`, `--gray-00…08`, `--blue-01…09`, `--yellow-01…07`, `--green-01…06`, plus `#fff` / `#000`.

| Role | Token | Value |
|---|---|---|
| Primary / CTA / brand | `--color-primary` | `#e00000` |
| Primary hover | `--color-primary-hover` | `#ba0000` |
| Primary active | `--color-primary-active` | `#930100` |
| Links, info, secondary | `--color-secondary` | `#3a88ef` |
| Body text | `--text-primary` | `#23262a` |
| Secondary text, labels | `--text-secondary` | `#464c55` |
| Placeholder, disabled, meta | `--text-tertiary` | `#919395` |
| Page background | `--surface-page` | `#ffffff` |
| Section background | `--surface-subtle` | `#f6f6f6` |
| Muted background | `--surface-muted` | `#f0f0f0` |
| Borders | `--border-default` | `#e0e0e0` |
| Input borders | `--border-input` | `#dadbdb` |
| Success | `--color-success` | `#059e00` |
| Warning / Featured | `--color-warning` | `#ffba3c` |
| Error | `--color-error` | `#e00000` |

Red means **action or brand**. It is not a decoration. Do not tint backgrounds red for atmosphere.

**Future accents — purple, indigo, teal (user decision, 2026-09-22).** These may be used
where a design genuinely needs them: an AI or assistant surface, a data-viz series that has
run out of palette hues, a campaign or modern-look marketing page. They are **not in the
palette yet**, so using one starts the proposal workflow below, every time:
1. Use it from a named variable, never a bare literal, and log it in `docs/PROPOSALS.md`
   (`--ai-indigo #707ce9` is already open there).
2. **Ask the designer to add it to the colour tokens as both a primitive and a semantic
   token** — a primitive ramp (`--purple-01…07`, `--indigo-01…07`, `--teal-01…07`, matching
   the existing `01…07` steps) and the semantic role that uses it (e.g. `--color-ai`,
   `--chart-series-6`). Say this out loud in the response; don't just leave it in the file.
3. Once confirmed: `scripts/sync-tokens.mjs` → `npm run sync:tokens`, a `D-NNN` in
   `docs/DECISIONS.md`, and the row moves to **Adopted**.
Keep them accents. Red stays the one action colour — a purple CTA is still wrong.

### Spacing — 4px base
`--space-1` .4 · `--space-2` .8 · `--space-3` 1.2 · `--space-4` 1.6 · `--space-5` 2 · `--space-6` 2.4 · `--space-7` 3.2 · `--space-8` 4 · `--space-9` 4.8 · `--space-10` 6.4 (rem, where 1rem = 10px)

`--space-4` (16px) is the default. There is no 13px, no 18px, no 1.5x anything.

### Radius
`--radius-sm` .4 · `--radius-md` .6 (inputs, buttons) · `--radius-lg` .8 (cards) · `--radius-nav` 1 (portal side-menu items, measured) · `--radius-xl` 1.2 (dropdowns) · `--radius-pill` 2 (pills) · `--radius-full` (circles only)

**Nothing is more rounded than 1.2rem except pills and avatars.** No `rounded-2xl` cards.

### Type
Sizes: `--text-xs` 1.2 · `--text-sm` 1.4 (body default) · `--text-md` 1.6 · `--text-lg` 1.8 · `--text-xl` 2 · `--text-2xl` 2.4 · `--text-3xl` 3.2

Weights: 400 regular · 600 semibold · 700 bold. (100/300/900 exist but are effectively unused — don't reach for them.)

Line height: 1.5 body, 1.2 headings.

Font: `--font-primary` (Proxima Nova) for Latin. `--font-arabic` (GESS) for Arabic. No other *text* face — no Inter, no system-ui. (Google Fonts is allowed for one thing only: the Material Symbols **icon** font, §2 Iconography.)

### Shadow
Base set: `--shadow-card` · `--shadow-card-hover` · `--shadow-dropdown` · `--shadow-header`.
Measured on live since (2026-09-21/22): `--shadow-overlay` (header dropdowns, ad ⋯ menu),
`--shadow-filter-menu` (portal filter menus; `--shadow-menu` is the user menu's softer one), `--shadow-menu-strong` (agent ⋮ menu),
`--shadow-raised` (credits summary), `--shadow-modal` (portal confirm modals),
`--shadow-side-panel` (ad details drawer), `--shadow-control`, `--shadow-toast` (repo value).

Use a token, never a literal. A new shadow — including a **coloured glow** (below) — goes
through the proposal workflow and becomes a token before it ships.

### Gradient — open, built from our primitives

Gradients are part of this system, and **new ones are welcome for a modern look**
(user decision, 2026-09-22). Two sources:

**Measured.** Production already renders **333 gradients across 124 live captures, in
seven roles** (table below). Where one of these roles fits, use its token.

**New.** A design may make a new gradient — a hero wash, a campaign band, an AI surface,
a card sheen. Rules for a new one:
- **Mix it from palette primitives only** — `var(--red-05)`, `var(--yellow-02)`,
  `var(--blue-03)`, `var(--white)`… (and purple / indigo / teal once the designer has added
  them, §Color). No literal hex stops; `check:design` flags those.
- Keep text on it legible: check contrast against the *darkest and lightest* stop, not the
  middle (`npm run check:a11y`).
- **Once it is final, ask the designer to add it to the system** as a named token
  (`--gradient-<role>`), then log and adopt it via `docs/PROPOSALS.md`, like any new value.

| Role | Token | Where it renders |
|---|---|---|
| Status badges | `--featured-gradient` · `--elite-gradient` · `--pro-gradient` | Featured (blue), Elite (gold), Pro (red→charcoal) |
| "of the Week" ribbon | `--week-gradient` | Car / Property of the Week |
| Photo scrim | `--overlay-image-fade` | Behind slider dots and labels on a card photo |
| Rail edge fade | `--rail-fade-start` · `--rail-fade-end` | Horizontal rails fade their overflow edge rather than clipping |
| "Post your ad" CTA band | `--cta-band-home` · `--cta-band-motors` · `--cta-band-property` · `--cta-band-mobiles` | Under a results grid, tinted per vertical |
| Surface depth | `--surface-depth` | DPV specs strip — a barely-there shade, not a flat fill |
| App promo | `--app-promo-gradient` · `--app-icon-gradient` | Mobile app-download surfaces |
| Credits summary | `linear-gradient(180deg, var(--yellow-02), var(--white))` | Agency portal "Available credits" panel and Purchase Lead (repo `goldenGradient`, live 2026-09-22) |

The measured roles all carry information (a scrim keeps white text legible, an edge
fade says the rail scrolls, a badge gradient separates paid tiers). New gradients may be
there for mood as well — that's allowed now — but they should still sit behind content,
not compete with the red CTA.

### Frosted glass and coloured glows — available for a modern look

**Measured.** `backdrop-filter` renders in exactly one place on live dubizzle: the
**media-type chip** ("Video") on a card photo — `--glass-chip-bg` + `--glass-chip-blur`,
radius `0.4rem`, 63×22, in 13 captures across both verticals and both layouts. Class:
`.glass-chip`.

**Opt-in.** Glassmorphism is also available as a deliberate choice (user decision,
2026-09-17): `.glass-panel` with `--glass-panel-bg` / `--glass-panel-blur` /
`--glass-panel-border`, plus `.glass-panel--dark`. **These are authored, not measured
— production does not render them.** Don't describe a frosted panel as something
dubizzle does; it's something this system now offers.

Use it where the chip's logic holds: the backdrop is genuinely unknown — over imagery,
over a map, over content scrolling underneath. Over a known solid background it costs
a compositing layer and buys nothing; use a surface token.

**Coloured glows (future possibility, user decision 2026-09-22).** A soft glow in a
palette colour — behind a hero device, around an AI surface, under a featured card — is
allowed for a modern look. Build it from a primitive (`0 0 4rem var(--red-03)`-style), keep
it soft and behind content, never on body text, and never more than one glow per view.
It is a new shadow, so it becomes a `--glow-<role>` token through `docs/PROPOSALS.md` once
the designer confirms it.

Always ship a solid fallback. `.glass-panel` puts the blur behind `@supports` and falls
back to `--surface-page` with a real border, so the panel stays legible where
`backdrop-filter` is unsupported or disabled. Never put text on a frosted surface
without checking contrast against the *worst* backdrop it can land on, not the mock.

### New values — propose, confirm, adopt

A design may introduce a colour or a gradient the system doesn't have. That's allowed,
and it is **not** finished when the design looks right:

1. Use it — don't stall.
2. `check:design` warns and points at `docs/PROPOSALS.md`. Log it there.
3. **Say so in the response.** "This introduces a new colour `#xxxxxx` — it needs
   designer sign-off before it ships." A new value that ships unmentioned is the
   failure mode; see D-007.
4. Once the designer confirms, it becomes a token (`scripts/sync-tokens.mjs` →
   `npm run sync:tokens`), gets a `D-NNN` in `docs/DECISIONS.md`, and moves to
   **Adopted** in `PROPOSALS.md`.

Keep provenance straight: **measured** (verified on live) · **adopted** (designer
authored and confirmed) · **proposed** (in a design, unconfirmed). Never call an
adopted or proposed value something dubizzle "uses".

### Breakpoints
768px is the real split. `max-width: 768px` = mobile, `min-width: 768px` = desktop. Secondary: 360, 480, 950, 1280.

---

## 2. Forbidden — the AI slop list

Each of these is a tell that a screen was generated rather than designed.
(Gradients, glassmorphism, coloured glows, purple / indigo / teal and centred marketing
heroes used to be on this list. They are **not forbidden any more** — see §1 and §2a for
how to use them.)

**Color and surface**
- ✗ Colour from literals. Every colour — including a new gradient stop or a glow — comes from a token.
- ✗ A purple, indigo or teal **CTA**. Those are accents; red stays the one action colour.
- ✗ Gradient or glow on body text, or behind dense listing content where it costs legibility.
- ✗ Dark mode. dubizzle EG web has none. Do not invent one.
- ✗ Neon: saturated, hard-edged glows or several glows fighting in one view.

**Shape and depth**
- ✗ Border radius above 1.2rem on anything that isn't a pill or avatar
- ✗ Shadows heavier than `--shadow-card-hover`
- ✗ Nested cards — a card inside a card inside a card
- ✗ Decorative borders, double borders, dashed borders

**Motion**
- ✗ `transform: scale()` on hover. Cards do not grow.
- ✗ Bounce, spring, elastic easing
- ✗ Entrance animations, fade-ins, staggered reveals, skeleton shimmer that isn't the real loading card
- ✓ Permitted: `background-color` / `border-color` / `box-shadow` transitions at 0.15s, and the tertiary-button underline at 0.3s. That is the whole motion vocabulary.

**Iconography**
- ✗ Emoji as icons. Ever. Not in UI, not in labels, not in empty states.
- ✓ **Use the `icons` skill for any icon need.** It applies the order below mechanically: the
  house registry (`icons/registry.json`) first, then earlier decisions (`icons/concepts.json`),
  then the pinned pack (`icons/style.json`: Material Symbols Rounded, outlined, weight 400,
  shown at 20px). Every pick records what it beat and why. New icons go in `docs/PROPOSALS.md`.
- ✓ **`design-kit/icons/` first** — 587 real dubizzle icons, and they match each other.
- ✓ **Then Material Symbols (Google Fonts), Font Awesome, or Lucide**, resolved by name: if
  the design asks for an icon the kit doesn't have, take it from whichever pack has it rather
  than shipping a gap. (User decisions, 2026-09-17 and 2026-09-22.)
- ✓ **Pick the variant that looks like our platform: smooth, curved corners; outlined
  stroke; nothing sharp or fully pointed.** Concretely:
  - Material Symbols → the **Rounded** family, **outlined** (`FILL 0`), weight 300–400,
    `GRAD 0`, optical size matched to the render size. Not *Sharp*, not filled by default.
  - Font Awesome Free → the **Regular** (outlined) style where the glyph exists; avoid
    Solid for UI icons, and never Pro-only styles.
  - Lucide → as shipped: round caps and joins; stroke 1.5–1.75 at 24px to sit next to the
    kit's weight (2 reads heavy).
  - Same size and optical weight as the kit icons around it; a sharp-cornered icon next to
    dubizzle's rounded set is the mismatch to avoid.
- Keep one pack per screen where you can. Mixing sets is visible — Lucide's 2px stroke on a
  24 grid doesn't sit level with dubizzle's filled set — so if a screen needs three external
  icons, take all three from the same pack and match the optical size.
- **Licences:** Font Awesome **Free only** — Pro is paid and this repo has no licence for it,
  so don't reference a Pro-only glyph. All three external packs need a credit to travel with
  anything that ships them (`ATTRIBUTIONS.md`). The kit's own icons need nothing.
- ✗ Heroicons, Feather, Bootstrap Icons, Phosphor, Iconoir — a fourth and fifth source buys
  nothing and multiplies the mismatch.

**Layout**
- ✓ Centred marketing hero with a big headline and a single CTA — **use it where needed**
  (user decisions, 2026-09-17 and 2026-09-22): campaign, landing and promotional pages.
  Still not on top of a results grid, where density and scanning win.
- ⚠ Three evenly-weighted cards in a row — **permitted when the content is genuinely three
  peers** (a value-prop row, a three-step explainer). Don't use it to pad thin content, and
  don't apply it to listings: real ad grids are ragged because real content is ragged.
- ✗ Large empty margins "for breathing room" — this is a dense product
- ✗ Full-bleed photography behind text
- ✗ Symmetric, evenly-spaced everything. Real listing grids are ragged because real content is ragged.

**Type**
- ✗ Letter-spaced uppercase headings as decoration (the footer column headings are the one exception)
- ✗ Font sizes above 3.2rem
- ✗ Thin or light weights for body text

---

## 2a. Do — the modern-look toolkit (user decisions, 2026-09-22)

These are open to use. Each new value still goes through **propose → designer confirms →
token** (§1), and the response must say so.

- ✓ **Gradients made from our primitives** — hero washes, campaign bands, AI surfaces, card
  sheens. Palette tokens as stops, legible text, and a `--gradient-<role>` token once final.
- ✓ **Icons from Material Symbols (Google Fonts), Font Awesome Free and Lucide**, similar to
  our platform: **rounded, smooth-curved corners, outlined stroke, not sharp or fully
  pointed** (Material *Rounded* outlined, FA *Regular*, Lucide as shipped). Kit icons first.
- ✓ **Glassmorphism** — `.glass-panel` over imagery, maps or scrolling content, with the
  solid `@supports` fallback.
- ✓ **Coloured glows** — soft, one per view, from a palette colour, as a `--glow-<role>` token.
- ✓ **Purple, indigo and teal where needed** — as accents (AI, data-viz, campaigns).
  **Ask the designer to add each to the colour tokens as a primitive ramp and a semantic
  role** before it ships; until then it is a proposal.
- ✓ **Centred marketing heroes where needed** — landing, campaign and promotional pages.
- ✓ Three evenly-weighted cards when the content really is three peers.

---

## 3. Required patterns

**Hierarchy in an ad card** — price is the loudest thing, then title, then specs, then location and time. Four distinct levels; never flatten them. Exact live values per card and device are in `docs/LIVE-MEASUREMENTS.md` — use `AdCard` / `AdListCard` (or `.ad-card` / `.ad-list-card`) rather than restyling:
- **Grid card** (home and landing rails, similar ads): price 1.8rem/700 **red** `--red-05`, title 1.6rem/400, bold spec line with grey "•", location/time 1.4rem grey `--gray-05`. Flat — no card shadow.
- **List card** (search results): price 2.4rem/700 **charcoal** `--gray-06` (1.8rem on mobile), type + specs, 1.6rem/600 title, attribute chips, contact buttons. Card shadow, 1.2rem radius (0.8rem mobile).

**Buttons** — exactly four variants, no more:
- `primary` — red fill, white text. One per view, for the main action.
- `secondary` — transparent with a red-04 border.
- `tertiary` — text-only with a hover underline.
- `ghost` — blue text, for inline/utility actions.

Heights: 3.2 / 4 / 4.8rem. Never invent a fifth variant or a new size.

**Contact CTAs** are their own component with fixed tinted backgrounds: Chat (red-02), Call (blue-02), WhatsApp (green-02). Don't restyle them.

**Featured and Elite** are overlay badges on the card image, not pills in the content area.

**Density** — desktop search shows 3 cards per row at ≥1280px, 2 at ≥768px, 1 below. Gap is 1.2rem. That is tighter than feels comfortable. Keep it.

**RTL** — layouts flip for Arabic. Use `margin-inline-start` / `padding-inline-end` /
`inset-inline-start` / `text-align: start`, never `left` / `right`. `npm run check:rtl` fails the
build on a physical direction; a rule that genuinely must not mirror opts out with a trailing
`/* rtl-ok: why */`. The Arabic side is captured — `design-kit/reference/live/*.ar.*.html`, 38
pages × desktop and mobile — so "we don't know what Arabic looks like" is no longer an excuse.

---

## 4. Content rules

Fake content is the fastest way to make a real design look generated. Use `design-kit/content/` fixtures, or follow these:

- **Prices:** `EGP 3,200,000` — currency prefix, comma separators, no decimals. Never `$`, never `3.2M`.
- **Titles:** written by real sellers — uneven length, sometimes ALL CAPS, sometimes with a phone number or "urgent". e.g. `Apartment for sale in Zamalek 200m fully finished`. Not `Beautiful Modern Apartment`.
- **Locations:** real Egyptian ones — Maadi, Zamalek, Nasr City, Sheikh Zayed, New Cairo, Heliopolis, 6th of October, Alexandria, Mansoura, Sohag.
- **Property specs:** `3 Beds · 2 Baths · 150 m²` — middot separated, `m²` not `sqm`.
- **Time:** relative when recent (`2 hours ago`, `منذ ساعتين`), absolute when older.
- **Categories:** the real ones — Vehicles, Properties, Mobiles & Tablets, Electronics & Appliances, Jobs, Furniture & Decor, Fashion & Beauty, Pets, Kids & Babies, Business & Industrial, Services.
- **Copy voice:** direct, second person, imperative. `Post Your Ad`, `Sell`, `Chat`, `Call`. Never `Get Started`, `Discover`, `Unlock`, `Elevate`, `Seamless`, `Effortless`.
- **No lorem ipsum.** No `Product Name`. No `$99.99`. No `John Doe` — use `Ahmed H.`, `Mona S.`

---

## 4a. Two kinds of surface

Not every dubizzle screen is a measured one, and treating them the same produces either
fabricated product UI or timid marketing pages.

**Measured surfaces** — listings, search, ad detail, post-an-ad, chat, account, the agency
portal. These exist in production and are captured. Reproduce them; compose new work from
their parts. Skill: `feature-design`.

**Composed surfaces** — landing, campaign, seasonal, growth/SEO and app-download pages.
Composition is a genuine design choice here, and a centred hero, three evenly-weighted cards
and larger display type are **permitted** (they are still wrong on top of a results grid).
Skill: `design-taste-frontend`, scoped for dubizzle.

The brand does not change between them. Palette, Proxima Nova / GESS, gradient-by-role,
motion tokens, imagery from captures, EGP, RTL, contrast — all binding on both. What changes
is how much freedom you have in **arrangement**, not in **ingredients**.

This mirrors the split dubizzle's own design-system export draws between *Repository Mode*
and *Innovation Mode* (D-013): what ships today is the baseline, not the limit — but anything
beyond it is labelled, never presented as an existing standard.

---

## 4b. Accessibility — what is checked, and what is known broken

Run `npm run check:a11y`. It resolves the palette from the generated tokens, so it cannot
drift from the system it polices.

### Contrast — the palette has real failures

**10 of 24 semantic-colour × surface pairings fail AA for normal text.** These are
production dubizzle values, so they are **not bugs to fix** — they are constraints to
design around, and a product decision if anyone wants them changed (`PRODUCT.md`).

| Token | on white | on `--surface-subtle` | on `--surface-muted` |
|---|---|---|---|
| `--text-primary` #23262a | 15.19 ✓ | ✓ | ✓ |
| `--text-secondary` #464c55 | 8.66 ✓ | ✓ | ✓ |
| `--text-tertiary` #919395 | 3.08 large-only | **2.85 ✗** | **2.71 ✗** |
| `--color-primary` #e00000 | 5.04 ✓ | ✓ | 4.42 large-only |
| `--color-secondary` #3a88ef | 3.53 large-only | 3.27 | 3.10 |
| `--color-success` #059e00 | 3.56 large-only | 3.30 | 3.12 |
| `--color-warning` #ffba3c | **1.70 ✗** | **1.57 ✗** | **1.49 ✗** |

Rules that follow:

- **Never put body text in `--text-tertiary` on a grey surface.** On white it is large-text
  only (≥24px, or ≥18.66px bold). Meta lines like "2 hours ago" are usually 12–14px — on a
  grey card that combination fails.
- **`--color-warning` is never text.** It is the Featured badge's fill. Text on it is charcoal.
- `--color-secondary` and `--color-success` are for large text, icons, and borders — not
  14px body copy.
- **Colour is never the only signal.** A status, an error, or a selected state needs a shape,
  an icon or a label as well.

### Targets, names, structure

- **Touch targets** ≥24×24 CSS px (WCAG 2.2 AA minimum); aim for 44×44 on mobile.
- **Every control has an accessible name.** An icon-only button needs `aria-label`. The
  audit finds 2–14 unnamed controls per template on live captures — don't reproduce that.
- **Headings descend in order.** Live jumps h1 → h3 on every ad-detail page; a new screen
  should not copy that.
- **Every `<img>` has `alt`.** Decorative images get `alt=""` — the attribute must exist.
- **Focus must be visible.** Only 1 of 41 component stylesheets defines a focus style today.
  Any new interactive component ships `:focus-visible`.

Not machine-checkable, still required: keyboard order, screen-reader announcement,
`prefers-reduced-motion`, RTL mirroring. Check them by hand.

---

## 4c. Motion — currently undefined, not "minimal"

`RULES.md` used to assert "colour transitions only, 0.15s". That was never measured — the
same mistake as D-007. The generated tokens contain exactly **two** motion values
(`--banner-animation-speed: 1s`, `--tertiary-button-transition: 0.3s`), and production
plainly has more: mega menus open, carousels rotate, sheets slide up, toasts enter and leave.

**Four timing tokens now exist**, adopted from the design-system export (D-013):
`--ease-standard` `cubic-bezier(0.4, 0, 0.2, 1)` · `--duration-fast` 0.15s ·
`--duration-base` 0.25s · `--skeleton-duration` 1.5s. They are **adopted, not measured** —
credited to a second source that agrees with us on 37 of 38 colours, but not yet verified
against live. Use them in preference to anything invented, and say which they are.

So, until the rest are measured:

- **Reuse an adopted or measured transition, or none at all.** Do not invent a duration or an easing.
- Anything new goes in `docs/PROPOSALS.md` as a motion proposal with the value you used.
- **Always honour `prefers-reduced-motion: reduce`** — no current component does. New ones must.
- Still forbidden regardless: `transform: scale()` on hover, bounce/spring/elastic easing,
  decorative entrance animations, parallax.

Use the `motion-design` skill to measure real values before adding any, and the
`animate` skill to build one well.

### When the physics rules change

`apple-design` is installed against a future in which dubizzle's components move toward
a newer iOS feel (user decision, 2026-09-18) — spring physics, velocity-aware drags,
interruptible gestures. **Today those contradict the bans above.** Until this section is
revised by a designer and product owner, that skill produces entries in
`docs/PROPOSALS.md`, not shipped motion, and a spring on a measured surface is a defect.

Three of its ideas apply right now regardless, because they are correctness rather than
style: motion should be **interruptible**, it should **start from the current on-screen
value** instead of snapping to zero first, and a drag should **respect the velocity** the
user gave it. None of those need a spring.

---

## 4d. Imagery and illustration

- **Photography is user content.** Ad photos come from sellers: uneven, sometimes poorly lit,
  often watermarked. Mocks must use the real listing images in the captures, not stock
  photography — polished stock is the fastest way to make a screen look fake.
- **Illustrations now exist** in `design-kit/illustrations/` (11 assets from the design-system
  export, D-013): empty states for credits and ads, the dubizzle Pro logo, portal nav icons,
  credit coins. Use these first. For a state they don't cover, extract from a capture —
  production's style is blue-tinted line work with soft shapes (see the 404 and portal Leads
  empty state). **Don't draw a new style.**
- **Never generate imagery in a brand style that doesn't exist.** If a screen needs an
  illustration the system doesn't have, say so and propose the nearest captured one.
- Avatars are initials on `--red-02` when there is no photo. Logos keep their own colour.

Use the `imagery-illustration` skill.

---

## 4e. Charts and data visualisation — nothing exists

The agency portal renders a line chart (Ads Performance). The design system has **no chart
tokens, no axis styling, no series palette, and no chart components**. Nothing in the
consumer product needed them.

Therefore: **do not invent a chart language.** Measure the portal's chart first
(`chart-data-viz` skill), propose the tokens it implies, get sign-off, then build. A chart
built from guessed colours will not match the one screen that already ships one.

---

## 5. Before you call it done

- [ ] Every colour, space, radius, and shadow is a token — no literal hex or off-scale px
- [ ] Every gradient is a §1 role token, or mixed from palette primitives and logged in `docs/PROPOSALS.md` **and flagged to the user for designer sign-off**
- [ ] Any new colour is likewise tokenised or logged and flagged
- [ ] Frosted surfaces use `.glass-chip` / `.glass-panel` and have a solid `@supports` fallback
- [ ] Icons come from `design-kit/icons/` (or `src/assets/live-icons`, glyphs extracted from live) first; external ones are Material Symbols Rounded / Font Awesome Free Regular / Lucide — rounded and outlined, ideally one pack per screen
- [ ] No emoji anywhere
- [ ] `design-review` run on new work: no P0/P1 findings left (specificity, invented content, template structure, states, density)
- [ ] Nothing scales or bounces on hover
- [ ] Content reads like real Egyptian listings, with real prices and real place names
- [ ] The densest reasonable layout was chosen, not the airiest
- [ ] It works at 375px and at 1280px
- [ ] `npm run check:design <file>` passes
- [ ] `npm run check:rtl` passes — every direction is logical, so the component mirrors in Arabic
- [ ] A new or changed **product component** has a `check:live` spec and passes it — its Storybook story pixel-diffed against the live capture (≤3%, computed values equal). Parity with the kit is not enough: both sides can be wrong together (the `--shadow-menu` collision, the .otf font metrics).

---

## 6. When the system doesn't cover it

If a pattern genuinely doesn't exist in `design-kit/patterns/` or the component library — **say so explicitly** and propose the closest existing pattern. Do not silently invent a new visual language and present it as dubizzle. An honest "the system has no pattern for this; here is the nearest one" is always better than a plausible-looking fabrication.
