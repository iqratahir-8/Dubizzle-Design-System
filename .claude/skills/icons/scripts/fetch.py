#!/usr/bin/env python3
"""
Find and fetch icons from configured sources.

Order of operations is deliberate and should not be reordered:

  1. the project's own registry      — almost always ends here
  2. the concept map                 — this product's nouns -> icon names
  3. configured sources              — constrained to style-compatible sets

Sources live in schema/sources.json, not in this script. Adding a source is a
config edit. Iconify ships as the primary because it aggregates 150+ sets
behind one stable API with search, which beats maintaining a scraper per site.

    python fetch.py search "verified listing" --style icons/style.json
    python fetch.py add lucide:badge-check --name verified --style icons/style.json
    python fetch.py search "privacy" --source npm     # Iconify API blocked
"""
import argparse, json, os, pathlib, subprocess, sys, tarfile, tempfile, urllib.request, urllib.parse, urllib.error
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from normalize import normalize, content_hash, fingerprint

HERE = pathlib.Path(__file__).resolve().parent
SOURCES = json.loads((HERE.parent / "schema" / "sources.json").read_text())
TIMEOUT = 10


def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "icons-skill/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode())


def http_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "icons-skill/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode()


# ── source adapters ───────────────────────────────────────────────────────

def iconify_search(query, sets=None, limit=32):
    base = SOURCES["iconify"]["api"]
    params = {"query": query, "limit": limit}
    if sets:
        params["prefixes"] = ",".join(sets)
    url = f"{base}/search?" + urllib.parse.urlencode(params)
    data = http_json(url)
    out = []
    for full in data.get("icons", []):
        prefix, _, name = full.partition(":")
        info = (data.get("collections") or {}).get(prefix, {})
        out.append({
            "id": full, "set": prefix, "name": name,
            "set_title": info.get("name", prefix),
            "license": (info.get("license") or {}).get("title", "unknown"),
            "license_spdx": (info.get("license") or {}).get("spdx"),
            "source": "iconify",
        })
    return out


def iconify_svg(icon_id):
    prefix, _, name = icon_id.partition(":")
    return http_text(f"{SOURCES['iconify']['api']}/{prefix}/{name}.svg")


# npm: the same Iconify sets, read from the published @iconify-json/{prefix}
# packages. This is the self-hosting route in references/sourcing.md, and the
# fallback when the Iconify API is unreachable (sandboxes, strict proxies) but
# the npm registry is not. Packages are cached under ICONS_NPM_CACHE.

NPM_CACHE = pathlib.Path(os.environ.get("ICONS_NPM_CACHE", "icons/.npm-sets"))
_npm_loaded = {}


def _npm_set(prefix):
    if prefix in _npm_loaded:
        return _npm_loaded[prefix]
    d = NPM_CACHE / prefix
    if not (d / "icons.json").exists():
        d.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["npm", "pack", f"@iconify-json/{prefix}", "--silent",
                            "--pack-destination", tmp], check=True,
                           capture_output=True, timeout=120)
            tgz = next(pathlib.Path(tmp).glob("*.tgz"))
            with tarfile.open(tgz) as t:
                for name in ("icons.json", "info.json"):
                    f = t.extractfile(f"package/{name}")
                    (d / name).write_bytes(f.read())
    icons = json.loads((d / "icons.json").read_text())
    info = json.loads((d / "info.json").read_text()) if (d / "info.json").exists() else {}
    _npm_loaded[prefix] = (icons, info)
    return icons, info


def npm_search(query, sets=None, limit=32):
    words = query.lower().replace("-", " ").split()
    out = []
    for prefix in sets or []:
        try:
            icons, info = _npm_set(prefix)
        except Exception:
            continue
        lic = info.get("license") or {}
        for name in list(icons["icons"]) + list(icons.get("aliases", {})):
            if all(w in name for w in words):
                out.append({
                    "id": f"{prefix}:{name}", "set": prefix, "name": name,
                    "set_title": info.get("name", prefix),
                    "license": lic.get("title", "unknown"),
                    "license_spdx": lic.get("spdx"),
                    "source": "npm",
                })
    out.sort(key=lambda c: len(c["name"]))
    return out[:limit]


def npm_svg(icon_id):
    prefix, _, name = icon_id.partition(":")
    icons, _ = _npm_set(prefix)
    aliases = icons.get("aliases", {})
    while name not in icons["icons"]:
        if name not in aliases:
            raise KeyError(f"{icon_id} not in @iconify-json/{prefix}")
        name = aliases[name]["parent"]
    ic = icons["icons"][name]
    w, h = ic.get("width", icons.get("width", 16)), ic.get("height", icons.get("height", 16))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            f'{ic["body"]}</svg>')


ADAPTERS = {"iconify": (iconify_search, iconify_svg), "npm": (npm_search, npm_svg)}


# ── style gating ──────────────────────────────────────────────────────────

def allowed_sets(style):
    """Sets whose published style matches the pinned style.

    This is the check that stops a deliverable carrying five visual languages.
    A 1.5px-stroke icon beside a 2px one reads as broken even when each is
    individually fine.
    """
    want_grid, want_stroke = style.get("grid"), style.get("stroke")
    want_style = style.get("style")
    ok = []
    for prefix, meta in SOURCES["sets"].items():
        if want_style and meta.get("style") not in (want_style, "both"):
            continue
        if want_grid and meta.get("grid") != want_grid:
            continue
        if want_stroke and meta.get("stroke") not in (None, want_stroke) \
                and not meta.get("variable_stroke"):
            continue
        ok.append(prefix)
    return ok


def license_ok(cand, style):
    allow = style.get("allowed_licenses")
    if not allow:
        return True
    spdx = (cand.get("license_spdx") or "").upper()
    return any(a.upper() in spdx for a in allow) if spdx else False


def score(cand, query, style):
    """Rank candidates. Primary set wins ties; exact name match outranks all."""
    q = query.lower().replace(" ", "-")
    s = 0
    if cand["name"] == q:
        s += 100
    elif q in cand["name"]:
        s += 50
    elif any(w in cand["name"] for w in q.split("-")):
        s += 20
    if cand["set"] == style.get("primary_set"):
        s += 30
    elif cand["set"] == style.get("fallback_set"):
        s += 10
    if not license_ok(cand, style):
        s -= 1000
    return s


# ── commands ──────────────────────────────────────────────────────────────

def load(p, default=None):
    p = pathlib.Path(p)
    return json.loads(p.read_text()) if p.exists() else (default if default is not None else {})


def cmd_search(a):
    style = load(a.style)
    if not style:
        print("no pinned style. Run setup first — deriving style per call "
              "produces a different style every call.", file=sys.stderr)
        sys.exit(2)

    reg = load(a.registry, {"icons": {}})
    concepts = load(a.concepts, {})

    q = a.query.lower().strip()
    key = q.replace(" ", "-")

    # 1 — the project's own icons, by name AND by alias.
    # Audited icons often carry a guessed canonical name with the meaningful
    # name sitting in aliases, so searching only canonicals misses them.
    def matches(n, m):
        names = [n] + list(m.get("aliases", []))
        return any(key in x or x in key or any(w in x for w in key.split("-"))
                   for x in names)
    hits = [n for n, m in reg.get("icons", {}).items() if matches(n, m)]
    if hits:
        print(f"ALREADY IN THE PROJECT — use one of these before fetching:")
        for h in hits[:8]:
            m = reg["icons"][h]
            al = f"  (aka {', '.join(m['aliases'][:3])})" if m.get("aliases") else ""
            print(f"  {h:28} used in {len(m.get('used_in', []))} file(s){al}")
        print("\nIf none of these genuinely fits, say what is wrong with them and "
              "re-run with --force to search sources.")
        if not a.force:
            return

    # 2 — the concept map
    if key in concepts:
        c = concepts[key]
        print(f"CONCEPT MAP: {key} -> {c['chosen']}")
        print(f"  rejected: {', '.join(c.get('rejected', []))}")
        print(f"  reason:   {c.get('reason', '—')}")
        if not a.force:
            return

    # 3 — sources
    sets = allowed_sets(style)
    if not sets:
        print("no configured set matches the pinned style. Either widen the "
              "style or add a set to schema/sources.json.", file=sys.stderr)
        sys.exit(3)

    print(f"searching {len(sets)} style-compatible sets: {', '.join(sets[:8])}"
          f"{' ...' if len(sets) > 8 else ''}")
    search_fn, _ = ADAPTERS[a.source]
    if a.source == "npm":
        # npm downloads whole sets; search the pinned ones, not every compatible set
        sets = [x for x in (style.get("primary_set"), style.get("fallback_set")) if x in sets]
    try:
        cands = search_fn(a.query, sets=sets, limit=40)
    except (urllib.error.URLError, OSError) as e:
        print(f"source unreachable: {e}. Nothing fetched. If the npm registry is "
              f"reachable, re-run with --source npm.", file=sys.stderr)
        sys.exit(4)

    cands = [c for c in cands if license_ok(c, style)]
    cands.sort(key=lambda c: -score(c, a.query, style))
    if not cands:
        print("nothing matched within the allowed sets and licences.")
        return

    top = cands[:a.limit]
    best = score(top[0], a.query, style)
    runner = score(top[1], a.query, style) if len(top) > 1 else -999

    # Auto-pick only on an unambiguous exact name match INSIDE the primary set.
    #
    # Ambiguity means two different GLYPHS compete, not two sets carrying the
    # same name — lucide:search and tabler:search are the same decision, and
    # the primary set settles it. But material-symbols:verified against
    # lucide:badge-check is a choice about meaning and house style, and that
    # belongs to the person, not to a score.
    qk = a.query.lower().replace(" ", "-")
    primary_exact = [c for c in cands
                     if c["name"] == qk and c["set"] == style.get("primary_set")]
    decisive = len(primary_exact) == 1 and top[0]["id"] == primary_exact[0]["id"]

    print(f"\n{'AUTO' if decisive else 'ASK'} — {len(top)} candidates")
    for i, c in enumerate(top, 1):
        print(f"  {i}. {c['id']:34} {c['set_title']:22} {c['license']}")
    if decisive:
        print(f"\nExact name match in the primary set ({style['primary_set']}), "
              f"clear of the runner-up. Proceeding with {top[0]['id']}.")
    else:
        print("\nScores are close, or the choice is semantic rather than "
              "cosmetic. Render these and ask which one before adding:")
        for c in top[:3]:
            print(f"  python fetch.py add {c['id']} --source {a.source} --name <your-name>")

    pathlib.Path(a.out).write_text(json.dumps(top, indent=2))
    print(f"\ncandidates written to {a.out}")


def cmd_add(a):
    style = load(a.style)
    reg = load(a.registry, {"schema_version": 1, "icons": {}})
    _, svg_fn = ADAPTERS[a.source]
    try:
        raw = svg_fn(a.icon_id)
    except (urllib.error.URLError, OSError, KeyError) as e:
        print(f"fetch failed: {e}", file=sys.stderr); sys.exit(4)

    norm, meta = normalize(raw, grid=style.get("grid"), stroke=style.get("stroke"))
    h = content_hash(norm)

    for name, m in reg.get("icons", {}).items():
        if m.get("hash") == h:
            print(f"ALREADY PRESENT as '{name}' — same geometry, different name. "
                  f"Not adding a duplicate.")
            print(f"  use: {name}")
            return

    name = a.name or a.icon_id.split(":")[-1]
    outdir = pathlib.Path(a.out_dir); (outdir / "svg").mkdir(parents=True, exist_ok=True)
    (outdir / "svg" / f"{name}.svg").write_text(norm)

    reg.setdefault("icons", {})[name] = {
        "hash": h, "aliases": [], "used_in": [],
        "fingerprint": fingerprint(norm),
        "source": f"{a.source}:{a.icon_id}",
        "license": a.license or (_npm_set(a.icon_id.partition(":")[0])[1]
                                 .get("license", {}).get("spdx", "unknown")
                                 if a.source == "npm" else "unknown"),
        "style_match": {
            "rescaled_from": meta.get("rescaled_from"),
            "source_stroke": meta.get("source_stroke"),
            "target_grid": style.get("grid"),
            "target_stroke": style.get("stroke"),
        },
    }
    pathlib.Path(a.registry).write_text(json.dumps(reg, indent=2))

    print(f"added {name}  <- {a.icon_id}")
    if meta.get("rescaled_from"):
        print(f"  ! rescaled from {meta['rescaled_from']:g} to {style.get('grid')} — "
              f"check optical weight against neighbours")
    if a.concept:
        concepts = load(a.concepts, {})
        concepts[a.concept] = {"chosen": a.icon_id, "rejected": a.rejected or [],
                               "reason": a.reason or ""}
        pathlib.Path(a.concepts).write_text(json.dumps(concepts, indent=2))
        print(f"  concept '{a.concept}' recorded")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--style", default="icons/style.json")
    s.add_argument("--registry", default="icons/registry.json")
    s.add_argument("--concepts", default="icons/concepts.json")
    s.add_argument("--out", default="icons/candidates.json")
    s.add_argument("--limit", type=int, default=6)
    s.add_argument("--source", default="iconify", choices=["iconify", "npm"])
    s.add_argument("--force", action="store_true",
                   help="search sources even when the project already has a match")
    s.set_defaults(func=cmd_search)

    d = sub.add_parser("add")
    d.add_argument("icon_id")
    d.add_argument("--name")
    d.add_argument("--source", default="iconify", choices=["iconify", "npm"])
    d.add_argument("--style", default="icons/style.json")
    d.add_argument("--registry", default="icons/registry.json")
    d.add_argument("--concepts", default="icons/concepts.json")
    d.add_argument("--out-dir", default="icons")
    d.add_argument("--license")
    d.add_argument("--concept")
    d.add_argument("--reason")
    d.add_argument("--rejected", nargs="*")
    d.set_defaults(func=cmd_add)

    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
