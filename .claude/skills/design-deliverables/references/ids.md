# Node ids

## Format

`{screen}:{node}` → `7:147`. Screen number is allocated by the ledger per `platform/page[#state]`
(`web-desktop/favourites` → 7, `web-mobile/favourites` → 8, `web-desktop/favourites#empty` → 9).
Node number is monotonic within that screen. Readable, sortable, obviously an id when pasted into
a ticket.

## The requirement is stability, not uniqueness

If ids are assigned by DOM order at build time, inserting one row renumbers everything below it and
every redline reference in every ticket, comment and Slack thread silently points at a different
element — worse than no ids, because it fails quietly. So ids live in a **committed ledger**,
`design-kit/qa/ids.json`, and an id is a fact about the node, not a function of its position.

Verified: inserting a `<p>` above a card list re-ran as 134 nodes `exact`, 1 `new`.

## Ledger shape

```json
{
  "ledger_version": 1,
  "screens": { "web-desktop/favourites": 7, "web-mobile/favourites": 8 },
  "nodes": {
    "7:49": {
      "kind": "component", "role": "ad-card", "component": "AdCard",
      "screen": "web-desktop/favourites",
      "path": "html > body > container > section > results-grid > li > ad-card",
      "fingerprint": "text:|kind:component|cls:ad-card",
      "pair": "8:31", "first_seen": "2026-09-29", "last_seen": "2026-09-29", "status": "active"
    }
  },
  "next_node": { "7": 135, "8": 40 },
  "retired": ["7:96"]
}
```

## Rules

**Assign once.** First sight assigns; the id is kept forever.

**Never reuse.** A deleted node goes `status: "retired"`; its number is not returned to the pool.
Reusing one makes an old reference resolve to a different element.

**Match on regeneration**, in order:
1. `role` + `path` + fingerprint exact → same id (`exact`)
2. `role` + fingerprint, path moved → same id (`moved`)
3. `role` + `path`, fingerprint changed → same id (`content-changed`)
4. `role` matches and exactly one candidate → same id (`role-only`); otherwise ask, don't guess
5. no match → new id, **reported, not silent** — usually a renamed role, cheap to catch now

**Role matters more than the id.** Role is `data-role`/`data-component`, else the first BEM class
(`ad-card`, `ad-card__title`, `tabs__tab`), else the tag. The BEM block is mapped to the React
component in `src/components/` where one exists (`ad-card` → `AdCard`) — that mapping is the join
between the design system and the deliverable.

**Pairing.** `pair` links a web-desktop node to its web-mobile counterpart (same role + fingerprint),
so a redline can say "differs from mobile" and be checked.

## What gets an id

Not everything — 1,400 ids is noise. Included: every screen, every component instance, every text
node carrying copy, every icon (the `<svg>`, not its paths), every interactive control. Excluded:
layout wrappers (`container`, `row`, `grid`, `stack`…), spacers, SVG internals, anything a reviewer
would never point at. Expect 100–250 per screen; over 600 means the rule is too broad.

## Who assigns them

`scripts/assign_ids.py` (standalone or called by `build_deliverable.py`). It never edits the source
screen; `--annotate` writes a copy. Review the `role-only`, `moved` and `content-changed` list —
"same node moved or new node?" is the one judgement call.

## Diffing across versions

Because ids are stable, a version diff means something: nodes added, retired, content-changed.
`build_deliverable.py` appends it to the document's changelog section.
