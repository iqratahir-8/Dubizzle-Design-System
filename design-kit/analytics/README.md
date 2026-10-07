# Analytics — all tenants

The only multi-tenant layer of this design system. Everything else (tokens, components, templates)
is measured on **dubizzle Egypt**; this folder lets the same designs carry a GA4 tracking plan for
EG, KSA, KW, BH, OM and JO.

| file | what | edited by |
|---|---|---|
| `tenants.json` | origin, currency + decimals, Arabic dialect, GA4 / GTM / Firebase / BigQuery ids, key events, shared parameters | the analytics owner, or `extract:tracking --write` (fills empty ids only) |
| `event-catalog.json` | every event, its parameters, status and where it has been seen live | `event-taxonomy` skill |
| `funnels.json` | standard funnel definitions | `funnel-analysis` skill (+ a DECISIONS entry to change one) |
| `live/<TENANT>.json` | what a live site actually sent on page loads | `npm run extract:tracking -- --tenant=XX` |

**Truth levels.** `null` = unknown. Catalog events are `proposed` until seen on live
(`observed_live.<TENANT>`) or approved by the analytics owner. Nothing in here was guessed: tenant
origins were checked on the public sites on 2026-10-07; every id is still `null`.

**Commands**
- `npm run check:tracking` — validates the catalog and tenants; `-- --feature <f>` also checks that
  feature's `tracking.json` (same rules as `design-qa`'s `trk.*`).
- `npm run extract:tracking -- --tenant=EG [--paths=/en/,/en/motors/] [--layout=mobile] [--write]` —
  read-only, public pages, page loads + scrolling. Never stores client ids or parameter values (one
  digit-masked example per parameter). Needs network access to the tenant site — run it on the Mac.

**Per feature:** `design-kit/deliverables/<feature>/tracking.json`, registered as
`registry.features[<feature>].tracking`. Worked example: `favourites-revamp`.
