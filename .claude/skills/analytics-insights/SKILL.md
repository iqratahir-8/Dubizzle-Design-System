---
name: analytics-insights
description: >-
  Use GA4 data in dubizzle design work for any tenant: before design, find where a flow loses people
  and feed it into feature-design as evidence; after launch, read the feature's metrics against its
  tracking.json (equal before/after windows, seasonality, guardrails, A/B readouts) and record the
  decision. Use when someone asks "how is X performing", "did the redesign work", "post-launch
  review", "A/B result", "what does the data say", or brings GA4 / BigQuery exports to a design question.
version: 1.0.0
---

# Analytics insights

Funnels themselves are `funnel-analysis`. This skill puts the numbers into design decisions.

## Data, in order

BigQuery GA4 export (connector) → a GA4 reporting connector → CSV / screenshots the user attaches.
Compute in code; never estimate in prose. State source, range, and any GA4 sampling or thresholding.

## Before design (discovery)

1. Run the standard funnel for the flow (`funnel-analysis`), per tenant.
2. Turn the top drop-offs into evidence for `feature-design`'s product pass: which step, which segment,
   how many users. A drop on an event that is only `proposed` is not evidence — it has no data.
3. Anything inferred (not measured) goes to `docs/PROPOSALS.md` and is said out loud.

## After launch

1. Read the feature's `tracking.json` metrics and guardrails. Same funnel definition as before launch,
   or the comparison is invalid.
2. Equal windows, same weekdays. Note Ramadan, Eid, White Friday and campaigns per tenant — they
   differ by market.
3. A/B: report sample size and confidence; no winner on an under-powered test.
4. Output `design-kit/deliverables/<feature>/analytics/readout-<date>.md`: metric table per tenant,
   guardrails, what else changed in the window, decision (keep / iterate / roll back).
5. Record the decision in `docs/DECISIONS.md` and the outcome in `PROGRESS.md`.

## Rules

- Per tenant, always; a blended number hides a market-specific break.
- Correlation is not cause — list what else shipped in the window.
- Aggregates only. No user-level data in the repo; it must stay private either way.
