---
name: design-review
description: >-
  Critique a dubizzle Egypt screen the way a senior designer would before it ships, and catch
  everything that makes it look AI-generated — template structure, invented metrics, fake
  content, missing states, off-scale values, decorative noise, broken RTL, weak hierarchy.
  Use when someone asks "review this design", "does this look AI-made", "critique", "is this
  good", "anti-slop check", "heuristic review", or before running design-qa on new work. Gives
  a verdict with P0–P3 findings. It judges against dubizzle's measured system, never against
  a generic taste.
---

# Design review — the anti-slop gate

`design-qa` proves a design is **complete** (states, breakpoints, tokens, flows).
This skill judges whether it is **good and believable as dubizzle**. Run this first, fix,
then `design-qa`, then `design-deliverables`.

## The rule that overrides every borrowed checklist

The gates below are distilled from Hallmark, Impeccable, Anti UI Slop, Anthropic's
frontend-design and Vercel's interface guidelines. Many of those sources fight slop by
imposing **their own aesthetic** — "never use Inter", "never pure white", "card radius
12–16px", "pick a bold tone", "vary page structure every time". **None of those apply
here.** dubizzle's look is measured from 142 live captures (`RULES.md`, tokens,
`docs/LIVE-MEASUREMENTS.md`). A classifieds product needs pages that look like each other.
The test is never "is it distinctive?" — it is "would this ship on dubizzle.com.eg, and does
every value trace to the system?"

Measured surfaces (listings, search, ad detail, post-an-ad, chat, account, portal) get the
strict reading. Composed surfaces (landing, campaign) get freedom in arrangement, not in
ingredients (`RULES.md` §4a).

## How to run it

1. Look at the screen at **1280** and **375**, then with real long content.
2. Go through the gates. For each failure write: gate id, where, what, the fix, priority.
3. Score Nielsen's 10 heuristics 0–4 (§G).
4. Verdict: **Ship** (no P0/P1) · **Fix then ship** · **Rework** (any P0, or the specificity test fails).

Priorities: **P0** wrong or harmful (fake data presented as real, broken task, inaccessible
primary action) · **P1** looks generated or off-system · **P2** polish · **P3** note.

## A. Specificity and honesty

| id | gate | prio |
|---|---|---|
| `rev.specific` | Could an unrelated product use this screen unchanged? If yes, it is not designed for dubizzle — rework. | P0 |
| `rev.metrics` | No invented numbers: "50,000+ sellers", "10× faster", star ratings, "trusted by". Real data or a visibly labelled placeholder. | P0 |
| `rev.content` | Real Egyptian content (`RULES.md` §4, `design-kit/content/fixtures.json`): `EGP 3,200,000`, Maadi, messy seller titles. No lorem, `John Doe`, `Product Name`, `$`. | P1 |
| `rev.copy` | dubizzle voice — imperative, specific verbs (`Post Your Ad`, `Call`). None of: Unlock, Elevate, Seamless, Discover, Get Started. New headings and buttons in Title Case (D-019). Run `design-copy`. | P1 |
| `rev.brief` | Every requirement in the brief is on screen and findable in seconds. | P1 |

## B. Structure

| id | gate | prio |
|---|---|---|
| `rev.template` | No Hero → 3 features → CTA → footer skeleton on a product surface. | P1 |
| `rev.tiles` | No icon-above-heading tile rows standing in for content. Three peer cards only when the content is genuinely three peers (`RULES.md` §Layout). | P1 |
| `rev.nest` | No card inside a card. Group with spacing first; add a border or surface only when space can't. | P1 |
| `rev.hero-metric` | No big-number/small-label stat block unless the number is real. | P1 |
| `rev.decor` | No decoration without meaning: blobs, sparkles, badges, fake chrome (browser bars, phone frames). | P1 |
| `rev.density` | The densest reasonable layout was chosen. Listing grids keep their measured density (3/2/1 columns, 1.2rem gap). No "breathing room" margins. | P1 |
| `rev.modal` | No modal by reflex — interruption only when the task needs it (`design-interaction` §6). | P2 |
| `rev.hierarchy` | The squint test: price, then title, then specs, then location/time (ad cards); one primary action per view. | P1 |

## C. States and robustness

| id | gate | prio |
|---|---|---|
| `rev.states` | Loading, empty (why + next action), error (with recovery), success, disabled, selected — all drawn. `design-qa` enforces existence; judge quality here. | P0 |
| `rev.controls` | Every control has hover, focus-visible, pressed, disabled (`design-interaction` §1). | P1 |
| `rev.extremes` | A 3-line Arabic title, a 9-digit price, zero results, one result, 200 results. Nothing clips or overlaps. | P1 |
| `rev.overflow` | No horizontal scroll at 320–1920 except intended carousels; long words wrap (`overflow-wrap: anywhere; min-width: 0`). | P1 |
| `rev.labels` | No two-line button, tab or nav labels at any width — Arabic strings run longer. | P2 |
| `rev.sticky` | Sticky header, sticky contact bar and dropdowns don't cover focused content or each other. | P2 |

## D. System fidelity

| id | gate | prio |
|---|---|---|
| `rev.tokens` | Every colour, space, radius, shadow, size is a token; nothing off-scale (no 13px, 18px, 1.5×). `npm run check:design`. | P1 |
| `rev.parts` | Built from existing components (`src/components/`, `patterns.css`) before anything new. A new part is said out loud and logged in `docs/PROPOSALS.md`. | P1 |
| `rev.accent` | Red is the one action colour. Purple/indigo/teal are accents, never a CTA. Accent stays a small share of the view. | P1 |
| `rev.icons` | Icons via the `icons` skill: one pack, rounded outlined, no emoji, no meaningless decorative icons. | P1 |
| `rev.motion` | Nothing scales or bounces; no `transition: all`; reduced-motion honoured. | P2 |
| `rev.type` | Only the scale (1.2–3.2rem), weights 400/600/700, Proxima Nova / GESS. Run `design-typography`. | P1 |

## E. Accessibility (judged, not only linted)

| id | gate | prio |
|---|---|---|
| `rev.contrast` | Text ≥4.5:1, large text/icons/focus ≥3:1. 10 of 24 palette pairings fail AA (`RULES.md` §4b) — check the actual pair. `npm run check:a11y`. | P0 for primary content |
| `rev.names` | Icon-only buttons named; decorative SVG `aria-hidden`; headings in order. | P1 |
| `rev.targets` | ≥24px, 44px on mobile. | P1 |
| `rev.rtl` | Mirrors in Arabic; logical properties only (`npm run check:rtl`); run `rtl-arabic` for Arabic screens. | P1 |

## F. Ignore these borrowed rules (they impose someone else's taste)

Font bans (Inter/Roboto/system), "never pure #fff/#000", tinted neutrals, card radius
12–16px (ours caps at 1.2rem), mandatory bold tone, "no uppercase labels" (the footer
headings are measured), "vary structure between pages", hero padding ratios, eyebrow bans,
display sizes up to 6rem (ours caps at 3.2rem). Generic idea kept from the gradient/glass
bans: **no effect the measured system doesn't contain** — and gradients/glass/glows are in
the system now (`RULES.md` §1, §2a), used by role.

## G. Heuristic score

Score 0–4 each, with one line of evidence: visibility of system status · match with the
real world · user control and freedom · consistency and standards · error prevention ·
recognition over recall · flexibility and efficiency · aesthetic and minimalist design ·
help users recover from errors · help and documentation.

## Output

```
Verdict: Fix then ship
P0  rev.metrics   hero      "Trusted by 1M+ sellers" is invented → remove or label "figure to confirm"
P1  rev.density   results   2.4rem gaps between cards → --space-3 (1.2rem, measured)
...
Heuristics: 31/40 (lowest: error recovery 2 — upload failure has no retry)
Proposals raised: none / list
```

Then fix, re-review, and hand to `design-qa`.

## Sources

Read first-hand: Hallmark `references/slop-test.md` (58 gates) · Impeccable `reference/audit.md`,
`critique.md`, `craft-floor.md` · Anti UI Slop (awesome-copilot) `SKILL.md`, `reference/audit.md` ·
Anthropic `skills/frontend-design/SKILL.md` · Vercel Web Interface Guidelines. Nielsen's 10
heuristics (nngroup.com, via search). Gates are paraphrased and adapted, not copied.
