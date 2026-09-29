---
name: design-qa
description: >-
  Test dubizzle Egypt screens, flows and components against every case that matters — all
  states (default, empty, loading, error, disabled-feature, no-permission), roles, feature
  flags, platforms (web-desktop, web-mobile, agency portal), locales and breakpoints — and emit
  a machine-readable pass/fail report. Use whenever screens or components have been built or
  changed and someone needs to know whether they hold up; whenever the user says design QA,
  design review, check the states, empty states, edge cases, overflow, contrast, responsive
  check, "is this design ready", "is this ready to hand off"; and ALWAYS before a design
  deliverable is produced, because the deliverable consumes this report. Also use on a single
  screen or component on its own. It wraps the repo's existing linters (check:design,
  check:a11y, check:rtl, check:prototype, check:parity, check:live) and adds the checks the
  repo did not have: state coverage, content extremes, breakpoints, flows, parity, reduced motion.
version: 1.0.0
---

# Design QA — dubizzle Egypt

Test rendered design HTML against a case matrix. Produce `report.json` (the machine
contract, schema v1) and `report.html` (for humans).

This skill is a **gate**, not a report generator. Its output decides whether downstream work
(the `design-deliverables` skill, a hand-off, a PR) proceeds. A blocker is a stop, not a note.

## Why this exists here

`feature-design` step 2 says the states people forget — empty, loading, error, validation,
success, signed-out — are *"almost none of them measured"*. Nothing enforced that. The repo
has strong checkers for fidelity (`check:live`, `check:captures`, `check:parity`) and hygiene
(`check:design`, `check:a11y`, `check:rtl`), and none for "is the empty state drawn", "does a
200-character title break the card", "does it hold at 360px", "do web and mobile agree".
That gap is this skill.

## What it does NOT do

- **It does not fix anything.** It reports. Fixing is `feature-design` / `token-check`.
- **It does not change tokens, CSS or markup.** If a check fails, the design is wrong.
- **It does not judge fidelity to live.** That is `check:live`, `check:captures`,
  `check:templates` — this skill can wrap them but never re-implements them.
- **It does not know what a deliverable is.** Never read `design-deliverables`. The contract
  between them is `report.json` and nothing else.

## The two kinds of screen — read this before anything else

Every screen in the registry has an `origin`, and it changes what QA can honestly say.

| origin | what it is | how QA treats it |
|---|---|---|
| `authored` | a screen *we designed* (feature-design output, hand-built template, revamp) | full checks; blockers block |
| `live` | a frozen snapshot of production (`build-live-templates.mjs`, hashed classes, inlined styles) | checks run and are recorded, **findings are capped at `note`** |

A snapshot cannot be "fixed" — its inline styles, hard-coded hex and px are production's,
and `RULES.md` says live wins. Flagging them as blockers would make every run permanently red
and teach everyone to ignore the report. The cap is stated in the report (`capped_from`).

**A revamp is authored.** When a design starts from a live template and changes it, register
the new file as `origin: authored` with `based_on: <live id>`. Do not edit the live template
in place and leave it registered as `live`.

## Inputs

| input | where | required |
|---|---|---|
| `design-kit/qa/registry.json` | `scripts/build_registry.py` seeds it; feature-design adds authored screens | yes |
| screen HTML files | paths named in the registry | yes |
| `design-kit/tokens/tokens.css` | the token sheet | yes |
| `design-kit/qa/product/{copy,flags,roles}.md` | product truth, owned by the user | for copy/flag/role checks |
| `design-kit/qa/waivers.json` | this skill's own decisions | no |
| `design-kit/qa/ids.json` | node-id ledger (`design-deliverables`) | no — findings fall back to `css_path` |
| `schema/platforms.json` | per-platform minimums; `design-kit/qa/platforms.json` overrides | yes |

If `registry.json` is missing, run `python3 .claude/skills/design-qa/scripts/build_registry.py`
and say so. Everything derives from it; guessing the state list defeats the purpose.

Platforms are `web-desktop`, `web-mobile`, `portal-desktop` (desktop-only, D-012). Per-platform
minimums come from `schema/platforms.json`; add a platform there, not in this skill.

## Run order

1. **Scope.** One page, a feature, a vertical, components, or everything. If ambiguous, ask.
2. **Matrix.** `python3 .claude/skills/design-qa/scripts/matrix.py --scope <id|feature|all>`.
   Read `references/matrix.md`. **Show the matrix before running checks** — it is the scope.
3. **Run.** `python3 .claude/skills/design-qa/scripts/run.py --scope <…>`. This runs the
   native checks, wraps the existing linters (`references/wrapped-checkers.md`) and runs the
   render checks in headless Chrome. Read `references/checks.md` for what each check means.
4. **Manual checks.** `assets/checklist.md`, recorded as findings with `check: manual.*`.
   Do not skip these because they are slower — they catch what rules cannot express.
5. **Waivers.** `design-kit/qa/waivers.json` is applied by `run.py`. A waived blocker stays in
   the report, marked waived.
6. **Emit.** `design-kit/qa/report/report.json` and `report.html`.
7. **State the verdict in one line** — PASS, PASS WITH WARNINGS, or BLOCKED — then blocker and
   warning counts and the three findings worth looking at first. Never paste the report.

Exit codes of `run.py`: 0 pass, 1 pass with warnings, 2 blocked.

## Ask before running — only what you cannot derive

Propose an answer for each with your confidence; a question whose answer is in the registry
reads as broken.

1. Scope — which screen, feature or vertical? (derivable if named)
2. Platforms in scope — `web-desktop`, `web-mobile`, `portal-desktop`? (derive from the registry)
3. Locales — **English only by default.** Arabic is parked (PROGRESS.md 0a): the `ar` checks are
   wired and switch on with `--locales en,ar`, but do not add `ar` unless the user asks, and
   never claim an RTL result when it was off.
4. Which roles and flags change this design? The registry lists them; only the user knows which
   the current work touches.
5. Is headless Chrome available? Render checks need it. If not, say which checks are skipped
   and that the report is partial — never degrade silently and call it a pass.
6. Severity policy — the default is `references/severity.md`. Ask only if they want different.

## The case matrix

```
states × roles × flags × platforms × locales × breakpoints
```

Multiplies past what anyone will review, so cases are **classified, not enumerated**
(`references/matrix.md`): `required` (every declared state × platform, default role/locale),
`required-if-differs` (roles/flags the registry says change the surface), `sampled` (one
deterministic representative per family), `excluded` (impossible combinations, each with a reason).

**Empty is required for every screen that can show a list, whether or not anyone declared it.**
This is the single most commonly missing piece of a design.

## Check families

Full catalogue with status (implemented / planned) in `references/checks.md`.

| prefix | family | source |
|---|---|---|
| `cov` | coverage — declared states/platforms/flags actually rendered | native |
| `tok` | tokens — no orphan hex/px, no inline style, every `var()` resolves | native + `check:design` |
| `cpy` | copy — placeholder text, voice, verbatim against `product/copy.md` | native + `check:design` |
| `flw` | flows — transitions resolve, reachable, back route, dismissible | native |
| `par` | parity — desktop/mobile pairs agree or declare the difference | native |
| `rtl` | RTL — physical properties (only with `ar` in scope) | `check:rtl` |
| `a11y` | labels, alt, headings, hit targets | `check:a11y` + native render |
| `ovf` | content extremes injected and rendered | native render |
| `brk` | renders at every declared width, no horizontal overflow | native render |
| `mot` | `prefers-reduced-motion` honoured | native render |
| `prv` | privacy — no real name/phone/email in generated pages | `check:prototype` |
| `cmp` | components — Storybook vs kit parity, spec vs live | `check:parity`, `check:live` (`--components`) |

## Content extremes

`ovf` is the highest-yield family and the one people skip. For text nodes it injects and
renders a 200-character string with no spaces, the longest real title from
`design-kit/content/fixtures.json`, and `999,999,999` in numeric nodes, then checks for new
horizontal overflow. Egyptian place names and Arabic strings are long; a happy-path
screenshot never shows the break. Other extremes (empty, `0`, negative, missing image, null
date) are in `references/checks.md` as *planned* — do not claim them as covered.

## Severity

Three levels; policy in `references/severity.md`.

- **blocker** — missing required state on an authored screen, unresolvable flow reference,
  orphan colour value, hit target under the floor, placeholder text, horizontal overflow.
- **warning** — sampled-case failure, undeclared parity mismatch, voice.
- **note** — observations, and everything found on a `live` screen.

A blocker can be waived, never silently: node or css_path, check id, reason, who, date, expiry,
in `design-kit/qa/waivers.json`. Lowering a check's severity to make a report pass is not an
option — if a check is wrong, fix the check and say so in `CHANGELOG.md`.

## Report contract

`report.json` is all downstream consumers read. `"schema_version": 1`; do not add fields
without bumping the schema and this skill's minor version. Shape: `schema/report.schema.json`.
Every finding carries `node` when the element has a `data-node-id`, else `css_path`, and the
report sets `"ids_available"` accordingly.

## Known limits — say these out loud when relevant

- Render checks need Chrome: `CHROME_PATH`, or auto-found in `/opt/pw-browsers`,
  `/Applications/Google Chrome.app`, or `chromium`/`google-chrome` on PATH.
- The repo has **no captured empty/loading/error states** for most pages. Authored screens must
  draw them; live screens report the gap as a note, not a blocker.
- Motion has no measured budget (`motion-design`), so `mot.budget` is planned, not enforced.
- Arabic is parked. `rtl.*` and Arabic overflow are off unless `ar` is requested.

## Versioning

Skill version here and in `CHANGELOG.md`; the report schema version is independent and moves
slower. When they diverge the schema wins — consumers pin to the schema.
