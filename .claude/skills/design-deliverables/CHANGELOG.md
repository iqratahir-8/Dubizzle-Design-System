# Changelog — design-deliverables

Three versions move independently: this skill, each deliverable document, and the QA report
schema this skill consumes.

## [1.1.0] — 2026-10-07
### Added
- **Analytics and tracking** section (`tracking`, order 135): built from the feature's registered `tracking.json`
  resolved against `design-kit/analytics/`, plus open `trk.*` findings. Not applicable (and listed as such) when no
  `tracking.json` is registered, so existing deliverables are unchanged until one is added.

## [1.0.2] — 2026-10-02
### Changed
- Smaller documents, no visual change: identical CSS rules are deduplicated (last copy kept, so the cascade is
  unchanged) and the embedded ledger keeps only the four fields the redline panel reads. Agency portal:
  21.5 MB -> 8.2 MB; all 30 screens pixel-identical.

## [1.0.1] — 2026-10-02
### Fixed
- Prototype runner: a click now fires only the innermost trigger (listeners are capture-phase, so each
  one checks it is the deepest trigger under the click). A control nested inside another trigger — a ⋯ menu
  icon inside a row link — no longer also fires the outer one.
- Prototype runner: no `null` error when a frame is swapped before it has loaded.

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

### Fixed / added building v3 on the live captures
- **Serious, present since v1:** `str.replace` inserted the ledger JSON before *every* `</body>` and the document
  stylesheet before *every* `</head>`, including the ones inside each embedded screen. Screens got the document's
  chrome CSS injected into them and the ledger was embedded once per screen (27 MB instead of 5). Now only the
  document's own tags are touched, and only this deliverable's nodes are embedded. v1 and v2 files carried this bug.
- Screens' stylesheets (live captures link production CSS) are hoisted into the document once; favicon/manifest links
  are dropped.
- The no-remote guard checks what loads (`src`, `srcset`, stylesheet links), not `<a href>`.
- CSS `url()`: fonts always, images only under 40 KB; larger decorative images become a transparent pixel and are logged.
- `--placeholder-images`: remote images (a capture that did not inline them) become grey placeholders/blank and the
  document says so in its banner and summary. For interim builds; a re-capture with images inlined replaces it.
- Button states report only classes `patterns.css` defines; sections that would be empty are n/a with a reason.

### Known gaps
- Built end to end only as a DRAFT of the hand-built `favourites` page (QA was blocked by its missing
  empty states and clipped mobile spec row, correctly), opened in headless Chrome: no console errors, no network
  requests, redline panel shows role/component, and a two-screen flow was clicked through (hotspot → screen,
  back, hotspot reveal, reset). No real multi-screen feature has been built.
- Button states show what `patterns.css` declares, not rendered pseudo-states.
- No deliverable-to-deliverable diff beyond the node-id counts.
- Fonts pruned by rule, not glyph-subset.
- The prototype runner's hotspot positions ignore iframe scroll.
