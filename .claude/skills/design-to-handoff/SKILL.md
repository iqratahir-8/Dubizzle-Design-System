---
name: design-to-handoff
description: >-
  Run the whole dubizzle Egypt design job end to end, step by step: intake questions, a written
  plan the user approves, then design (feature-design), QA (design-qa) and the internal HTML
  deliverable (design-deliverables), stopping at each gate. Use when someone says "design this and
  hand it over", "take this PRD all the way", "do the whole thing", "end to end", "from idea to
  deliverable", or gives a feature with no instruction about which stage. For one stage only
  (just design, just QA, just the deliverable) use that skill directly instead.
version: 1.0.0
---

# Design to hand-off — dubizzle Egypt

An **orchestrator**. It owns the questions, the plan and the gates between stages. It owns **no
design, QA or bundling logic** — each stage is done by its own skill, invoked with the Skill tool.
If a rule lives in a stage skill, do not restate it here; follow that skill.

```
Intake → Plan (user approves) → Design → QA gate → Deliverable → Summary
        feature-design          design-qa    design-deliverables
```

## Ground rules

1. **Read `PROGRESS.md` first**, then `RULES.md`. Never write the account holder's real name.
2. **Ask once, up front, only what you cannot derive.** Propose an answer with your confidence for
   each question. Use AskUserQuestion, at most 4 questions per round.
3. **Show the plan and wait for approval before drawing anything.**
4. **Stop at every gate.** A stage that fails does not start the next. Say why, fix or ask.
5. **Never invent a measurement.** Anything unmeasured goes to `docs/PROPOSALS.md` and is said aloud.
6. **Keep `PROGRESS.md` current** after each stage (CLAUDE.md rule 2), and commit with it.

## Stage 0 — Intake

Derive first (PRD, registry, `docs/PAGE-COVERAGE.md`, `design-kit/qa/registry.json`), then ask only
the gaps:

| Question | Default to propose |
|---|---|
| What is the job, in one sentence — and is there a PRD/link? | from the ask |
| New feature or revamp of a captured page? (feature-design Step 0 checks what exists) | from the registry |
| Platforms: web-desktop, web-mobile, portal-desktop? | web-desktop + web-mobile |
| Locales | English only (Arabic parked, PROGRESS 0a) |
| Who reads the deliverable: web engineers, Pro portal engineers, stakeholders? | all three |
| How far: design only / design + QA / all the way to the deliverable? | all the way |
| Product sources available (KB, product agent)? Who owns the open questions? | ask |

Feature name (kebab-case) is fixed here; it becomes the registry `feature` and the folder
`design-kit/deliverables/<feature>/`.

## Stage 1 — Plan (gate: user approval)

Write the plan in chat, short: the screens and states you expect (empty included), which are
reused from capture vs new, the flows, what will be cut, what is unverified, the QA scope, the
deliverable sections you expect to exclude (with reason), and the open questions with owners.
End with "Approve, or tell me what to change." **Do not continue without an answer.**

## Stage 2 — Design

Invoke `feature-design`. Follow it fully, including Step 0 (is it already captured?), the product
pass, Step 5 critique, and **Step 6, which builds the hand-off pack** (registry entries,
`flows.json`, `deliverable.json` drafts, first QA). Nothing extra to do here.

**Gate:** registry entries exist for every screen and state; the critique is written.

## Stage 2.5 — Review (before QA)

Invoke `design-review` on the new screens: a senior-designer critique with P0–P3 findings and the
"does it look AI-made" check. Words on the screens also go through `design-copy` (Title Case headings
and buttons per D-019, Western digits per D-020), and any input through `design-forms`.
Craft skills for the specific gaps — `design-grid`, `design-typography`, `design-interaction` — are
used when the review names them.

**Gate:** no open P0 or P1. Fix them (back to Stage 2) or have the user accept them in writing; list
what was accepted in the Stage 5 summary.

## Stage 3 — QA

Invoke `design-qa` with the agreed scope (`--scope <feature>`), show the matrix first, run it, state
the verdict in one line.

**Gate:** BLOCKED stops the flow. Fix blockers (back to Stage 2) or, only if the user says so, add a
waiver with reason, owner and expiry. PASS WITH WARNINGS may continue if the user is told the
warnings. Never relabel a block as a pass, and never lower a severity.

## Stage 4 — Deliverable

Only if the user chose "all the way". Invoke `design-deliverables`. It re-checks the QA gate, runs
its own intake table (use the Stage 0 answers so the user is not asked twice), builds one
self-contained INTERNAL-stamped HTML file into `design-kit/deliverables/<feature>/dist/` (gitignored).

**Gate:** its size/PII/remote-asset checks pass. If it fell back to `--placeholder-images`, say so.

## Stage 5 — Summary

One screen, not the report: verdict line, blocker/warning counts, the three findings worth reading,
open questions with owners, what is unverified, where the file is, and what still needs a human
(sign-off, recapture, mirror push). Update `PROGRESS.md`, commit, push to the designated branch.
Merging to `main` is asked, never assumed.

## Resuming

If the feature already has registry entries, `flows.json` or a deliverable, say what exists and
start from the first stage that is not done — do not redesign. Version bumps of an existing
deliverable follow `design-deliverables/references/deliverable-json.md`.

## What this skill will not do

- Skip the plan approval, or run stages in parallel.
- Design, check or bundle by itself — it delegates.
- Publish anywhere outside the repo. Deliverables are INTERNAL (licensed fonts).
