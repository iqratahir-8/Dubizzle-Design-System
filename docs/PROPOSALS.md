# Proposals — new values awaiting designer sign-off

Anything a design introduces that the system doesn't already have — **a new colour, a new
gradient, a new frosted surface** — lands here first. It is *not* adopted until a designer
confirms it. Once confirmed, it becomes a token and leaves this file.

This exists because of `docs/DECISIONS.md` **D-007**: a value that enters the system without
a decision behind it eventually gets enforced as though it were a fact. A proposal is how a
new value gets in **on purpose**.

---

## How it works

**When Claude introduces a new value while designing**

1. Use it in the design — don't stall the work.
2. `npm run check:design` warns (not errors), pointing here.
3. Add a row to the table below: what it is, where it's used, the exact value, and why an
   existing token wouldn't do.
4. **Tell the user in the response, explicitly** — "this design introduces a new colour
   `#xxxxxx`; it needs your designer's sign-off before it ships." Never let a new value pass
   silently just because the design looks finished.

**When the designer confirms it**

5. Add it to the semantic map in `scripts/sync-tokens.mjs` with a comment saying it was
   designer-adopted and on what date — not measured from live.
6. `npm run sync:tokens` to regenerate `design-kit/tokens/tokens.css` and
   `src/tokens/generated.css`.
7. If it's a gradient, add its token to `ALLOWED_GRADIENT_HINTS` in `scripts/check-design.mjs`
   so the warning stops.
8. Record it in `docs/DECISIONS.md` and, if it has a measurable rendered form,
   `docs/LIVE-MEASUREMENTS.md`.
9. Move the row from **Open** to **Adopted** below, and commit.

**When the designer rejects it**

Move the row to **Rejected** with the reason, and replace the value in the design with the
nearest existing token. A rejected proposal is worth keeping — it stops the same value being
proposed again in three months.

---

## Provenance — keep these apart

Every value in this system is one of three things. Don't let them blur:

| Kind | Where it came from | Marked how |
|---|---|---|
| **Measured** | Rendered on live dubizzle, verified in a capture | `docs/LIVE-MEASUREMENTS.md` row |
| **Adopted** | Authored by a designer, confirmed, then added | comment in `sync-tokens.mjs` + a `D-NNN` |
| **Proposed** | In a design, not yet confirmed | a row in this file |

Never describe an adopted or proposed value as something dubizzle "uses" — it doesn't, yet.

---

## Open — awaiting confirmation

| Date | Kind | Value | Used in | Why no existing token fits |
|---|---|---|---|---|
| 2026-09-23 | colour | `rgba(245,245,245,.8)` over white ≈ `#f7f7f7` | the value cells of the ad-detail `Details` grid (`AdDetailsTable`) | Live paints the value cell one step lighter than `--gray-00` `#f6f6f6`. We ship `--gray-00`: the difference is a single level and invisible in the pixel diff (0.0%). Flagged in case the designer wants a real token for it. |
| 2026-09-23 | colour | `#12151b` | the seller's name on the ad detail page (`SellerCard`, not yet built) | Darker than `--gray-06` `#23262a`, and used nowhere else in the captures. The seller card is deferred until this is settled. |
| 2026-09-29 | copy + layout | Favourites empty state `No favorites yet.` and Saved searches empty state `No saved searches yet.` (`favourites-empty`, `saved-searches-empty`, derived from the live templates) | the two list blocks only; header, title, tabs and footer are the live capture | Live's populated pages are captured (2026-09-29) but no empty state has been seen on live. Copy and structure (one bold `Text.Large` line, no image, no button) come from the maple monorepo (`design-kit/reference/maple/favourites/`), which can lag production; the saved-searches string is from the Jordan locale and Egypt's is unverified. The text size (1.8rem/700) is a stand-in — `Text.Large` was not measured. |
| 2026-09-18 | colour | `#707ce9` `--ai-indigo` | AI surfaces in the design-system export (`AiChip`, `AiFlowSurface`, `AiStarBadge`) | Only colour in the export that is **not** in our measured palette, and it belongs to an AI feature that appears in none of the 142 live captures. Unshipped — needs designer confirmation before it enters the system. |

## Adopted

| Date | Kind | Value | Token | Decision |
|---|---|---|---|---|
| 2026-09-17 | glass | `rgba(255,255,255,.72)` + `blur(12px)` | `--glass-panel-bg` / `--glass-panel-blur` | D-008 — opt-in frosted panel, authored on user instruction. Production does not render it. |

## Rejected

| Date | Kind | Value | Why |
|---|---|---|---|
| — | — | — | — |
