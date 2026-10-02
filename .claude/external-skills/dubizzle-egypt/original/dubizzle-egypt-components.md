---
name: dubizzle-egypt-components
description: The Dubizzle Egypt component library — 20 components with their variants, states, sizes, anatomy and token bindings, plus the existing Next.js components to reuse. Use this whenever building or editing any Dubizzle Egypt UI element — buttons, the search bar, inputs, selects, category tabs, nav items, listing cards, tags, badges, banners, footers, mobile bottom nav, sheets or dropdowns. Also use when deciding a component's size, state styling, hover treatment, or whether a pattern should be a full-screen sheet on mobile. Consult it BEFORE building any interactive element or card for Dubizzle Egypt.
metadata:
  version: 1.0.0
  last_updated: "2026-08-12"
  verified_against: "https://www.dubizzle.com.eg/en/ (live, 2026-08-12)"
---

# Dubizzle Egypt Components

20 components. Light mode, responsive, LTR-first with a full Arabic RTL locale.

Components compose tokens from the foundations — never raw values:
**[colors](../dubizzle-egypt-colors/SKILL.md)** · **[typography](../dubizzle-egypt-typography/SKILL.md)** · **[spacing](../dubizzle-egypt-spacing/SKILL.md)** · **[radius](../dubizzle-egypt-radius/SKILL.md)**

> **Reuse before you build.** Egypt runs on Next.js at `zameen_nextjs-main/eg/`. A shared component library already exists — `PageLayout`, `Container`, `Button`, `Heading`, `Image`, `NextLink`, `Icon`, `Card`. Never recreate one of these. Full import table: **[references/codebase-components.md](references/codebase-components.md)**.

## Inventory

| # | Component | Height | Radius | Detail |
|---|---|---|---|---|
| 1 | Primary button | 40 | 6 | [buttons](references/buttons.md) |
| 2 | Dark / search button | 48 | 0 6 6 0 | [buttons](references/buttons.md) |
| 3 | Outline button (on colour) | 30 | 8 | [buttons](references/buttons.md) |
| 4 | Chip / filter pill | 40 | 24 | [buttons](references/buttons.md) |
| 5 | Text link (`View more`) | — | — | [buttons](references/buttons.md) |
| 6 | Search bar group | 48 | 6 outer | [forms](references/forms.md) |
| 7 | Text input | 48 | 6 | [forms](references/forms.md) |
| 8 | Select / country picker | 48 | 6 | [forms](references/forms.md) |
| 9 | Dropdown panel | — | 12 | [forms](references/forms.md) |
| 10 | Mobile sheet | — | 12 top | [forms](references/forms.md) |
| 11 | Category tab (desktop) | 49 | — | [navigation](references/navigation.md) |
| 12 | Section tab (`For You`) | 80 | — | [navigation](references/navigation.md) |
| 13 | Nav icon item | 43 | — | [navigation](references/navigation.md) |
| 14 | Mobile bottom nav | 60 | — | [navigation](references/navigation.md) |
| 15 | Footer | — | — | [navigation](references/navigation.md) |
| 16 | Listing card | — | 4 image | [cards-feedback](references/cards-feedback.md) |
| 17 | Category tile | 59 | 6 | [cards-feedback](references/cards-feedback.md) |
| 18 | Tag | 24 | 6 | [cards-feedback](references/cards-feedback.md) |
| 19 | Badge | 20 | 4 | [cards-feedback](references/cards-feedback.md) |
| 20 | Info banner (sticky) | 50 | — | [cards-feedback](references/cards-feedback.md) |

## Universal rules

### 1. States

Egypt's production site implements a **thin state model** — far thinner than a mature design system. What is actually verified:

| State | Behaviour |
|---|---|
| Default | as specified per component |
| **Hover** | **red fills darken `#E00000` → `#BA0000`.** Links go `--link-blue` → `--link-blue-dark`. The dark Search button does **not** change. |
| Active / pressed | not implemented on the live site |
| Focused | **no visible focus ring** — an accessibility gap |
| Disabled | not observed |

**Hover darkens.** That is the opposite of a dark-mode system, where hover lightens. Do not carry the lighten habit over.

> **Two real gaps.** Focus rings and disabled states are undefined. When a brief needs either, propose a treatment and flag it as an open question rather than silently inventing one — and prefer adding a visible focus ring, since its absence is a WCAG 2.4.7 failure, not a style choice.

### 2. Red is the action colour; dark is the search colour

The primary action is `--brand-red`. The one exception is **Search**, which is `--brand-dark`. That contrast is intentional — search is the site's dominant utility and is deliberately not competing with the red CTA beside it.

**One red CTA per view.** Red also carries prices and badges, so a second red button starts a fight for attention.

### 3. Controls are 40, fields are 48

Buttons are 40 high; anything the user types into or opens is 48. Do not unify them — the header search bar depends on the difference.

### 4. Every component has a fill or a defined edge

A component is a white fill, a coloured fill, or a transparent surface with a **1px `--border-input` / `--border-light`** edge. `--border-default` is decorative — dividers and hairlines only.

### 5. Flat, not elevated

No card shadows. No gradients. Depth is white-on-grey plus a border. Shadow is reserved for **fixed bottom chrome** lifting off the content beneath it.

### 6. On mobile, overlays are full-screen sheets

Filters, category pickers and dropdowns open as sheets or full-screen overlays below 768 — not inline popovers. Desktop uses inline dropdown panels.

### 7. Everything mirrors

Use logical properties throughout. The grouped search bar and any chevron are the highest-risk elements under `dir="rtl"`.

## Quick specs

### Primary button

```
box:    height 40   radius 6   padding-inline 16
fill:   --brand-red        hover --brand-red-hover (#BA0000)
label:  14 / 700 / --text-inverse
```

### Search bar group

```
group:  height 48, one rounded outline, square internal joins
select: --bg-surface + 1px --border-input, radius start-side 6, 16/400, padding 8 0 8 16
input:  transparent, padding-inline-start 12, 16/400, placeholder --text-muted
button: --brand-dark fill, radius end-side 6, label 17 / 500 / --text-inverse
```

### Listing card

```
image:    radius 4
price:    18 / 700 → --brand-red (promoted) or --text-primary
title:    14 / 700 → --text-primary
location: 14 / 18 / 400 → --text-secondary
meta:     separated by a • in --text-muted
tag:      height 24, radius 6, --bg-muted fill, 12/700 --text-secondary
surface:  --bg-surface, no shadow
```

### Tag and badge

```
Tag:    height 24   radius 6   padding 4 8   12/700   --bg-muted  / --text-secondary
Badge:  height 20   radius 4   padding 2 4   12/600   --brand-red / --text-inverse
```

## Building a new component

1. **Check the inventory and the codebase table first** — extend, don't duplicate.
2. **Take the height from the standard set** — control 40, field 48, tag 24, badge 20.
3. **Take the radius by type** — 6 controls, 4 badges, 12 cards, 24 pills.
4. **Give it a hover state** that darkens; propose focus and disabled treatments explicitly.
5. **Fill or bordered edge, never a bare `--border-default` outline.**
6. **Label at 14/700** for buttons, 14/400 for body.
7. **Use logical properties** so it mirrors.
8. **Bind every value to a token.**

## Detail

- **[references/buttons.md](references/buttons.md)** — the five button types
- **[references/forms.md](references/forms.md)** — search bar, inputs, selects, dropdowns, sheets
- **[references/navigation.md](references/navigation.md)** — tabs, nav items, bottom nav, header, footer
- **[references/cards-feedback.md](references/cards-feedback.md)** — listing cards, tiles, tags, badges, banners
- **[references/codebase-components.md](references/codebase-components.md)** — existing Next.js components and import paths
