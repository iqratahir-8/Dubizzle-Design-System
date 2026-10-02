---
name: design-inspiration
description: >-
  Research references for a dubizzle Egypt design the right way — find how shipped products
  (classifieds competitors, Mobbin, Page Flows, Baymard) solve a pattern, extract the structure
  and states, and rebuild it from dubizzle's own components and tokens without copying anyone's
  look. Use when someone says "find inspiration", "how do others do X", "competitor analysis",
  "references for", "show me examples", "what does OLX / Bayut / Property Finder do", or when a
  pattern has no precedent in the captures.
---

# Inspiration — references without copying

dubizzle's own live captures are the first reference, always. Look outside only when the
captures have no answer (`docs/PAGE-COVERAGE.md`, `design-kit/reference/live/`, the
`feature-design` "is it already captured?" check).

## 1. Ask a question before opening a gallery

Write the one thing you need to learn: *"How do classifieds show a price drop on a listing
card?"*, *"What does a zero-results search offer instead?"*. Search only when an example
could change the design. Refine the query at most once. Browsing without a question produces
moodboards, and moodboards produce slop.

## 2. Where to look (in order)

| Source | Good for | Notes |
|---|---|---|
| dubizzle captures | everything already shipped | ground truth — `live-capture` to refresh |
| **Mobbin** | real shipped mobile/web screens and flows, searchable | Mobbin MCP is connected here: `search_screens`, `search_flows`, `search_sections` |
| Page Flows | recorded end-to-end journeys (onboarding, checkout, posting) | |
| Baymard | research-backed e-commerce patterns (lists, filters, forms) | evidence, not looks |
| Classifieds competitors | how the same job is done in the same market | see §3 |
| ✗ Dribbble, Behance, template stores | — | unshipped, aesthetic-first; never a source for a product surface |

## 3. Competitor set — compare one flow across all of them

**Same region / bilingual:** Dubizzle UAE, Bayut, Property Finder, OLX (other markets),
Hatla2ee, ContactCars, Aqarmap. **Global classifieds:** Facebook Marketplace, Avito,
Leboncoin, Kijiji, Craigslist.

Flows worth comparing: search + filters · listing card · ad detail + contact · post an ad ·
chat · saved searches/alerts · seller profile · verification. Pick **one** flow, look at it in
**at least three** products — one example is a copy; three show a convention, and users
expect conventions (Jakob's law).

Judge them by task, not looks: how many steps, what's on screen at the decision point, what
happens on error and on empty. Note the trade-off each team made.

## 4. Extract structure, not pixels

For each reference record:

- **Hierarchy** — what is loudest, what order things appear in
- **Parts** — which components (card, chip row, sheet, sticky bar…)
- **States shown** — empty, loading, error, zero results, offline
- **Copy intent** — what each label/message has to achieve (not its wording)
- **Interaction** — gestures, disclosure, what persists (URL, scroll)
- **Edge cases** — long titles, no photo, price on request
- **RTL / bilingual** — how it mirrors, how long Arabic strings fit

## 5. Rebuild from dubizzle parts

Map every extracted part to an existing dubizzle component or pattern
(`src/components/`, `design-kit/patterns/patterns.css`), using only tokens. What has no
dubizzle equivalent is **new**: say so, and log it in `docs/PROPOSALS.md` (`RULES.md` §6).
The reference's colours, fonts, radii, icons, illustrations, photos and copy never come along.

## 6. Legal and ethical line

Copyright protects expression, not ideas or functional layout — but distinctive look-and-feel
can be protected as trade dress, and GUI designs can be registered. So: never copy another
product's graphics, icons, illustrations, photography, copy or its exact layout. Take only the
structural or interaction lesson that answers your question.

## 7. Record provenance

In the design notes, per reference: product, URL or Mobbin id, date seen, the lesson taken,
and that it is an external reference. A pattern shipping elsewhere is **not** proof it is right
for dubizzle Egypt — mark it unverified until measured or tested here.

## Output

```
Question: how do classifieds show "price reduced" on a card?
Looked at: Bayut (web), Property Finder (app), Avito (web) — Mobbin ids …, 2026-10-01
Convention: strikethrough old price + small reduction badge under the price, not on the photo
dubizzle build: AdCard price row + existing Pill (sm) — new: strikethrough style → PROPOSALS.md
Not taken: Bayut's green badge colour, Avito's icon
```

## Sources

Anti UI Slop reference policy (question-first, structural lessons only) · Hallmark `study`
(refuses Dribbble/Behance, asks for provenance) · NN/g competitive usability evaluations (via
search) · Mobbin / Page Flows reviews (via search) · asiaiplaw, "UI and UX: protecting the
modern interface" (via search). Adapted, not copied.
