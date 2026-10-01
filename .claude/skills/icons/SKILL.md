---
name: icons
description: Find, fetch, normalise and register icons for a design system — checking what the project already has before pulling anything new, constraining every search to style-compatible sets, and tracking the licence of each one. Use whenever someone needs an icon for a feature or screen, asks what icon to use for something, wants to add or replace an icon, asks whether an icon already exists, wants icons exported as SVG or PNG, or wants the project's existing icons audited and deduplicated. Also use when starting a new project that has no icon set yet and the style needs establishing. Works with or without an existing design system, on any platform.
version: '1.1.0'
---

# Icons

Find the right icon, make it match the set it is joining, and record where it
came from.

## The order is the whole skill

```
1. the project's own registry      ← almost always ends here
2. the concept map                 ← this product's nouns -> icon names
3. configured sources              ← constrained to style-compatible sets
```

Never skip to 3. A project that fetches first ends up with three different
chevrons because nobody checked, and the third one is added by someone who did
not know the first two existed.

## First call in a project: setup

Before any search, the project needs a pinned style. Two paths:

**The project already has icons** — run `scripts/audit.py`. It walks HTML, SVG
and component files, extracts every inline `<svg>`, normalises it, hashes the
geometry and groups duplicates. It emits a registry and a measured style
fingerprint.

The measured fingerprint beats asking someone to remember. It also tells you
whether the existing set is internally consistent: if the audit reports mixed
grids or strokes, pin a style deliberately rather than inheriting the most
common value by accident.

**The project has no icons** — ask the style questions once:

1. Grid size — 24 is the common default; 16 for dense UI, 20 for compact
2. Stroke width — 1.5 reads lighter, 2 reads sturdier
3. Outline or filled, and whether filled is used for selected states
4. Cap and join — round, butt, or square
5. Which set to pin as primary, and one fallback
6. PNG sizes and scales needed, if any
7. Allowed licences

Write the answers to `icons/style.json` and set `"locked": true`.

**Ask these once, never per call.** Deriving style per request produces a
different style every request, which is the problem this skill exists to
prevent. If a later request genuinely needs a different style, that is a change
to the pinned config and should be discussed as one.

## Searching

```bash
python scripts/fetch.py search "verified listing" --style icons/style.json
```

It checks the registry (by name and by alias), then the concept map, then
sources. If the project already has a match it stops and says so. `--force`
searches anyway, and the person should say what is wrong with the existing icon
before using it.

Sources are gated by style. A 1.5px-stroke icon beside a 2px one reads as
broken even when each is individually fine, so only sets whose published grid,
stroke and style match the pinned config are searched at all.

## Auto-pick or ask

**Auto** only when there is an unambiguous exact name match inside the primary
set.

**Ask** otherwise — and ambiguity means two different glyphs competing, not two
sets carrying the same name. `lucide:search` versus `tabler:search` is the same
decision and the primary set settles it. `material-symbols:verified` versus
`lucide:badge-check` is a choice about meaning and house style, and it belongs
to the person.

When asking, render the candidates as actual SVGs at the target size. Never
present a list of names — nobody can choose between `badge-check`,
`shield-check` and `rosette-discount-check` from the words.

## Record the decision

Every semantic choice goes in `icons/concepts.json`, including what was
rejected and why:

```json
{ "verified-listing": {
    "chosen": "lucide:badge-check",
    "rejected": ["mdi:shield-check", "tabler:rosette-discount-check"],
    "reason": "shield reads as security, not verification" } }
```

This is what compounds. Call fifty is faster than call one, and — more
usefully — the same concept resolves the same way every time. Recording the
rejected options with a reason is what stops the decision being relitigated.

## Normalisation

Every icon, from either path, goes through `scripts/normalize.py`:

- paint becomes `currentColor`, so the icon can take a token colour. An icon
  with a baked-in fill cannot be themed.
- viewBox retargeted to the pinned grid, with a scale transform when the source
  grid differs
- stroke width retargeted on the root so children inherit
- presentation noise stripped: class, id, style, title, desc, metadata
- geometry hashed for deduplication

The hash is over **normalised geometry**, not markup. The same glyph arrives
from different sets under different names with different wrappers and float
precision; hashing the raw file misses every one of those. This is why `add`
can refuse a duplicate even when the name is new.

## PNG

`scripts/rasterize.py`. Sources serve SVG, not PNG, so PNG is generated
locally — which is better anyway, because you control the sizes and they stay
consistent instead of being produced at whatever dimension someone needed that
day.

Generate the full declared size set, not ad-hoc sizes. `currentColor` is baked
to a literal colour, so a PNG cannot be themed; regenerate per theme.

## Licences

Most sets are MIT or Apache. Some are CC-BY and need attribution; a few are
commercial. An icon that lands in a product without a licence check is a
problem discovered late and expensive to unwind.

Every registry entry records its licence. `sources.json` carries the policy:
permissive sets allowed by default, attribution-required sets flagged,
commercial and non-commercial sets refused without explicit sign-off.

## Reuse, but do not pretend

Always try the existing icon first. But when it is a stretch, say so
explicitly, name what is wrong with it, and offer to fetch.

Never silently substitute a poor match. The decision stays with the person;
this skill just refuses to pretend a bad fit is a good one. Without this
counter-rule, an early wrong pick gets reused forever because it is already
there, and the registry ossifies around whatever was chosen in week one.

## Adding a source

`schema/sources.json`, not the script. Iconify ships as primary because it
aggregates 150+ sets behind one stable API with search — one adapter instead
of one scraper per site, and it is self-hostable if you would rather not depend
on their uptime.

Adding a site that is not on Iconify means writing an adapter, and each adapter
is maintenance forever. Check whether a set is already on Iconify before
committing to one.

## Files

```
icons/
  style.json        pinned once, read every call
  registry.json     every icon: hash, aliases, source, licence, used_in
  concepts.json     product nouns -> chosen icon, with rejected and why
  svg/              normalised
  png/              generated
```
