---
name: dubizzle-egypt-colors
description: The Dubizzle Egypt colour system (light mode) — every colour token, what each one is for, and the rules for combining them. Use this whenever building or editing any Dubizzle Egypt UI, screen, component, page, or codebase handoff that involves colour — including picking a page background, surface, border, text colour, icon colour, button/CTA fill, chip, tag, badge, price, status or error state, or hover/active/disabled state. Consult it BEFORE writing any background-color, color, border-color, or fill declaration for Dubizzle Egypt, and before choosing any hex value.
metadata:
  version: 1.0.0
  last_updated: "2026-08-12"
  verified_against: "https://www.dubizzle.com.eg/en/ (live, 2026-08-12)"
---

# Dubizzle Egypt Colour System

**Light mode.** White and light greys are load-bearing here — this is the opposite of a dark system. Every colour comes from a token below, never a raw hex typed by hand.

> **Tenant isolation.** These tokens are Dubizzle Egypt only. Never mix in Bayut KSA teal (`#006169`) or green (`#28B16D`), and never carry a MyZameen dark-mode token (`bg-elev-*`, `primary-6`) into Egypt. The systems do not share a palette.

Pair with **[dubizzle-egypt-typography](../dubizzle-egypt-typography/SKILL.md)**, **[dubizzle-egypt-spacing](../dubizzle-egypt-spacing/SKILL.md)** and **[dubizzle-egypt-components](../dubizzle-egypt-components/SKILL.md)**.

## Two layers

1. **Semantic** — `--brand-*`, `--text-*`, `--bg-*`, `--border-*`. These carry a role. **Prefer these.**
2. **Raw scale** — the grey ramp underneath. Use only when no semantic token covers a genuine need.

Unlike a dark system, Egypt has **no elevation ramp**. Depth comes from white surfaces on grey backgrounds plus a border — not from stacked greys.

## Brand

| Token | Hex | Use for |
|---|---|---|
| `--brand-red` | `#E00000` | **The primary brand colour.** CTAs, prices, active accents, "View more" links, category links, badges |
| `--brand-red-hover` | `#BA0000` | **Hover on any red fill.** Verified live on `Post Your Ad` |
| `--brand-red-tint` | `#FEF5F5` | Pale red-tinted section background (app-download band) |
| `--brand-dark` | `#23262A` | Body text, headings, **and the Search button fill** |
| `--link-blue` | `#3A88EF` | Links, interactive text, informational banner fill |
| `--link-blue-dark` | `#0F5DC4` | Link hover / active |

**Red is not only a CTA colour.** Egypt uses `#E00000` for prices, section links and badges as well as buttons — it is the accent of the whole interface. That is a deliberate difference from KSA, where the CTA colour is reserved for actions.

**There is no separate secondary brand colour.** KSA has a green secondary CTA; Egypt reuses `--brand-red` for both primary and secondary actions. Do not invent a second brand colour to fill the gap — use the outline or neutral button instead (see components).

## Neutrals

| Token | Hex | Use for |
|---|---|---|
| `--text-primary` | `#23262A` | Primary text, headings, prices on neutral cards |
| `--text-secondary` | `#464C55` | Secondary text, descriptions, card locations, footer links |
| `--text-muted` | `#919395` | Muted text, placeholders, timestamps, separator dots |
| `--text-inverse` | `#FFFFFF` | Text on red, dark or blue fills |
| `--border-input` | `#919395` | **Input and select outlines** — the strong border weight |
| `--border-default` | `#E0E0E0` | Dividers, card borders, hairlines |
| `--border-light` | `#DADBDB` | Chip and pill button outlines |
| `--bg-surface` | `#FFFFFF` | **Cards, nav bar, inputs, dropdowns** — the default surface |
| `--bg-page` | `#F6F6F6` | Page and nav-strip background |
| `--bg-muted` | `#F0F0F0` | **Footer background**, tag fills, sticky mobile header |
| `--bg-seo-strip` | `#E0E0E0` | The SEO/keyword strip at the very bottom of the page |
| `--footer-rule` | `rgba(0, 47, 52, 0.2)` | Footer top border — a 20% tint of legacy OLX teal |

`#222222` also appears on some legacy anchors. Treat it as drift and map it to `--text-primary` (`#23262A`).

## Overlays and shadows

| Token | Value | Use for |
|---|---|---|
| `--overlay-hero` | `rgba(0, 0, 0, 0.6)` | Image hero / banner scrim for text legibility |
| `--overlay-modal` | `rgba(43, 45, 46, 0.65)` | Modal and lightbox backdrop |
| `--shadow-bottom-nav` | `0 -2px 4px rgba(0, 0, 0, 0.133)` | Mobile fixed bottom nav (verified live) |
| `--shadow-banner` | `0 -2px 8px rgba(0, 0, 0, 0.1)` | Sticky bottom banner |

**Egypt's UI is flat.** No gradients appear anywhere on the live homepage, and shadows are used only to lift *fixed bottom chrome* off the content beneath it. Cards on the live site carry **no shadow** — they are separated by whitespace and borders. Do not add card shadows to make a design feel richer; that is a KSA/Bayut idiom, not an Egyptian one.

## Composition rules

### 1. Depth is white-on-grey plus a border, not a grey ramp

```
✅  page --bg-page (#F6F6F6)  →  card --bg-surface (#FFFFFF) + --border-default
✅  footer --bg-muted (#F0F0F0), dark text on it
❌  stacking #F6F6F6 → #F0F0F0 → #E0E0E0 to imply elevation
```

A card is white on a light-grey page. If the page is already white, the card is separated by `--border-default` alone.

### 2. Red carries meaning — ration it

Red is the accent for *value and action*: prices, CTAs, badges, and "more" links. It is not a decorative colour. A screen with red section backgrounds, red headings and red body text has lost the signal. Keep red to actions, prices and one accent per block.

`--brand-red-tint` (`#FEF5F5`) is the only red **surface** in the system, and it exists for the app-download band.

### 3. Blue is for links and information, never for actions

`--link-blue` marks links and informational banners. It is never a button fill for a primary action — that is always red, or dark for search.

### 4. Two different border weights, two different jobs

- **`--border-input` (`#919395`)** — the edge of a control the user types into or opens. Notably darker than most systems' input borders; this is intentional and verified live.
- **`--border-default` (`#E0E0E0`)** — decorative rules, dividers, card edges.
- **`--border-light` (`#DADBDB`)** — pill and chip outlines only.

Do not use `--border-default` on an input; it reads as disabled next to the real thing.

### 5. Keep tokens in role

A `--text-*` token is not a fill, and a `--bg-*` token is not text. For a light surface use `--bg-surface`; for a visible control edge use `--border-input`.

## Status colours — an open gap

> **Not yet verified.** The live Egypt homepage exposes no success / warning / error state colours, and the shared multi-tenant reference does not define them for EG.
>
> Do **not** invent a status palette or borrow KSA's. When a design needs an error or success state:
> 1. Check `zameen_nextjs-main/eg/` styles for a defined `$error` / `$success`, and
> 2. If nothing exists, raise it as an open question in the design notes.
>
> Error text on form validation is the most likely place this bites first.

## Component recipes

| Component | Background | Border | Text |
|---|---|---|---|
| **Primary CTA** (`Post Your Ad`) | `--brand-red` → hover `--brand-red-hover` | — | `--text-inverse` |
| **Search button** | `--brand-dark` (no hover change) | — | `--text-inverse` |
| **Chip / filter pill** | `--bg-surface` | 1px `--border-light` | `--text-primary` |
| **Outline button on colour** | transparent | 1px `--text-inverse` | `--text-inverse` |
| **Input / select** | `--bg-surface` | 1px `--border-input` | value `--text-primary`, placeholder `--text-muted` |
| **Listing card** | `--bg-surface` | none or 1px `--border-default` | title `--text-primary`, location `--text-secondary` |
| **Price** | — | — | `--brand-red` (promoted) or `--text-primary` |
| **Tag** (`Down Payment`) | `--bg-muted` | — | `--text-secondary` |
| **Badge** (`New`) | `--brand-red` | — | `--text-inverse` |
| **Active tab** | transparent | bottom 1–2px `--brand-dark` | `--text-primary` |
| **Info banner** | `--link-blue` | — | `--text-inverse` |
| **Footer** | `--bg-muted` | top 1px `--footer-rule` | links `--text-secondary` |
| **Section link** (`View more`) | — | — | `--brand-red` |

## Working with existing colour

Map a raw hex to the nearest token **by role**, not by proximity: a surface to a `--bg-*`, a control edge to `--border-input`, a caption to `--text-muted`. `#222` maps to `--text-primary`. Anything teal or green is KSA contamination — remove it.

## Implementation

CSS custom properties, utility classes and the full token table: **[references/tokens.md](references/tokens.md)**.
