# Pinning a style

## Why once, not per call

A style derived per request produces a different style every request. Two
sessions, two answers, and the mixed-set problem is rebuilt from scratch.

So the first call in a project writes `icons/style.json` and sets
`"locked": true`. Every call after reads it and never asks again.

If a later request genuinely needs something different, that is a change to
the pinned config and should be discussed as one — not decided silently
inside a single icon request.

## What is pinned

```json
{
  "primary_set": "lucide",
  "fallback_set": "tabler",
  "grid": 24,
  "stroke": 2,
  "cap": "round",
  "join": "round",
  "style": "outline",
  "allowed_licenses": ["MIT", "ISC", "Apache-2.0", "CC0"],
  "png_sizes": [16, 20, 24, 32],
  "png_scales": [1, 2, 3],
  "locked": true,
  "established": "audit of src/, 2026-09-29"
}
```

## Which sets are compatible

Compatible means same grid, same style family, and either the same stroke or a
variable stroke that can be set to match.

| set | grid | stroke | style |
|---|---|---|---|
| lucide | 24 | 2, variable | outline |
| tabler | 24 | 2, variable | outline |
| feather | 24 | 2 | outline |
| heroicons | 24 | 1.5 | both |
| iconoir | 24 | 1.5 | outline |
| material-symbols | 24 | variable | both |
| phosphor (ph) | 256 | variable, six weights | both |
| carbon | 32 | 2 | outline |
| bootstrap (bi) | 16 | — | both |

Lucide, Tabler and Feather mix cleanly — same grid, same stroke, same
heritage. Heroicons at 1.5 beside Lucide at 2 does not. Carbon at a 32 grid
rescales to 24 but comes out optically lighter.

## When the audit says "mixed"

It means the existing set is not internally consistent — several grids or
several stroke widths in use. Do not inherit the most common value by default.
Pick deliberately, then decide whether to normalise the existing icons to it or
leave them and apply the pin going forward.

Normalising retroactively is the right answer and it is cheap: the audit has
already extracted and hashed everything.

## Optical weight

Rescaling changes apparent weight. A 2px stroke on a 48px grid becomes 1px at
24px and reads noticeably lighter than a native 2px icon beside it.

`fetch.py` flags a rescale but cannot fix it. When an icon comes from a
different grid, look at it next to its neighbours at the real size before
accepting it.
