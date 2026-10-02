---
name: design-deliverables
description: >-
  Produce a dubizzle design deliverable — one self-contained HTML document with every asset
  inlined, covering summary, interactive prototype, screens with redlines and stable numeric node
  ids, state screens, rules, edge cases, tokens, accessibility, acceptance criteria and open
  questions. Use whenever a design is finished and needs handing to engineering, review or
  sign-off; whenever the user says design deliverable, handoff, hand-off, redlines, design spec,
  "the deliverable", "something to send to the devs/PM", or asks what to give the implementing
  team once screens exist. Runs design-qa first as a gate and refuses to build on unresolved
  blockers. Covers web desktop, web mobile and the desktop-only agency portal (dubizzle Pro).
  Never invents content to fill a section and never changes a token, a screen or a stylesheet.
version: 1.0.2
---

# Design Deliverables — dubizzle Egypt

Turn finished screens into one self-contained HTML document an engineer can implement from
without asking a follow-up question.

## The one hard output rule

**Every deliverable is a single HTML file with every asset inlined.** Fonts as base64, images as
data URIs, CSS and JS in `<style>` and `<script>`. No network requests, no sibling files, no CDN.

These documents get emailed, dropped in Slack, opened offline, and opened again in two years. A
document that renders differently depending on what is reachable is not a record of anything.
Sources live split in git; `scripts/bundle.py` produces the file as a build artifact. Never
hand-edit a bundled file — edit the sources, rebuild.

**It is INTERNAL.** dubizzle's Proxima Nova / GESS fonts are licensed and are inlined. Every
document carries an `INTERNAL — do not share outside dubizzle` banner and a
`classification` meta tag, and `bundle.py` refuses to write a file whose text contains a
phone-like or email-like value (account captures are redacted before they reach disk; this is the
second net). The document is not for the public web or for external agencies without clearing the
font licence first.

## Audience

Three, and they want different things: **web engineers** (scope, constraints, redlines, tokens),
**Pro portal engineers** (the same, desktop only, D-012), **stakeholders / PMs** (the problem, the
decision, what is open). Ask which one leads; the summary changes and so does whether redlines
lead or sit later. Do not average them.

## Run order

1. **Gate.** Read `references/gate.md`. Run `design-qa` for the pages in scope, read
   `design-kit/qa/report/report.json`. Unwaived blockers → stop and report them. Do not build a
   deliverable on a design that failed QA.
2. **Intake.** Fill `design-kit/deliverables/<feature>/deliverable.json`
   (`references/deliverable-json.md`) from the PRD and the QA report first; ask only about gaps.
   Show the filled table (below) before building — confirming ten rows costs a message;
   rebuilding a seventeen-section document costs an afternoon.
3. **Flows.** If the feature has a flow, write `flows.json` and register it
   (`references/flows.md`). No flow, no prototype section — say so.
4. **Build.** `python3 .claude/skills/design-deliverables/scripts/build_deliverable.py --feature <f>`.
   It gates, assigns ids, generates the data-driven sections, assembles and bundles. Read
   `references/sections.md` for what each section needs and which are generated.
5. **Version.** Bump `version` in `deliverable.json` and add a changelog entry — the build refuses
   without one. The builder appends the node-id diff (added / retired / changed) automatically.
6. **Report** one line: feature, version, sections included and excluded (with reasons), open
   question count, size against the 12 MB budget. Never paste the document into chat.

## Intake table

Propose an answer and a confidence for each; ask only what you cannot fill.

| # | question |
|---|---|
| 1 | Feature name and deliverable id — new deliverable or a new version of an existing one? |
| 2 | Platforms — `web-desktop`, `web-mobile`, `portal-desktop`; one document or one per platform? |
| 3 | Audience — implementing engineer, reviewing designer, approving stakeholder? |
| 4 | Scope — which pages and states? (derive from the registry and the QA matrix; confirm) |
| 5 | Locales — English only (default; Arabic is parked) or Arabic too? |
| 6 | Which sections apply? Propose from the content; confirm the exclusions. |
| 7 | Is there motion? Motion here is unmeasured (`motion-design`): if it is not measured, the section says so rather than inventing a value. |
| 8 | Are assets final or placeholder (illustrations, photos)? |
| 9 | Who signs off, and what does sign-off mean here? |
| 10 | QA warnings to carry into open questions, or resolve first? |

## Sections

Canonical set in `schema/sections.json` with stable string ids. **Display numbers are computed at
render time** from which sections apply — never hardcode one, or adding a section forces a
lettered insert and section numbers stop being stable references across deliverables.

| id | title | generated from |
|---|---|---|
| `summary` | Summary | deliverable.json |
| `prototype` | Interactive prototype | flows.json (when a flow exists) |
| `button-states` | Button states | patterns.css: which states the system *declares* per component on these screens |
| `state-screens` | State screens | registry + QA (`cov.*`) |
| `screens-redlines` | Screens, states and redlines | screens + node ledger |
| `rules` | Rules | deliverable.json (each needs a test) |
| `motion` | Interaction and motion | deliverable.json, only when measured values exist |
| `dotlottie` | dotLottie | the system ships none — normally not applicable |
| `gestures` | Gestures and behaviours | deliverable.json, when web-mobile is in scope |
| `edge-cases` | Edge cases and error states | QA `ovf.*`, `brk.*` + authored |
| `assets` | Assets | images/icons the screens use |
| `tokens` | Tokens | filtered: only tokens these screens consume |
| `accessibility` | Accessibility | QA `a11y.*`, `mot.*` |
| `performance` | Performance budget | only when a budget with a source is declared |
| `acceptance` | Acceptance criteria | QA `checks_run` passes + authored |
| `platform-notes` | Platform notes | registry `unpaired` + QA `par.*` |
| `open-questions` | Open questions | QA warnings, waived blockers, authored |

`button-states`, `state-screens` and `edge-cases` are one concept at three scopes — component,
screen, failure. Reviewers read them differently so they stay separate, but all three generate from
one source (the registry's declared states plus QA findings). Authoring them independently
guarantees drift.

A section that does not apply is shown in the TOC as `n/a` **with its reason**. Never pad.

## Node ids

Figma-shaped `{screen}:{node}` → `7:147`. The ledger `design-kit/qa/ids.json` allocates a screen
number per `platform/page[#state]` on first sight and a node number monotonic within it.
The requirement is **stability**: inserting a row must not renumber everything below it, or every
redline reference in every ticket silently points at the wrong element. Ids are assigned once,
matched on regeneration by role + structural path + fingerprint, never reused (a deleted node
retires). Full rules in `references/ids.md`. Commit `ids.json`.

Source screens are **never modified**: ids are written into an in-memory copy at build time.

## Interactive prototype

Generic per feature: `flows.json` with transitions keyed on node ids, not CSS selectors. The
runner has forward navigation, back, reset, a screen picker, hotspot reveal, and deep links
(`?screen=…`). Never write flows specific to one feature into this skill.

## Versioning

Three independent numbers.

- **Skill version** — frontmatter and `CHANGELOG.md`. Semver.
- **Deliverable version** — per document, in `deliverable.json`, shown in the header, recorded in
  `dist/manifest.json`, with a changelog inside the document and the node-id diff.
- **Report schema version** — owned by design-qa. This skill accepts `1` and stops on anything else.

## What this skill must not do

- Never change tokens, CSS or screen markup. If the design is wrong that is `feature-design`'s
  job. A deliverable that quietly fixes something documents a screen that does not exist.
- Never restate the full token set. The tokens section is a filtered view.
- Never invent content to fill a section (motion values, performance numbers, rules, copy).
- Never hand-edit a bundled file.
- Never grant a waiver, and never lower a severity to get past the gate.
- Never read design-qa's internals. The contract is `report.json`.

## Known limits — say them when they matter

- Only **authored** screens can be deliverables. A frozen live capture is a reference, not a design;
  a revamp is registered as authored (`based_on` the live id).
- Button states show what `patterns.css` declares, not rendered hover/focus states.
- Fonts are pruned by rule (no Arabic faces without `ar`, no unused weights), not glyph-subset.
- The prototype runner was checked in headless Chrome on a two-screen flow (click hotspot, back, reveal,
  reset), not on a real multi-screen feature yet.
