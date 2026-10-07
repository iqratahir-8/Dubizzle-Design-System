---
name: event-taxonomy
description: >-
  Own dubizzle's shared analytics event catalog (design-kit/analytics/event-catalog.json) for every
  tenant: decide whether a design action reuses an event, adds a parameter, or needs a new event;
  name new events by the GA4 rules; keep statuses (proposed → approved → live → deprecated) honest.
  Use when naming an event, asking "does an event for this exist", "what should this event be called",
  reviewing tracking consistency across tenants, or adding events found on live.
version: 1.0.0
---

# Event taxonomy

`design-kit/analytics/event-catalog.json` is the single list of events for EG, KSA, KW, BH, OM and JO.
Edit it only through this skill, and run `npm run check:tracking` after every edit.

## The three questions (in order — create only at 3)

1. **Does a catalog event already cover this action?** Reuse it. A WhatsApp button is `generate_lead`.
2. **Is it a variation of one?** Set a parameter: `lead_channel`, `source`, `item_list_id`.
   **Exception:** never give a GA4 *recommended* event the opposite meaning through a parameter —
   GA4's own reports count it. Removing a favourite is `remove_from_wishlist`, not
   `add_to_wishlist` + `action=remove`.
3. **A genuinely new intent?** Add it with `status: "proposed"`, `proposed_for: "<feature>"`:
   - name `verb_object`, snake_case, ≤ 40 chars, the GA4 recommended name if one fits
     (`search`, `view_item_list`, `select_item`, `view_item`, `add_to_wishlist`, `share`,
     `generate_lead`, `begin_checkout`, `purchase`, `sign_up`, `login`);
   - not a reserved name or prefix (`naming.reserved_*` — `check:tracking` enforces it);
   - `fires_on` names the exact moment: render, tap, or **the request succeeding** — never "on click"
     for something that can fail;
   - parameters with type, example and `required`; shared parameters are never redeclared;
   - tenant **never** in a name — it is the `tenant` parameter.

Output a table: action → decision → event → parameters, before touching the file.

## Statuses

| status | meaning | who sets it |
|---|---|---|
| `proposed` | designed here, not seen on live | this skill |
| `approved` | the analytics owner signed off the name and parameters | the owner, at hand-off |
| `live` | observed on live (`observed_live.<TENANT>` has a date) | `npm run extract:tracking -- --tenant=XX --write` |
| `deprecated` | replaced; keeps `replaced_by` and a date — **never delete** | this skill |

**Live names win.** When `extract:tracking` reports an event live but not in the catalog, add it with
its live name even if it breaks the convention, and record the exception in `docs/PROPOSALS.md`.
Renaming a live event breaks every report: only with a dual-firing period the owner agrees to.

## Same feature, other tenant

It uses the same names. If a tenant genuinely tracks differently (a vertical it lacks, a payment step),
say so in that feature's `tracking.json` `open_questions` — no tenant-specific copies of an event.
