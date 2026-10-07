---
name: analytics-tracking
description: >-
  Plan the analytics for a dubizzle design — any tenant (EG, KSA, KW, BH, OM, JO): turn the brief's
  metrics into GA4 events, reuse the shared catalog before inventing, and write the feature's
  tracking.json that design-qa checks (trk.*) and design-deliverables renders as "Analytics and
  tracking". Use when someone says "tracking", "events", "GA4", "Google Analytics", "dataLayer",
  "Firebase", "what should we track", "how do we measure this", or when a design reaches hand-off
  without a tracking plan.
version: 1.0.0
---

# Analytics tracking — entry point

An **orchestrator**, like `design-to-handoff`. It owns the metric → event plan for one feature.
Naming and the catalog belong to `event-taxonomy`; implementation detail to `ga4-event-spec`;
reading data to `funnel-analysis` and `analytics-insights`. Do not restate their rules here.

```
brief metrics → actions in the flow → event-taxonomy (reuse / parameter / new) → tracking.json
             → npm run check:tracking -- --feature <f> → design-qa (trk.*) → design-deliverables (tracking section)
```

## Ground rules

1. **Read `PROGRESS.md` and `design-kit/analytics/README.md` first.** Tenant facts live only in
   `design-kit/analytics/tenants.json`. The rest of this design system is measured on **Egypt only**:
   tracking can be planned for any tenant, but never imply a KSA/KW/BH/OM/JO screen is verified.
2. **Live wins here too.** A catalog event is a *proposal* until `npm run extract:tracking` sees it on
   that tenant's live site (`observed_live`) or the analytics owner confirms it. Say which, out loud.
3. **No metric, no event.** Every event measures a metric from the brief (or is `debug_only`).
4. **Never write a GA4 / GTM / Firebase id from memory.** Unknown stays `null`; ask the owner.
5. **No personal data in any parameter** — names, phones, emails, message text, exact location.
6. **Keep `PROGRESS.md` current** after the plan is written (CLAUDE.md rule 2).

## Steps

1. **Metrics.** Take the primary metric and guardrails from the intake / `deliverable.json`. If none,
   propose them with a confidence and ask once (AskUserQuestion).
2. **Actions.** Walk the feature's `flows.json` screen by screen and list every user action and every
   screen view that a metric needs. Each action names its flow **screen id** and, where it has one, its
   **node id** from `design-kit/qa/ids.json`.
3. **Events.** Run `event-taxonomy` on the list. It answers reuse / parameter / new for each action and
   adds any new event to the catalog as `proposed`.
4. **Write `design-kit/deliverables/<feature>/tracking.json`** (shape below) and register it:
   `registry.features[<feature>].tracking` in `design-kit/qa/registry.json`.
5. **Check.** `npm run check:tracking -- --feature <feature>` until it has no blockers. Then
   `ga4-event-spec` for anything the engineers need beyond the deliverable's tracking section.
6. **Hand over** through `design-qa` → `design-deliverables` as usual; the tracking section appears by
   itself once `tracking.json` is registered.

## tracking.json

```json
{
  "feature": "favourites-revamp", "version": 1, "tenants": ["EG"],
  "metrics": [{"id": "M1", "kind": "primary", "name": "…", "definition": "users with X / users with Y", "events": ["X", "Y"]}],
  "events": [{"id": "E1", "action": "what the user does", "event": "select_item", "decision": "reuse|parameter|new",
              "screens": ["list", "m-list"], "node": "5:1043", "params": {"item_list_id": "favourites"},
              "dynamic": ["item_id", "index"], "key_event": false}],
  "open_questions": [{"q": "…", "owner": "…", "blocks": "…"}]
}
```

`params` are fixed values for this feature; `dynamic` are parameters filled at runtime. Shared
parameters (`tenant`, `vertical`, `surface`, `ui_language`, `page_type`, `user_type`) need not be
listed except to fix a value. The worked example is `design-kit/deliverables/favourites-revamp/tracking.json`.

## Multi-tenant

- One `tracking.json` per feature, `tenants` lists where it ships. Same event names in every tenant.
- Money: numbers plus the tenant's ISO code; KWD, BHD, OMR, JOD have **3** decimals, EGP and SAR 2.
- A tenant with no GA4 ids recorded gives `trk.ids` (warning): the plan is fine, but QA cannot verify it
  in DebugView there yet.
