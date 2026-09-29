# flows.json

One per feature; register it in `design-kit/qa/registry.json` → `features.<feature>.flows`. It
drives both the prototype section and design-qa's `flw.*` checks. Transitions key on **node ids**,
not CSS selectors, so a hotspot survives a re-layout.

```json
{
  "entry": "list",
  "screens": {
    "list":    { "page": "favourites", "platform": "web-mobile", "kind": "page" },
    "confirm": { "page": "favourites-confirm", "platform": "web-mobile", "kind": "dialog" },
    "empty":   { "page": "favourites", "platform": "web-mobile", "state": "empty", "kind": "page" }
  },
  "transitions": [
    { "from": "list",    "to": "confirm", "node": "8:31", "kind": "forward" },
    { "from": "confirm", "to": "list",    "node": "9:4",  "kind": "dismiss" },
    { "from": "confirm", "to": "empty",   "node": "9:7",  "kind": "forward" },
    { "from": "empty",   "to": "list",    "node": "10:3", "kind": "back" }
  ]
}
```

- `screens[id]` → `page` (registry id), `platform`, optional `state` (default `default`), `kind`
  (`page`, `modal`, `drawer`, `sheet`, `dialog`). One flow, one platform is the usual case.
- `transitions[].kind`: `forward`, `back`, `dismiss`, `close`. `node` is the `data-node-id` of the
  control the user activates — get it from the redline panel (press R) after a first build.
- QA enforces: every endpoint exists (`flw.dead`), every node is in the ledger (`flw.node`), every
  screen is reachable from `entry` (`flw.reach`), every non-entry screen has a route back
  (`flw.back`), every modal/drawer/sheet/dialog has a `dismiss`/`close` (`flw.dismiss`).
- **One entry per platform:** replace `"entry": "list"` with `"entries": {"web-desktop": "list", "web-mobile": "m-list"}` and give every screen its `platform`. The runner shows a platform switch and a picker filtered to it; QA checks reachability from every entry. (`entry` still works for a single-platform flow.)
- Never write a flow specific to one feature into the skill; the feature is a parameter.

Runner: **Back**, **Reset**, **Show hotspots**, a screen picker, and `?screen=<screen id>` deep
links.
