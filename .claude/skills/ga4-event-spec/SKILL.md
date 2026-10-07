---
name: ga4-event-spec
description: >-
  Turn a dubizzle feature's tracking.json into what engineers implement in Google Analytics 4 for any
  tenant: GTM dataLayer pushes for web, Firebase logEvent for the apps, ecommerce items for listings
  and paid features, custom definitions to register, key events, consent and the DebugView check.
  Use when someone asks for the "GA4 spec", "dataLayer", "GTM", "Firebase events", "how do devs
  implement this tracking", or a tracking plan needs implementation detail beyond the deliverable.
version: 1.0.0
---

# GA4 event spec

The deliverable's **Analytics and tracking** section (built from `tracking.json`) already gives the
events, parameters, one dataLayer example, custom definitions, per-tenant ids and the QA list. Use
this skill when engineering needs more: every push written out, app parity, ecommerce, consent.

## Steps

1. Read the feature's `tracking.json`, the catalog and `design-kit/analytics/tenants.json`.
2. **Web (desktop + mobile web):** one `window.dataLayer.push({event, …})` per event, with fixed
   `params`, `dynamic` parameters shown as their catalog example, and the shared parameters.
3. **Apps:** the same name and parameters for Firebase `logEvent`. Apps are outside this design
   system's measured platforms — mark app behaviour unverified.
4. **Ecommerce:** listings in `items[]` — `item_id` = ad id, `item_category` = category path,
   `item_brand` = make (motors) or developer (property), `price`; `currency` at event level from
   the tenant. `purchase` / `begin_checkout` are **paid features only** (Featured, Elite, packages).
5. **Custom definitions:** every parameter a report needs, with scope (event / user / item). Ask what
   the property already has before adding — properties have a limit.
6. **Key events:** default `generate_lead`, `submit_ad`, `purchase`, `sign_up`; per tenant only if
   `tenants.json` `key_events` says otherwise.
7. **Consent:** which events may fire before consent, per tenant's `consent_mode` (null = ask).
8. **DebugView plan:** per tenant property — event appears once, at the `fires_on` moment, every
   parameter present, no personal data.

## Rules

- **GA4 limits change.** The catalog's `naming.limits` are a snapshot; check Google's current
  collection limits before a release and update `limits_source` with the date.
- Never send personal data; strip phone numbers from any free-text parameter (`search_term`).
- Never put an id in the spec that `tenants.json` does not hold.
- Output to `design-kit/deliverables/<feature>/ga4-spec.md` (internal, like the deliverable).
