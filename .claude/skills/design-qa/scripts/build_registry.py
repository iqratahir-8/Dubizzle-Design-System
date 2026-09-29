#!/usr/bin/env python3
"""
Seed / refresh design-kit/qa/registry.json from the files on disk.

Owns only: platforms, kind, origin (when unset), vertical (when unset), stale.
Every other field is hand-edited and PRESERVED on regeneration. (Node-id screen numbers are allocated by
the ledger, design-kit/qa/ids.json, on first sight — not here.)

    python3 .claude/skills/design-qa/scripts/build_registry.py [--dry-run]
"""
import argparse, json, pathlib, re
from common import repo_root, load_json, LIVE_REGIONS_DEFAULT

OVERLAY = re.compile(r"^(m-)?(menu-|location-dropdown|search-suggestions|sort-menu|save-search|"
                     r"login-dialog|user-menu|dpv-gallery|dpv-phone|dpv-report|dpv-details|"
                     r"m-.*overlay|.*-overlay|.*-dialog)")
VERTICALS = [
    ("portal", re.compile(r"^portal-")),
    ("property", re.compile(r"propert|compound|agenc")),
    ("motors", re.compile(r"car|motor|vehicle|electric|truck|new-cars|dpv|finance")),
    ("account", re.compile(r"my-ads|chat|favourite|profile|settings|packages|payment|login|user-menu|post-ad|upsell")),
]
NO_LIST = re.compile(r"login|payment|not-found|post-ad|upsell|edit-profile|settings|packages|menu|dropdown|dialog|overlay")

def vertical(stem):
    for name, rx in VERTICALS:
        if rx.search(stem):
            return name
    return "global"

def is_live(fp, stem, live_keys):
    if stem in live_keys:
        return True
    try:
        head = fp.read_text(encoding="utf-8", errors="ignore")[:400]
    except OSError:
        return False
    return "LIVE TEMPLATE" in head

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    root = repo_root()
    qa = root / "design-kit" / "qa"; qa.mkdir(parents=True, exist_ok=True)
    reg_path = qa / "registry.json"
    reg = load_json(reg_path, {"registry_version": 1, "pages": {}, "features": {}, "components": {}})
    reg.setdefault("pages", {}); reg.setdefault("features", {}); reg.setdefault("components", {})

    live = (load_json(root / "design-kit/templates/live-templates.json", {}) or {}).get("templates", {})
    live_keys = set(live)
    found = {}
    for plat_dir, plat in (("desktop", "web-desktop"), ("mobile", "web-mobile")):
        d = root / "design-kit/templates" / plat_dir
        if not d.is_dir():
            continue
        for fp in sorted(d.glob("*.html")):
            stem = fp.stem
            p = "portal-desktop" if stem.startswith("portal-") else plat
            found.setdefault(stem, {})[p] = str(fp.relative_to(root))

    state_targets = {pathlib.Path(v).name for pg in reg["pages"].values() for m in (pg.get("state_files") or {}).values() for v in m.values()}
    added, stale = [], []
    for stem, plats in sorted(found.items()):
        if any(pathlib.Path(p).name in state_targets for p in plats.values()):
            reg["pages"].pop(stem, None)      # a state of another page, registered under its state_files
            continue
        first = root / next(iter(plats.values()))
        e = reg["pages"].get(stem)
        if e is None:
            e = {"label": stem.replace("-", " ").title(),
                 "origin": "live" if is_live(first, stem, live_keys) else "authored",
                 "states": ["default"], "roles": [], "role_differs": [],
                 "flags": [], "no_list": bool(NO_LIST.search(stem)), "unpaired": {}}
            added.append(stem)
        e["platforms"] = plats
        e["kind"] = "overlay" if OVERLAY.search(stem) else "page"
        e.setdefault("vertical", vertical(stem))
        if e.get("kind") == "overlay":
            e["no_list"] = True
        if "portal-desktop" in plats and "web-mobile" not in plats:
            e.setdefault("unpaired", {}).setdefault("web-mobile", "dubizzle Pro has no mobile layout (D-012)")
        e.pop("stale", None); e.pop("screen", None)
        reg["pages"][stem] = e
    for stem, e in reg["pages"].items():
        if stem not in found and stem not in {k for k in reg["pages"] if False}:
            e["stale"] = True; stale.append(stem)

    reg.setdefault("live_regions", LIVE_REGIONS_DEFAULT)
    comps = root / "src/components"
    if comps.is_dir():
        for d in sorted(comps.iterdir()):
            css = sorted(str(p.relative_to(root)) for p in d.glob("*.module.css"))
            if d.is_dir() and css:
                reg["components"].setdefault(d.name, {})["css"] = css

    reg["pages"] = dict(sorted(reg["pages"].items(), key=lambda kv: kv[0]))
    n_live = sum(1 for e in reg["pages"].values() if e.get("origin") == "live")
    print(f"pages {len(reg['pages'])}  (live {n_live}, authored {len(reg['pages'])-n_live})  "
          f"components {len(reg['components'])}  new {len(added)}  stale {len(stale)}")
    if stale:
        print("  stale (file not on this machine — gitignored account templates?): " + ", ".join(stale[:12]))
    if a.dry_run:
        print("dry run — nothing written"); return
    reg_path.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {reg_path.relative_to(root)}")

if __name__ == "__main__":
    main()
