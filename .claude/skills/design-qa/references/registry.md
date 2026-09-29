# registry.json

`design-kit/qa/registry.json` is the index QA and `design-deliverables` both derive from.
`scripts/build_registry.py` seeds it from the files on disk and **preserves every hand-edited
field on regeneration**; it only owns `platforms`, `kind`, `origin` (when unset), `stale` and
`screen`.

```json
{
  "registry_version": 1,
  "pages": {
    "favourites": {
      "label": "Favourites",
      "origin": "authored",
      "kind": "page",
      "vertical": "account",
      "feature": "favourites-revamp",
      "based_on": "favourites-live",
      "platforms": {
        "web-desktop": "design-kit/templates/desktop/favourites.html",
        "web-mobile":  "design-kit/templates/mobile/favourites.html"
      },
      "states": ["default", "empty", "loading", "error"],
      "state_files": {
        "empty": { "web-desktop": "design-kit/features/fav/favourites.desktop.html#empty" }
      },
      "roles": ["signed-in"],
      "role_differs": [],
      "flags": [],
      "no_list": false,
      "unpaired": { "web-mobile": "portal has no mobile layout (D-012)" },
      "promote": []
    }
  },
  "features": {
    "favourites-revamp": { "flows": "design-kit/features/fav/flows.json" }
  },
  "components": { "AdCard": { "css": ["src/components/AdCard/AdCard.module.css"] } }
}
```

## Field notes

- **`origin`** — `authored` or `live`. See SKILL.md. `build_registry.py` sets `live` when the
  file carries the `LIVE TEMPLATE` marker or appears in `live-templates.json`.
- **`kind`** — `page` or `overlay` (mega menus, dropdowns, dialogs, suggestions). Overlays are
  states of a page rendered as their own file; they are not required to have an empty state.
- **`states`** — declared states. `default` is `platforms[p]`; every other state must appear in
  `state_files[state][platform]` as `path` or `path#name`. `path#name` means the file renders
  that state inside `[data-state="name"]`, so one authored file can hold all its states.
- Node-id screen numbers (`3:147`) are **not** in the registry: `design-kit/qa/ids.json` allocates one per
  `platform/page[#state]` on first sight and never reuses it.
- **`unpaired`** — a platform this page deliberately lacks, with a reason. Clears `par.undeclared`.
- **`flows`** — path to a `flows.json` (see `design-deliverables/references/flows.md`).
- **`stale`** — set when the file is gone from disk (account templates are gitignored, so they
  are absent on a fresh clone). Stale pages are listed, not tested.

## Who edits what

`feature-design` adds each authored screen (step 3) and its states. `live-capture` re-runs
`build_registry.py` after `build:templates`. The user owns `product/*.md` and `waivers.json`.
