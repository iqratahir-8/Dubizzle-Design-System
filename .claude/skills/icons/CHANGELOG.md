# Changelog — icons

## [1.1.0] — 2026-10-01
Registry schema: v1 · Sources schema: v1

### Added
- `npm` source adapter in `fetch.py` (`--source npm`): reads the same Iconify
  sets from the published `@iconify-json/{prefix}` packages, cached under
  `ICONS_NPM_CACHE` (default `icons/.npm-sets`). For sandboxes where
  api.iconify.design is blocked but the npm registry is not. Searches only the
  pinned primary and fallback sets, because each set is a whole download.
  `add --source npm` records the set's SPDX licence automatically.

### Fixed
- `audit.py` lost icons when two different glyphs shared a file name in
  different folders (`action/search.svg`, `mobile/search.svg`): the second
  overwrote the first. 546 unique glyphs came out as 541 entries on the
  dubizzle set. The second name is now qualified with its folder.

### Known gaps (found in use, not fixed)
- Auto-pick ignores the pinned variant: with Material Symbols pinned to
  outline-rounded, `search "privacy"` auto-picks `material-symbols:privacy`
  (the filled default). Pick variant names by hand until the style carries a
  variant suffix the scorer understands.
- `allowed_sets` passes sets whose stroke differs (heroicons 1.5) when the pin
  is `filled`, because a filled pin has no stroke to compare.
- `audit.py` writes normalised SVGs at the inferred grid, not the pinned one.

## [1.0.0] — 2026-09-29
Registry schema: v1 · Sources schema: v1

### Added
- Three-step lookup order — project registry, concept map, then sources.
  Searching sources first is what produces three different chevrons in one
  product.
- `scripts/audit.py` — extracts inline SVG from HTML, JSX, Vue, Svelte and
  SVG files, normalises, hashes geometry, groups duplicates, and measures the
  project's actual icon style.
- `scripts/normalize.py` — currentColor conversion, grid retargeting, stroke
  retargeting, noise stripping, and geometry hashing with canonical path data
  so the same glyph hashes identically across different wrappers.
- `scripts/fetch.py` — style-gated search and add, with licence filtering and
  the auto/ask decision rule.
- `scripts/rasterize.py` — PNG at the declared size set, via cairosvg, resvg,
  rsvg-convert or Inkscape, reporting which one it used.
- `schema/sources.json` — Iconify plus 15 sets with published grid, stroke,
  style and licence, used to gate searches. Adding a source is a config edit.
- Concept map that accumulates chosen and rejected options with reasons.

### Known gaps
- Only the Iconify adapter is written. Any site not on Iconify needs its own
  adapter, and each one is maintenance forever.
- `audit.py` reads inline `<svg>` only. Sprite sheets and icon fonts are not
  extracted.
- Name guessing during audit falls back to `{file}-icon-{n}` when there is no
  aria-label, title or icon class. Those need renaming by hand.
- Optical weight is not checked. An icon rescaled from a 48px grid to 24px is
  flagged but not corrected; thin strokes still read lighter than neighbours.
- Not cold-tested. Written and run against fixtures in the session that
  produced it, which is not evidence that it works in a fresh one.
