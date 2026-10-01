#!/usr/bin/env python3
"""
Audit the icons a project already has.

Walks HTML, SVG and component files, extracts every inline <svg>, normalises
it, hashes the geometry and groups duplicates. Emits a registry plus a
consolidation list.

Run this ONCE per project, before fetching anything. Two reasons:

  - the same glyph is usually already present several times under different
    names, with different viewBoxes and stroke widths. Name search never
    finds those; geometry hashing does.
  - when nobody wrote the icon style down, this measures it from what is
    actually there, which beats asking someone to remember.

    python audit.py --root PROJECT_DIR --out icons/
"""
import argparse, json, pathlib, re, sys, collections, datetime
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from normalize import normalize, content_hash, fingerprint
from _version import skill_version, skill_name

SVG_BLOCK = re.compile(r"<svg\b[^>]*>.*?</svg>", re.S | re.I)
SCAN_EXT = {".html", ".htm", ".svg", ".jsx", ".tsx", ".vue", ".svelte", ".md"}
SKIP_DIR = {"node_modules", ".git", "dist", "build", "__pycache__", ".next"}


def guess_name(block, path, idx):
    """Best-effort name from aria-label, title, class, or the file."""
    m = re.search(r'aria-label="([^"]+)"', block)
    if m:
        return re.sub(r"\W+", "-", m.group(1).strip().lower()).strip("-")
    m = re.search(r"<title[^>]*>(.*?)</title>", block, re.S | re.I)
    if m:
        return re.sub(r"\W+", "-", m.group(1).strip().lower()).strip("-")
    m = re.search(r'class="([^"]*\bicon[\w-]*)', block)
    if m:
        return re.sub(r"\W+", "-", m.group(1).strip().lower()).strip("-")
    if path.suffix == ".svg":
        return path.stem
    return f"{path.stem}-icon-{idx}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--out", default="icons")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    out = pathlib.Path(a.out)
    found = []

    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in SCAN_EXT:
            continue
        if any(part in SKIP_DIR for part in p.parts):
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for i, m in enumerate(SVG_BLOCK.finditer(text)):
            block = m.group(0)
            if "<use" in block and "<path" not in block and "<circle" not in block:
                continue                      # sprite reference, not a glyph
            try:
                h = content_hash(block)
                fp = fingerprint(block)
            except Exception:
                continue
            found.append({
                "hash": h,
                "name": guess_name(block, p, i),
                "file": str(p.relative_to(root)),
                "fingerprint": fp,
                "svg": block,
            })

    if not found:
        print("no inline SVG found. If icons live in a sprite sheet or an icon "
              "font, point --root at the sheet or say so — this script only "
              "reads inline <svg>.")
        sys.exit(0)

    groups = collections.defaultdict(list)
    for f in found:
        groups[f["hash"]].append(f)

    # infer the project's style from what is actually present
    grids = [f["fingerprint"].get("grid") for f in found if f["fingerprint"].get("grid")]
    strokes = [f["fingerprint"].get("stroke") for f in found if f["fingerprint"].get("stroke")]
    styles = [f["fingerprint"].get("style") for f in found if f["fingerprint"].get("style")]
    caps = [f["fingerprint"].get("cap") for f in found if f["fingerprint"].get("cap")]

    def mode(xs):
        return collections.Counter(xs).most_common(1)[0][0] if xs else None

    def spread(xs):
        return sorted(collections.Counter(xs).items(), key=lambda x: -x[1])

    inferred = {
        "grid": mode(grids), "stroke": mode(strokes),
        "style": mode(styles), "cap": mode(caps),
        "confidence": "high" if grids and len(set(grids)) == 1 else "mixed",
        "grid_spread": spread(grids), "stroke_spread": spread(strokes),
        "style_spread": spread(styles),
    }

    registry = {
        "schema_version": 1,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "generated_by": f"{skill_name()} {skill_version()}",
        "source": "audit",
        "icons": {},
    }
    dupes = []
    for h, g in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        names = sorted({x["name"] for x in g})
        canonical = names[0]
        if canonical in registry["icons"]:
            # Two different glyphs share a name (e.g. action/search.svg and
            # mobile/search.svg). Qualify with the folder rather than let the
            # second silently overwrite the first and vanish from the registry.
            parent = pathlib.Path(g[0]["file"]).parent.name
            canonical = f"{parent}-{canonical}" if parent else f"{canonical}-{h[:6]}"
            while canonical in registry["icons"]:
                canonical = f"{canonical}-{h[:6]}"
        registry["icons"][canonical] = {
            "hash": h,
            "aliases": [n for n in names if n != canonical],
            "used_in": sorted({x["file"] for x in g}),
            "instances": len(g),
            "fingerprint": g[0]["fingerprint"],
            "source": "project",
            "license": "inherited-unknown",
        }
        if len(g) > 1:
            dupes.append({"canonical": canonical, "hash": h, "copies": len(g),
                          "names": names, "files": sorted({x["file"] for x in g})})

    out.mkdir(parents=True, exist_ok=True)
    if a.write:
        (out / "registry.json").write_text(json.dumps(registry, indent=2))
        (out / "audit-duplicates.json").write_text(json.dumps(dupes, indent=2))
        svgdir = out / "svg"; svgdir.mkdir(exist_ok=True)
        for name, meta in registry["icons"].items():
            g = groups[meta["hash"]][0]
            norm, _ = normalize(g["svg"], grid=inferred["grid"], stroke=inferred["stroke"])
            (svgdir / f"{name}.svg").write_text(norm)

    print(f"scanned {root}")
    print(f"  inline svg found     {len(found)}")
    print(f"  unique glyphs        {len(groups)}")
    print(f"  duplicated glyphs    {len(dupes)}")
    print()
    print("inferred style")
    print(f"  grid    {inferred['grid']}   spread {inferred['grid_spread']}")
    print(f"  stroke  {inferred['stroke']}   spread {inferred['stroke_spread']}")
    print(f"  style   {inferred['style']}   spread {inferred['style_spread']}")
    print(f"  cap     {inferred['cap']}")
    print(f"  confidence: {inferred['confidence']}")
    if inferred["confidence"] == "mixed":
        print("\n  Mixed grids or strokes means the existing set is not internally")
        print("  consistent. Pin a style deliberately rather than inheriting the")
        print("  most common value by accident.")

    if dupes:
        print(f"\nconsolidate these — same geometry, different names:")
        for d in dupes[:12]:
            print(f"  {d['copies']}x  {', '.join(d['names'][:4])}")
        if len(dupes) > 12:
            print(f"  ... {len(dupes)-12} more")

    if a.write:
        print(f"\nwrote {out}/registry.json, audit-duplicates.json, svg/")
    else:
        print("\ndry run — pass --write to emit the registry")

    (out / "inferred-style.json").write_text(json.dumps(inferred, indent=2)) if a.write else None


if __name__ == "__main__":
    main()
