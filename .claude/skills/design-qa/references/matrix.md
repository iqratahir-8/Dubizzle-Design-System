# The case matrix

## Why classify instead of enumerate

Five states × three roles × two flags × three platforms × two locales × four breakpoints is
720 cases for one screen. Nobody reviews that, and a report nobody reads is no report.
`scripts/matrix.py` assigns every case to one of four classes; only the first two are
guaranteed to run.

## The four classes

### required
Every declared state × every platform in scope, at the default role and the primary locale, at
the platform's `default_width` (1440 desktop, 390 mobile).

The floor. It is small and it is where the commonest failure lives: a state that was never drawn.

**Empty is required even when the registry does not declare it.** If a screen can show a list
(search, favourites, my ads, chat, leads, candidates), it can show an empty list. Screens that
never list anything (login, payment) declare `"no_list": true` in the registry to opt out — the
opt-out is visible in the matrix as an excluded case with that reason.

### required-if-differs
A role or flag combination is promoted to required when the registry says it changes the surface:
`role_differs` names roles, `flags` names feature flags gating the page. Derived, never guessed.
A flag that gates nothing on this screen is not a case.

Roles in dubizzle Egypt (`design-kit/qa/product/roles.md`): `signed-out`, `signed-in`,
`agency` (dubizzle Pro portal). Flags: `design-kit/qa/product/flags.md` — none registered yet.

### sampled
Everything else: remaining locales, remaining breakpoints. One representative per family,
deterministic (sort by a stable key, take the first). Random sampling makes two runs of the same
screen disagree and hides regressions.

### excluded
Impossible or meaningless combinations, each with a stated reason:

- `no-permission` × `empty` — the role cannot see the list to find it empty
- `flag-off` × `loading` / `empty` — the surface is absent
- `loading` × content extremes — nothing rendered yet to overflow
- `agency` × `web-mobile` — dubizzle Pro has no mobile layout (D-012)

An exclusion without a reason is a gap pretending to be a decision.

## Origin changes the matrix

`origin: live` screens are frozen snapshots: only their captured state can be tested, so the
matrix holds their default case (per platform they exist on) plus `empty` as a *required* case
that will report "not captured" as a note. Authored screens get the whole matrix.

## Showing the matrix before running

The matrix is the scope. Present it as a count per class plus the full required list. Correcting
scope now costs one message; after a render pass it costs a rerun. If the user says a sampled
case matters, add it to the registry's `promote` list and note it so the next run keeps it.

## Output shape

```json
{
  "scope": { "pages": ["favourites-empty-demo"], "platforms": ["web-desktop","web-mobile"], "locales": ["en"] },
  "counts": { "required": 6, "required_if_differs": 2, "sampled": 5, "excluded": 3 },
  "cases": [
    { "id": "favourites/web-mobile/empty/en/default/390", "class": "required",
      "page": "favourites", "screen": "web-mobile/favourites", "platform": "web-mobile",
      "state": "empty", "role": "default", "flags": {}, "locale": "en",
      "width": 390, "promoted_by": null, "file": "design-kit/templates/mobile/favourites-empty.html" }
  ],
  "excluded": [ { "pattern": "no-permission × empty", "page": "favourites", "reason": "…" } ]
}
```
