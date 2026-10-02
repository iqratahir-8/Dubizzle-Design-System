---
name: dubizzle-egypt-layout
description: The Dubizzle Egypt page and screen layout system — breakpoints, container widths, page margins, header and footer structure, section rhythm, sticky and fixed chrome, RTL mirroring, and page archetypes for mobile and desktop. Use this whenever building a new Dubizzle Egypt screen or page, assembling a layout, or deciding page margins, gutters, column splits, content width, sticky headers or the mobile bottom nav. Consult it BEFORE laying out any Dubizzle Egypt screen or page.
metadata:
  version: 1.0.0
  last_updated: "2026-08-12"
  verified_against: "https://www.dubizzle.com.eg/en/ (live, 2026-08-12)"
---

# Dubizzle Egypt Layout

A **responsive website**, not a fixed-frame app. Layout is fluid between breakpoints; colour and type tokens are shared across them, page structure is not.

Pair with **[dubizzle-egypt-spacing](../dubizzle-egypt-spacing/SKILL.md)**, **[dubizzle-egypt-components](../dubizzle-egypt-components/SKILL.md)** and **[dubizzle-egypt-colors](../dubizzle-egypt-colors/SKILL.md)**.

## Breakpoints

Real breakpoints in production CSS, in order of importance:

| Width | Role |
|---|---|
| **768** | **The primary split.** Mobile layout below, desktop at and above. |
| 950 | Secondary desktop reflow — nav and grid density |
| **1280** | **Wide desktop** — container reaches full width |
| 1200 | Legacy container ceiling |
| 480 | Small mobile adjustments |
| 360 | Smallest supported width |
| 896 | Landscape-phone handling |

```css
@media (max-width: 768px)  { /* mobile */ }
@media (min-width: 768px)  { /* desktop */ }
@media (min-width: 1280px) { /* wide */ }
```

**Design at 375 (mobile) and 1280 (desktop).** Those are the two canvases that match production. 768–950 is a real in-between zone — check it, don't assume it inherits cleanly.

## Container

| Property | Value |
|---|---|
| **Content container** | **1248px**, centred (measured at a 1280 viewport) |
| Legacy container variable | `75rem` (1200px) |
| Page gutter at 1280 | 16 each side |
| Full-bleed sections | 100vw, with an inner container at 1248 |

```css
.dz-container {
  width: 100%;
  max-width: 1248px;
  margin-inline: auto;
  padding-inline: 16px;
}
```

The container is centred, so above 1280 the margins grow and the content does not.

> **Note the discrepancy.** The codebase defines `--container-width: 75rem` (1200px) but the live homepage measures **1248**. Newer sections use 1248; older ones inherit 1200. When extending an existing page, match its neighbours; for a new page, use 1248.

## Desktop structure

### Header — three stacked bands, sticky

| Band | Height | Background |
|---|---|---|
| **Nav strip** | 68 | `--bg-page` (`#F6F6F6`) |
| **Search row** | 48 | `--bg-surface` (`#FFFFFF`) |
| **Category strip** | 49 | `--bg-surface`, 1px bottom border |

Total header ≈ **165px**. The whole block is sticky, not just the nav.

- **Nav strip:** logo (start) · `Motors` / `Property` category tabs · notification, favourites, chat, my-ads icon items · `العربية` toggle · login · `Post Your Ad` red CTA (end).
- **Search row:** country select (48, radius start-side) + search input + dark `Search` button (radius end-side) as one grouped control.
- **Category strip:** horizontal list — Vehicles, Properties, Mobiles & Tablets, More Categories — 16/600, active item carries a bottom border.

**There is no utility bar.** KSA has a two-tier header with a grey utility strip; Egypt is a single nav strip plus search. Do not port KSA's utility bar in.

### Content

Sections stack in a single column at 1248, separated by **96px**. Card grids inside a section use a 16px gutter.

Egypt's homepage does not use a persistent sidebar. Two-column splits appear on listing and detail pages (results + filters); when you need one, take the split from the page you are extending rather than inventing a ratio.

### Footer

| Property | Value |
|---|---|
| Background | `--bg-muted` (`#F0F0F0`) — **light, not dark** |
| Top border | 1px `rgba(0, 47, 52, 0.2)` |
| Padding | `16 0 64` |
| Columns | **ABOUT US · DUBIZZLE · COUNTRIES · FOLLOW US** |
| Link style | 12/18/400 in `--text-secondary` |

Below the footer sits a **SEO keyword strip**: `--bg-seo-strip` (`#E0E0E0`), padding `16 0`, 12px text.

> **Corrects an older reference.** The multi-tenant `tenant-registry.md` describes the EG footer as "a simple link list". It is not — it is a four-column footer with country links, social icons and three app-store badges (App Store, Play Store, **and Huawei AppGallery**).

## Mobile structure (≤ 768px)

### Vertical anatomy

| Band | Height | Behaviour |
|---|---|---|
| Top nav | 81 | scrolls away |
| **Sticky search header** | **143** | sticks at top, `--bg-muted` |
| Content | flexible | scrolls |
| **Fixed bottom nav** | **60** | fixed, `--bg-surface`, shadow `0 -2px 4px rgba(0,0,0,0.133)` |

```
top offset when stuck   = 143
bottom inset            = 60
```

**Reserve the bottom inset as padding** so content scrolls clear of the fixed nav rather than under it:

```css
.dz-mobile-content { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
```

Add `env(safe-area-inset-bottom)` — this is a mobile web app on iOS Safari, where the home indicator eats the bottom 34px.

### Horizontal margin

**16 each side.** At a 375 viewport that gives **343** of content. Full-bleed elements (hero media, the sticky header, screen-spanning dividers) sit at `x=0, w=100%`.

### Section rhythm

**56px** between major sections, 32 internal padding, 12 between cards.

## Mobile vs desktop

| | Mobile | Desktop |
|---|---|---|
| Design canvas | 375 | 1280 |
| Content width | 100% − 32 (343 @ 375) | 1248 max, centred |
| Page margin | 16 | 16, container-limited |
| Header | 81 nav + 143 sticky search | 68 + 48 + 49 = 165, sticky |
| Bottom chrome | 60 fixed nav | none |
| Section gap | 56 | 96 |
| Section padding | 32 | 48 |
| Card gutter | 12 | 16 |
| Heading ceiling | 20 | 28 |

Responsiveness is a **structure swap** at 768, not a proportional scale. The header reorganises, the bottom nav appears, the section rhythm halves, and heading tokens change per the typography skill.

## RTL

Egypt ships Arabic behind the `العربية` toggle. Every layout must mirror.

- Set `dir="rtl"` on the document, not per element.
- Use **logical properties** everywhere: `padding-inline-start`, `margin-inline-end`, `border-start-start-radius`, `inset-inline-start`. Physical `left`/`right` will not flip.
- Use the codebase `IsRtl` utility for conditional logic.
- **Mirror:** page flow, nav order, chevrons, back arrows, the search group's rounded corners, card image/text order.
- **Do not mirror:** the logo, phone numbers, Latin brand names, app-store badges, media playback controls.
- The grouped search bar is the highest-risk element — see [radius](../dubizzle-egypt-radius/SKILL.md#the-search-bar-is-one-grouped-control).

## Desktop skeleton

```html
<div class="dz-page">
  <header class="dz-header">              <!-- sticky, 165 total -->
    <div class="dz-nav-strip">…</div>      <!-- 68, #F6F6F6 -->
    <div class="dz-search-row">…</div>     <!-- 48, #FFFFFF -->
    <nav class="dz-category-strip">…</nav> <!-- 49, bottom border -->
  </header>

  <main class="dz-container dz-section-flow">
    <section>…</section>                   <!-- 96 between sections -->
  </main>

  <footer class="dz-footer">…</footer>     <!-- #F0F0F0, 4 columns -->
  <div class="dz-seo-strip">…</div>        <!-- #E0E0E0 -->
</div>
```

```css
.dz-page   { background: var(--dz-bg-page); color: var(--dz-text-primary); }
.dz-header { position: sticky; top: 0; z-index: 6; }
.dz-nav-strip      { height: 68px; background: var(--dz-bg-page); }
.dz-search-row     { height: 48px; background: var(--dz-bg-surface); }
.dz-category-strip { height: 49px; background: var(--dz-bg-surface);
                     border-bottom: 1px solid var(--dz-border-default); }

.dz-container { width: 100%; max-width: 1248px; margin-inline: auto; padding-inline: 16px; }
.dz-section-flow { display: flex; flex-direction: column; gap: 96px; }

.dz-footer { background: var(--dz-bg-muted);
             border-top: 1px solid var(--dz-footer-rule);
             padding: 16px 0 64px; }
.dz-seo-strip { background: var(--dz-bg-seo-strip); padding: 16px 0; }

@media (max-width: 768px) {
  .dz-section-flow { gap: 56px; }
}
```

## Mobile skeleton

```html
<div class="dz-page">
  <div class="dz-mobile-nav">…</div>          <!-- 81 -->
  <div class="dz-mobile-search">…</div>       <!-- 143, sticky -->

  <main class="dz-mobile-content">…</main>    <!-- px 16, gap 56 -->

  <nav class="dz-bottom-nav">…</nav>          <!-- 60, fixed -->
</div>
```

```css
.dz-mobile-search  { position: sticky; top: 0; z-index: 6;
                     height: 143px; background: var(--dz-bg-muted); }
.dz-mobile-content { padding-inline: 16px;
                     padding-bottom: calc(60px + env(safe-area-inset-bottom));
                     display: flex; flex-direction: column; gap: 56px; }
.dz-bottom-nav     { position: fixed; inset-inline: 0; bottom: 0; z-index: 7;
                     height: 60px; background: var(--dz-bg-surface);
                     box-shadow: var(--dz-shadow-bottom-nav); }
```

## Page archetypes

| Archetype | Structure |
|---|---|
| **Home / marketplace** | header → hero banner (full-bleed) → category grid → listing carousels → promo band → footer |
| **Search results** | header → filter bar → results grid + filter sidebar (desktop) / filter sheet (mobile) → pagination |
| **Listing detail** | header → full-bleed gallery → price + title block → specs → seller card (sticky on desktop) → related listings |
| **Post an ad (flow)** | header → step indicator → single-column form (max ~600) → sticky continue action |
| **Static / help** | header → single-column prose within the container → footer |

On mobile, filters and dropdowns open as **full-screen sheets or overlays**, not inline popovers.

## Building a new page

1. Pick the archetype and confirm the platform — mobile, desktop, or both.
2. Lay the chrome: desktop 165 sticky header; mobile 81 nav + 143 sticky search + 60 fixed bottom nav.
3. Wrap content in `.dz-container` (1248 max, 16 gutter).
4. Stack sections at 96 desktop / 56 mobile.
5. Compose from **[dubizzle-egypt-components](../dubizzle-egypt-components/SKILL.md)** at their standard heights (controls 40, fields 48).
6. Reserve the mobile bottom inset as padding, including `env(safe-area-inset-bottom)`.
7. Verify the whole layout with `dir="rtl"` before calling it done.
