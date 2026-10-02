#!/usr/bin/env python3
"""
Rasterise registered SVGs to PNG at the declared size set.

Sources serve SVG, not PNG, so PNG is generated locally. That is better
anyway: you control the sizes, and they stay consistent instead of being
produced ad hoc at whatever dimension someone needed that day.

Tries cairosvg, then resvg, then rsvg-convert, then Inkscape. Reports which
one it used, because they antialias slightly differently and mixing them
across a set is visible at 16px.

    python rasterize.py --registry icons/registry.json --svg-dir icons/svg \
        --out icons/png --style icons/style.json --color "#4f4f4f"
"""
import argparse, json, pathlib, shutil, subprocess, sys


def backend():
    try:
        import cairosvg  # noqa: F401
        return "cairosvg"
    except ImportError:
        pass
    for exe, name in (("resvg", "resvg"), ("rsvg-convert", "rsvg-convert"),
                      ("inkscape", "inkscape")):
        if shutil.which(exe):
            return name
    return None


def render(svg_path, png_path, px, how):
    if how == "cairosvg":
        import cairosvg
        cairosvg.svg2png(url=str(svg_path), write_to=str(png_path),
                         output_width=px, output_height=px)
    elif how == "resvg":
        subprocess.run(["resvg", "-w", str(px), "-h", str(px),
                        str(svg_path), str(png_path)], check=True,
                       capture_output=True)
    elif how == "rsvg-convert":
        subprocess.run(["rsvg-convert", "-w", str(px), "-h", str(px),
                        "-o", str(png_path), str(svg_path)], check=True,
                       capture_output=True)
    elif how == "inkscape":
        subprocess.run(["inkscape", str(svg_path), "-w", str(px), "-h", str(px),
                        "-o", str(png_path)], check=True, capture_output=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default="icons/registry.json")
    ap.add_argument("--svg-dir", default="icons/svg")
    ap.add_argument("--out", default="icons/png")
    ap.add_argument("--style", default="icons/style.json")
    ap.add_argument("--color", default="#000000",
                    help="currentColor resolves to this; PNG cannot be themed")
    ap.add_argument("--only", nargs="*", help="icon names; default is all")
    a = ap.parse_args()

    how = backend()
    if not how:
        print("No rasteriser available. Install one:\n"
              "  pip install cairosvg --break-system-packages\n"
              "  or: apt install librsvg2-bin   (rsvg-convert)\n"
              "SVGs are unaffected — only PNG generation needs this.",
              file=sys.stderr)
        sys.exit(2)

    style = json.loads(pathlib.Path(a.style).read_text())
    reg = json.loads(pathlib.Path(a.registry).read_text())
    sizes = style.get("png_sizes", [16, 20, 24, 32])
    scales = style.get("png_scales", [1, 2, 3])

    svg_dir, out = pathlib.Path(a.svg_dir), pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    names = a.only or sorted(reg.get("icons", {}))
    made = 0

    for name in names:
        src = svg_dir / f"{name}.svg"
        if not src.exists():
            print(f"  ! {name}: no SVG at {src}")
            continue
        # currentColor has no meaning in a raster; bake the colour in
        txt = src.read_text().replace("currentColor", a.color)
        tmp = out / f".{name}.tmp.svg"
        tmp.write_text(txt)
        for s in sizes:
            for k in scales:
                px = s * k
                suffix = "" if k == 1 else f"@{k}x"
                dst = out / f"{name}-{s}{suffix}.png"
                try:
                    render(tmp, dst, px, how)
                    made += 1
                except Exception as e:
                    print(f"  ! {name} @{px}px failed: {e}")
        tmp.unlink(missing_ok=True)

    print(f"rasteriser: {how}")
    print(f"icons: {len(names)}  sizes: {sizes}  scales: {scales}")
    print(f"wrote {made} PNGs to {out}")
    print(f"colour baked in: {a.color} — regenerate for a different theme")


if __name__ == "__main__":
    main()
