---
name: funnel-analysis
description: >-
  Build and read GA4 funnels for dubizzle flows in any tenant — browse to lead, DPV contact, Post an
  Ad, paid features, favourites, saved searches, login wall, permission prompts — from the standard
  definitions in design-kit/analytics/funnels.json, via the BigQuery GA4 export, a GA4 Funnel
  exploration or a CSV, split by tenant, surface and language. Use when someone asks "where do users
  drop", "build a funnel", "conversion for X", "which step loses sellers", or before designing a fix
  to a flow.
version: 1.0.0
---

# Funnel analysis

## 1. Pick the funnel

Start from `design-kit/analytics/funnels.json`. A new feature gets a new entry there, built only
from catalog events — a step with no event means tracking is missing: go to `analytics-tracking`.
Changing a standard funnel needs a `docs/DECISIONS.md` entry; it breaks every before/after.

Each definition states steps (2–6), type (closed by default), order (indirectly followed by), window,
unit (users), breakdowns (`tenant`, `surface`, `ui_language`, `vertical`) and any step filter.

## 2. Get the numbers — in this order

1. **BigQuery GA4 export** (if a BigQuery connector is connected): `references/funnel.sql`.
   One dataset per GA4 property — `tenants.json` `bigquery_dataset`. If tenants have separate
   properties, run per dataset; don't trust a `tenant` parameter you have not seen populated.
2. **GA4 Funnel exploration**: Explore → Funnel exploration → steps → open/closed → "indirectly
   followed by" → "within" window → breakdown → elapsed time on. GA4 applies thresholding to small
   segments; say so when it does.
3. **A CSV** the user exports and attaches.

Always compute in code. **Never estimate a number in prose.** No data → no readout; say what is needed.

## 3. Read it

- Step conversion and overall conversion, per segment.
- The biggest **absolute** drop (most users lost) and the biggest **segment gap** at one step
  (Arabic mobile vs English desktop, KW vs EG). Those two findings lead.
- Under ~500 users at step 1 (`defaults.min_users_step1`): low confidence, say it.
- Tracking health first: a step converting above 100%, or falling to ~0 overnight, is a tracking bug.
- Never blend tenants into one number. Prices and decimals differ; so does the product.

## 4. Output

`references/readout.md` template → `design-kit/deliverables/<feature>/analytics/funnel-<id>-<date>.md`.
End with three hypotheses design can test ("we believe … because …; we'll know if … moves").
Aggregates only — no user-level rows in any file.
