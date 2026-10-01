---
name: design-typography
description: >-
  Apply dubizzle Egypt's type system well — hierarchy from the measured scale, line length,
  line height, truncation, prices and numbers, text wrapping, user font scaling, mobile minimums,
  and Arabic (GESS) specifics. Use whenever a screen has text hierarchy to set, when someone asks
  about font size, weight, heading levels, line height, "the text looks off", truncation /
  ellipsis, tabular numbers, Arabic type, or when a design looks generated because of its type.
  It applies the existing scale; it never invents a size.
---

# Typography — dubizzle Egypt

The scale is measured and closed (`RULES.md` §1 Type). This skill is about using it well.

| Token | rem (1rem = 10px) | Typical use (measured where noted) |
|---|---|---|
| `--text-xs` | 1.2 | captions, legal, meta |
| `--text-sm` | 1.4 | **body default**, labels, location/time on cards |
| `--text-md` | 1.6 | grid-card title, inputs, list-card title (600) |
| `--text-lg` | 1.8 | grid-card price (700, red), mobile list-card price |
| `--text-xl` | 2.0 | section headings |
| `--text-2xl` | 2.4 | desktop list-card price (700, charcoal), page titles |
| `--text-3xl` | 3.2 | the ceiling — composed surfaces only |

Weights **400 / 600 / 700** only. Line height **1.5 body, 1.2 headings**. Faces:
**Proxima Nova** (`--font-primary`), **GESS** (`--font-arabic`). Nothing else.

**Where the web disagrees, the measurement wins:** general guides say body = 16px; dubizzle's
body is 14px (1.4rem) and that is what ships. Guides allow display type to 6rem; ours stops at
3.2rem. Don't "improve" these.

## Hierarchy

1. Levels come from **size + weight + colour together**, not size alone. Ad card: price
   (loudest) → title → specs → location/time — four levels, never flattened (`RULES.md` §3,
   `docs/LIVE-MEASUREMENTS.md`).
2. Use three or four levels per screen. A new in-between size is a defect.
3. Emphasis by weight (600/700), never by gradient text, italic, colour on one word, or underline
   (underline is for links).
4. More space above a heading than below it — it belongs to what follows.
5. Headings descend in order in the markup (h1 → h2 → h3); live skips h2 on ad detail, don't copy that.

## Line length and leading

- Running text (ad description, help, terms): **45–75 characters**, cap with `max-width: 65ch`.
- Leading tightens as size grows: 1.5 body, 1.2 headings (tokens). Text of **three or more lines**
  never uses heading leading, even in a tight card.
- Paragraph spacing about one line; section breaks larger. Use `--space-*` tokens.
- Start-aligned text. Centre only one- or two-line headings and empty states. Never justify.

## Numbers and prices

- **`font-variant-numeric: tabular-nums`** on prices in lists and tables, counters, the portal's
  stats and credit tables — so digits line up and don't jitter when they update. Keep
  proportional figures in prose.
- Format per `design-copy`: `EGP 3,200,000`.
- **Never truncate a price** or the decision-critical fact. Truncate titles and descriptions.

## Truncation and wrapping

- One line: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
- Several lines: `line-clamp` (with the `-webkit-box` fallback). Card titles clamp to the
  measured line count of their card.
- Whatever is clipped must be reachable in full (the ad page, an expander) — WCAG 1.4.12 allows
  truncation only then.
- `text-wrap: balance` for headings and short titles (works up to ~6 lines);
  `text-wrap: pretty` for paragraphs — not on long repeated lists (cost).
- User content wraps: `overflow-wrap: anywhere; min-width: 0` on flex/grid children, so a
  50-character model name or a phone number in a title never pushes the layout sideways.

## Scaling and minimums

- Sizes in **rem** (1rem = 10px here). Text containers never have fixed heights: they must
  survive line height 1.5×, letter spacing 0.12em, word spacing 0.16em (WCAG 1.4.12). Test cards
  with those overrides.
- When text grows, rows grow and side-by-side items stack — nothing crops or overlaps.
- Inputs **≥1.6rem on mobile** (the measured `Input` is) — under 16px iOS zooms on focus. Never
  block zoom.
- Body text ≥4.5:1 contrast, large text ≥3:1. Grey text on a coloured surface fails easily —
  check the real pair (`npm run check:a11y`; 10 of 24 palette pairings fail AA).

## Arabic (GESS)

- **Letter-spacing is always 0 on Arabic.** Arabic is joined script; tracking breaks the joins.
  Reset any tracking under `:lang(ar)`.
- **More line height** than Latin — Arabic ascenders and descenders reach further. Start around
  1.6–1.8 for body and **measure GESS on the `.ar` captures** before making it a token
  (`design-kit/reference/live/*.ar.*.html`).
- Match sizes **by eye, not by number**: Arabic often reads smaller at the same px. Compare GESS
  and Proxima Nova on the captures; a size change is a proposal, not a guess.
- No italics, no caps, no kashida stretching. Emphasis by weight.
- Mixed content: `dir="auto"` / `<bdi>` for user titles; phone numbers, plates, codes in
  `dir="ltr"`.
- Digits: Western vs Arabic-Indic is **an open question** — read the live Arabic pages; don't decide it here.
- Font stack falls back within the script: GESS → a system Arabic face → system UI. Arabic must
  never fall into a Latin-only face.
- Run `rtl-arabic` for any Arabic screen.

## Type slop to catch

Gradient text · a third typeface or "techy" monospace · thin/light body weights · a kicker
label above every heading · tracked-out uppercase labels (footer headings are the one measured
exception) · one word in a headline highlighted · centred long paragraphs · hero type above
3.2rem · tight leading on multi-line text · proportional digits in price columns · letter-spacing
on Arabic · mobile inputs under 16px.

## Sources

Read first-hand: Impeccable `reference/typeset.md`, `craft-floor.md` · petekp typography skills
and their internationalisation reference · Apple HIG Typography (JSON feed) · W3C *Arabic &
Persian Layout Requirements* (alreq) · MDN `text-wrap-style`, `font-variant-numeric`,
`line-clamp` · WCAG 1.4.12 Text Spacing · Anthropic frontend-design. Via search only: Material 3
type scale, Refactoring UI, iOS 16px input zoom. Not read: Butterick, Google Fonts Arabic guide.
