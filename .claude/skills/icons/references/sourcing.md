# Sources and licences

## Why one aggregator rather than many sites

Scraping icon library pages is fragile in all the usual ways: results are
JS-rendered, markup changes without notice, rate limits appear, and you get
whatever the page happens to show rather than a stable set. Each site is a
scraper to maintain forever.

Iconify aggregates 150+ sets behind one API that provides icon data, generates
SVG, and provides search. One adapter covers Lucide, Material Symbols, Tabler,
Phosphor, Heroicons, Font Awesome, Bootstrap, Remix, Carbon, Fluent and the
rest. It is open source and self-hostable if depending on their uptime is a
concern, and the public API has backup hosts.

So before writing an adapter for a site, check whether its set is already
there. Most are.

## Adding a source

Edit `schema/sources.json`. A new set needs grid, stroke, style and licence so
it can be style-gated and licence-checked. A new *provider* needs an adapter
pair in `fetch.py` — a search function and an SVG function — registered in
`ADAPTERS`.

Keep the adapter thin. Anything clever in it becomes something to debug when
the upstream changes.

## Licences

| class | examples | policy |
|---|---|---|
| permissive | MIT, Apache-2.0, ISC, CC0 | allowed by default |
| attribution | CC-BY-4.0 | allowed, attribution recorded |
| restricted | CC-BY-NC, proprietary, commercial | refused without explicit sign-off |

Every registry entry records its licence. The check is cheap at fetch time and
expensive to retrofit — tracing where an icon came from after it has shipped
in three products is unpleasant work.

Solar and Font Awesome free are CC-BY and need attribution. Font Awesome Pro is
commercial. Those are the ones most likely to be pulled in by accident because
they are large, well-known sets.

## Self-hosting

If the project cannot depend on an external API — air-gapped build, strict CSP,
or just not wanting a runtime dependency — Iconify's API is a Node service you
can run yourself, and the icon sets are published as npm packages
(`@iconify-json/{prefix}`).

Point `sources.json` at the self-hosted URL. Nothing else changes.
