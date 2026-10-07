# Changelog — design-qa

Two versions move independently: this skill and the report schema it emits. Consumers pin to the
schema, not to the skill.

## [1.1.0] — 2026-10-07
Report schema: v1 (unchanged — new check ids only)

### Added
- `trk.*` tracking checks (`scripts/tracking.py`, also `npm run check:tracking`): a feature's `tracking.json`
  against `design-kit/analytics/event-catalog.json` and `tenants.json`, for any tenant. Findings use
  `section_hint: open-questions`; the deliverable's tracking section reads them directly.

## [1.0.0] — 2026-09-29
Report schema: v1

### Added
- Case matrix classified as required / required-if-differs / sampled / excluded (`scripts/matrix.py`).
- `origin: authored | live` — live (frozen production capture) findings are capped at `note`;
  `prv.*` is never capped. Regions of production header/footer/bottom-nav inside authored pages
  are treated as live (`registry.live_regions`).
- Native checks: coverage (`cov.*`), tokens (`tok.inline|hex|px|resolve`), copy
  (`cpy.placeholder|voice|verbatim`), flows (`flw.*`), parity (`par.*`).
- Render checks in headless Chrome via puppeteer-core: `brk.render`, `a11y.target`, `mot.reduced`,
  `ovf.long|longest_real|big_number`, and `ovf.clipped` (text cut off by overflow:hidden on the design as it stands — added after the first run showed the hand-built `favourites` mobile page clipping its spec row at 390px, which no injected-content check could see).
- Wrapped repo commands: `check:design`, `check:a11y`, `check:rtl`, `check:prototype`,
  `check:parity`, `check:live` (`references/wrapped-checkers.md`).
- Waivers per element with expiry; blanket waivers rejected.
- `scripts/build_registry.py` seeds `design-kit/qa/registry.json` from the templates on disk and
  preserves hand edits.

### Decisions worth remembering
- English only by default. Arabic checks are wired but off (PROGRESS.md 0a).
- `ovf` injects into `data-ugc` nodes; the heuristic fallback can only warn, never block.
  A first version injected into every text node and blocked on a 200-character "Featured" badge.
- Platforms are `web-desktop`, `web-mobile`, `portal-desktop`; 768px is the split.

### Fixed after the first real feature run
- `flw.orphan` compared page ids with flow *screen* ids; it now compares with the pages the flow's screens use.

- `flw.reach` accepts `entries` (one per platform) and checks reachability from every one.

- Pages that are a live capture plus a small authored block (`live_except_authored`, `derived_from`): token and copy checks
  run on the `<!--authored:start/end-->` block only; render/a11y findings outside `[data-authored]` are live-capped;
  `par.*` and `flw.orphan` skip them.

### Known gaps
- Empty/loading/error states are almost never captured on live, so every live page reports
  `cov.empty` as a note. Authored screens must draw them.
- `a11y.contrast.*`, `a11y.focus*`, `cov.role`, `par.actions`, `tok.class`, `brk.canonical`,
  `mot.budget`, `mot.infinite`, and the remaining `ovf.*` extremes are catalogued but not implemented.
- `flw.dismiss` trusts the flow file; it does not look for a close control in the DOM.
- Run against the two hand-built pages (`favourites`, `payment`), one live page (`home`) and a synthetic bad fixture. Not yet run against a real feature-design output.
