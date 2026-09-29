# Changelog — design-deliverables

Three versions move independently: this skill, each deliverable document, and the QA report
schema this skill consumes.

## [1.0.0] — 2026-09-29
Accepts QA report schema: v1 · Node ledger version: 1

### Added
- Single-file output as a hard rule: `scripts/bundle.py` inlines CSS (`@import`s resolved), fonts,
  images, JS, the ledger, the QA report and flows; fails on any surviving remote reference, on a
  phone/email in the document text, and past 25 MB.
- Stable numeric node ids `{screen}:{node}` with a committed ledger (`design-kit/qa/ids.json`) and
  five-step matching (`scripts/assign_ids.py`). Ids are spliced into an in-memory copy using the HTML
  parser's own tag positions; source screens are never modified.
- Seventeen-section registry with stable string ids and computed display numbers; sections that do
  not apply are listed as n/a with a reason.
- QA gate: build refuses on unwaived blockers, on a report that does not cover the pages, and on
  an unknown schema (`references/gate.md`).
- Five sections generated from the QA report (`scripts/consume_report.py`); tokens, button states,
  assets and platform notes generated from the design system and registry.
- Runtime: iframe-per-screen from shared CSS, redline inspector (R key), state pickers with deep
  links, prototype runner over `flows.json`.
- INTERNAL banner and `classification` meta on every document (licensed fonts, redacted-but-private
  account data).

### Fixed while building (from the reference skill)
- The reference `--annotate` numbered *every* tag in document order while only some tags had ids, so
  ids landed on the wrong elements. Now spliced by parser position.
- Reference text attached to the most recently opened node rather than the innermost included
  ancestor.
- `url()` in a custom property (`--i:url(../icons/x.svg)`) resolves against `patterns.css`, not the
  page; without handling it, bottom-nav icons broke inside the iframes.

### Fixed after the first real build (favourites-revamp v1)
- The main column grew to 1800px because a 1440px iframe stretched the grid track: `min-width:0` on `main`.
- Tables now scroll inside themselves; the document fits a 390px phone.
- A `back`/`dismiss` hotspot now goes to the screen its transition declares (it used to just pop history).

### Added after v1 of favourites-revamp
- Flows may declare one entry per platform (`entries`); the runner has a platform switch (`?platform=web-mobile`).

### Known gaps
- Built end to end only as a DRAFT of the hand-built `favourites` page (QA was blocked by its missing
  empty states and clipped mobile spec row, correctly), opened in headless Chrome: no console errors, no network
  requests, redline panel shows role/component, and a two-screen flow was clicked through (hotspot → screen,
  back, hotspot reveal, reset). No real multi-screen feature has been built.
- Button states show what `patterns.css` declares, not rendered pseudo-states.
- No deliverable-to-deliverable diff beyond the node-id counts.
- Fonts pruned by rule, not glyph-subset.
- The prototype runner's hotspot positions ignore iframe scroll.
