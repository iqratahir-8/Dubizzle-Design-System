#!/usr/bin/env python3
"""
Build the QA case matrix from design-kit/qa/registry.json.
Classifies rather than enumerates — see references/matrix.md.

    python3 .claude/skills/design-qa/scripts/matrix.py --scope favourites [--platforms web-desktop,web-mobile]
                                                        [--locales en] [--out design-kit/qa/report]
"""
import argparse, itertools, json, pathlib, sys
from common import repo_root, load_json, load_platforms, select_pages, resolve_file

EXCLUSIONS = [
    (("no-permission", "empty"), "the role cannot see the list to find it empty"),
    (("flag-off", "loading"), "nothing loads when the flag is off"),
    (("flag-off", "empty"), "the surface is absent, not empty"),
    (("loading", "overflow"), "no content rendered yet to overflow"),
]

def build_matrix(root, registry, pcfg, scope="all", platforms=None, locales=("en",)):
    pages = select_pages(registry, scope)
    all_plats = pcfg["platforms"]
    cases, excl = [], []
    for pid, page in pages.items():
        have = list((page.get("platforms") or {}).keys())
        plats = [p for p in have if not platforms or p in platforms]
        if not plats:
            continue
        states = list(page.get("states") or ["default"])
        live = page.get("origin") == "live"
        if "empty" not in states and not page.get("no_list"):
            states.append("empty")               # required regardless of declaration
        if page.get("no_list"):
            excl.append({"pattern": "empty", "page": pid, "reason": "registry: no_list — the screen never shows a list"})
        roles = page.get("role_differs") or []
        flags = page.get("flags") or []
        for st, pl in itertools.product(states, plats):
            w = all_plats.get(pl, {}).get("default_width", 1440)
            f, _m = resolve_file(root, page, pl, st)
            cases.append({"id": f"{pid}/{pl}/{st}/{locales[0]}/default/{w}", "class": "required",
                          "page": pid, "screen": f"{pl}/{pid}", "platform": pl, "state": st,
                          "role": "default", "flags": {}, "locale": locales[0], "width": w,
                          "promoted_by": None, "file": f, "origin": page.get("origin", "authored")})
        if live:
            continue                              # a frozen snapshot has one state: what was captured
        for r in roles:
            for pl in plats:
                w = all_plats.get(pl, {}).get("default_width", 1440)
                if r == "agency" and pl == "web-mobile":
                    excl.append({"pattern": f"{r} × {pl}", "page": pid, "reason": "dubizzle Pro has no mobile layout (D-012)"}); continue
                f, _m = resolve_file(root, page, pl, "default")
                cases.append({"id": f"{pid}/{pl}/default/{locales[0]}/{r}/{w}", "class": "required_if_differs",
                              "page": pid, "screen": f"{pl}/{pid}", "platform": pl, "state": "default",
                              "role": r, "flags": {}, "locale": locales[0], "width": w,
                              "promoted_by": "role_differs", "file": f, "origin": "authored"})
        for fl in flags:
            for pl in plats:
                w = all_plats.get(pl, {}).get("default_width", 1440)
                f, _m = resolve_file(root, page, pl, "flag-off")
                cases.append({"id": f"{pid}/{pl}/flag-off:{fl}/{locales[0]}/default/{w}", "class": "required_if_differs",
                              "page": pid, "screen": f"{pl}/{pid}", "platform": pl, "state": "flag-off",
                              "role": "default", "flags": {fl: False}, "locale": locales[0], "width": w,
                              "promoted_by": "flag", "file": f, "origin": "authored"})
        first = plats[0]
        for loc in locales[1:]:
            w = all_plats.get(first, {}).get("default_width", 1440)
            f, _m = resolve_file(root, page, first, "default")
            cases.append({"id": f"{pid}/{first}/default/{loc}/default/{w}", "class": "sampled", "page": pid,
                          "screen": f"{first}/{pid}", "platform": first, "state": "default", "role": "default",
                          "flags": {}, "locale": loc, "width": w, "promoted_by": None, "file": f, "origin": "authored"})
        for pl in plats:
            dw = all_plats.get(pl, {}).get("default_width", 1440)
            for w in all_plats.get(pl, {}).get("breakpoints", []):
                if w == dw:
                    continue
                f, _m = resolve_file(root, page, pl, "default")
                cases.append({"id": f"{pid}/{pl}/default/{locales[0]}/default/{w}", "class": "sampled", "page": pid,
                              "screen": f"{pl}/{pid}", "platform": pl, "state": "default", "role": "default",
                              "flags": {}, "locale": locales[0], "width": w, "promoted_by": None, "file": f,
                              "origin": "authored"})
        for st, other in itertools.combinations(states + ["no-permission", "overflow"], 2):
            for (a, b), reason in EXCLUSIONS:
                if {st, other} == {a, b} and (a in states or b in states or "no-permission" in (a, b)):
                    excl.append({"pattern": f"{a} × {b}", "page": pid, "reason": reason})
        for pr in page.get("promote") or []:
            for c in cases:
                if c["page"] == pid and c["id"] == pr:
                    c["class"] = "required"; c["promoted_by"] = "user"
    counts = {"required": 0, "required_if_differs": 0, "sampled": 0}
    for c in cases:
        counts[c["class"]] += 1
    counts["excluded"] = len(excl)
    return {"scope": {"pages": list(pages), "platforms": platforms or sorted({c["platform"] for c in cases}),
                      "locales": list(locales)}, "counts": counts, "cases": cases, "excluded": excl}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", default="all")
    ap.add_argument("--platforms", default="")
    ap.add_argument("--locales", default="en")
    ap.add_argument("--out", default="design-kit/qa/report")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--registry", default="design-kit/qa/registry.json")
    a = ap.parse_args()
    root = repo_root()
    reg = load_json(root / a.registry)
    if not reg:
        sys.exit("design-kit/qa/registry.json is missing — run build_registry.py first")
    m = build_matrix(root, reg, load_platforms(root), a.scope,
                     [p for p in a.platforms.split(",") if p] or None, a.locales.split(","))
    out = root / a.out; out.mkdir(parents=True, exist_ok=True)
    (out / "matrix.json").write_text(json.dumps(m, indent=2, ensure_ascii=False), encoding="utf-8")
    c = m["counts"]
    print(f"case matrix — scope '{a.scope}' — {len(m['scope']['pages'])} page(s)")
    for k in ("required", "required_if_differs", "sampled", "excluded"):
        print(f"  {k:22} {c.get(k, 0)}")
    if not a.quiet:
        req = [x for x in m["cases"] if x["class"] == "required"]
        print(f"\nrequired cases ({len(req)}):")
        for x in req[:60]:
            print("  " + x["id"] + ("" if x["file"] else "   [no file]"))
        if len(req) > 60:
            print(f"  … {len(req) - 60} more (see matrix.json)")
    print(f"\nwrote {(out / 'matrix.json').relative_to(root)}")

if __name__ == "__main__":
    main()
