# Severity and waivers

## The three levels

**blocker** — downstream work stops. Reserved for failures that would ship a broken screen or
make a deliverable misleading:

- a required state missing entirely from an authored screen
- a flow transition pointing at a node or screen that does not exist
- a hex/rgb/px value or `style=` attribute outside the token system on an authored screen
- a `var(--x)` that resolves to nothing
- an interactive target under the platform's `hit_target_min`
- placeholder text (`lorem`, `TODO`, `TBC`) in a user-visible string
- horizontal overflow at a declared width, or a 200-character string breaking layout
- a real name, phone or email in a generated page (`prv.*`)

**warning** — proceeds, carried into open questions. Probably wrong but maybe intentional, or a
sampled rather than required case.

**note** — informational: observations, counts, everything found on a `live` screen.

## The live cap

`origin: live` findings are capped at `note` (`capped_from` records the original level),
with two exceptions: `prv.*` privacy findings are never capped, and `cov.file` (registered file
missing on disk) is capped at `warning`, because a stale registry is real.

The reason is stated in SKILL.md: a snapshot of production cannot be fixed, and a report that is
permanently red is a report nobody reads. If a design changes a live template, register it as
`authored`.

## Why the policy is written down

Without it severity gets argued instance by instance, and the argument always resolves toward
shipping. Written down, the conversation is "should this *check* be a blocker" — a design
question — not "should this *instance* block", which is just pressure.

## Waivers

A blocker can be waived. It cannot be waived silently. `design-kit/qa/waivers.json`:

```json
{
  "waivers": [
    {
      "check": "a11y.target",
      "screen": "web-mobile/agency-leads",
      "css_path": "div.leads-table > a.row-action",
      "reason": "22px icon link inside a dense table; the row itself is a 48px target",
      "granted_by": "umair",
      "granted_on": "2026-09-29",
      "expires_on": "2026-12-31"
    }
  ]
}
```

Rules:

- Per check per element — `node` (a `data-node-id`) or `css_path` is **required**. A waiver with
  neither is ignored and reported as an error: a blanket waiver disables a check, which is a
  different decision made in the catalogue.
- A reason a stranger can evaluate. "Known issue" is not a reason.
- It expires. An expired waiver reverts the finding to a blocker on the next run — the mechanism
  that stops waivers accumulating into a permanently green report on a permanently broken design.
- Waived findings stay in the report with `"waived": true` and appear in the deliverable's open
  questions.
- Only the user grants waivers. Claude proposes one; it never writes one unprompted.

## What is not allowed

Lowering a check's severity to make a report pass. If a check is genuinely too strict, change it
in `references/checks.md` and `scripts/run.py`, bump the skill version, write the reason in
`CHANGELOG.md`. One is a decision with a record; the other is erosion.

## Known product colours

`check:a11y` reports that 14 of 24 palette pairings fail AA (`--color-warning` 1.70:1, etc.).
These are **production values — never "fix" them** (RULES.md). QA reports a colour pairing
failure on an authored screen only when the screen *uses* the failing pair for body text; the
palette-wide count is a single `note`.
