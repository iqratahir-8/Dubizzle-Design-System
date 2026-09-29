# The QA gate

## Policy

Run design-qa before building anything. Read `design-kit/qa/report/report.json`. Then:

| report verdict | action |
|---|---|
| `pass` | build |
| `pass_with_warnings` | build; every warning goes into open questions (the builder does this) |
| `blocked` | stop; report the blockers; do not build |

A deliverable built on a failed design is worse than no deliverable. It is a confident,
circulated, hard-to-retract record of something broken, and it will be implemented from.

`build_deliverable.py --allow-blocked` exists for debugging the builder. It stamps the document
`DRAFT: QA is BLOCKED` in the banner. Never use it to produce something that leaves the team.

## What the gate also checks

- the report covers every page in `deliverable.json` (a report for a different page is refused —
  a green report for `payment` says nothing about `favourites`)
- `schema_version` is one this skill accepts (`1`) — otherwise stop, do not guess at the shape
- `deliverable.json` has a changelog entry for the version being built

## Ready to QA

Before invoking QA: every screen the registry names for the feature exists on disk, the intake
table is filled and confirmed. If not, the problem is upstream — say so rather than QA'ing a
half-built screen set and reporting fifty findings that are all the same fact.

## Waivers

Waivers live with QA (`design-kit/qa/waivers.json`), not here. This skill reads them; it never
grants them. Granting one from inside the deliverable build would mean the thing being gated
controls the gate. Every waived blocker appears in open questions with its reason, who granted
it, and its expiry. A reader must never open a deliverable unaware that something was waived to
produce it.

## What QA feeds

| report content | section |
|---|---|
| state coverage (`cov.*`) and the states registry | `state-screens` |
| `section_hint: edge-cases` (`ovf.*`, `brk.*`) | `edge-cases` |
| `section_hint: accessibility` (`a11y.*`, `mot.*`, `rtl.*`) | `accessibility` |
| `checks_run` with status `pass` | `acceptance` |
| skipped checks | `acceptance` → "Not verified" |
| warnings, waived blockers | `open-questions` |

`scripts/consume_report.py` does the mapping. Findings on frozen live captures (`origin: live`,
capped at note) are summarised, not listed — they describe production, not this design.

## When QA and the design disagree

QA is right by default. A check that fires on a correct design is a bug in the check: fix it in
the QA skill with a changelog entry — not worked around here, not silenced by lowering a severity.
