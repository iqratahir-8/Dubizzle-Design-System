#!/usr/bin/env python3
"""
SVG normalisation and content hashing.

Shared by audit.py (icons already in the project) and fetch.py (icons pulled
from a source), so an icon from either path ends up in exactly the same shape.
That matters for two reasons:

  - themeable output. An icon with a baked-in fill cannot take a token colour,
    so every paint becomes currentColor.
  - real deduplication. The same glyph arrives from different sets under
    different names with different wrappers. Hashing the raw markup misses
    that; hashing normalised geometry catches it.
"""
import hashlib
import re
import xml.etree.ElementTree as ET

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)

# attributes that carry paint and must become currentColor (or be dropped)
PAINT_ATTRS = ("fill", "stroke")
# attributes that are presentation noise and never survive normalisation
DROP_ATTRS = (
    "class", "id", "style", "data-name", "xml:space", "xmlns:xlink",
    "aria-hidden", "focusable", "role", "version", "x", "y",
)
# geometry-bearing attributes, in the order they are hashed
GEOM_ATTRS = ("d", "points", "x1", "y1", "x2", "y2", "cx", "cy", "r",
              "rx", "ry", "width", "height", "transform")


def _local(tag):
    return tag.split("}")[-1] if "}" in tag else tag


def _round_numbers(s, places=2):
    """Collapse float noise so 11.999999 and 12 hash the same."""
    def r(m):
        v = float(m.group(0))
        return str(int(v)) if v == int(v) else f"{v:.{places}f}".rstrip("0").rstrip(".")
    return re.sub(r"-?\d+\.?\d*(?:e-?\d+)?", r, s)


def canonical_path(d):
    """Rewrite path data into one canonical token stream.

    `M20 6 9 17l-5-5` and `M20.0 6.000 9 17.00l-5.0 -5` describe the same
    geometry but differ in whitespace and precision. Without this they hash
    differently and the duplicate is never found — which is the main thing
    the hash exists to do.
    """
    toks = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|-?\d+\.?\d*(?:[eE]-?\d+)?", d)
    out = []
    for t in toks:
        if t.isalpha():
            out.append(t)
        else:
            v = float(t)
            out.append(str(int(v)) if v == int(v)
                       else f"{v:.2f}".rstrip("0").rstrip("."))
    return " ".join(out)


def normalize(svg_text, grid=None, stroke=None, keep_fill_rule=True):
    """Return (normalised_svg_string, meta dict).

    grid:   target viewBox size, e.g. 24. None keeps the source viewBox.
    stroke: target stroke-width. None keeps the source width.
    """
    svg_text = re.sub(r"<\?xml[^>]*\?>", "", svg_text).strip()
    svg_text = re.sub(r"<!--.*?-->", "", svg_text, flags=re.S)
    root = ET.fromstring(svg_text)

    meta = {
        "source_viewbox": root.get("viewBox"),
        "source_stroke": None,
        "style": None,          # outline | filled | mixed
        "has_paint": False,
    }

    vb = root.get("viewBox")
    if vb:
        try:
            nums = [float(x) for x in re.split(r"[ ,]+", vb.strip())]
            src_size = max(nums[2], nums[3]) if len(nums) == 4 else None
        except ValueError:
            src_size = None
    else:
        w, h = root.get("width"), root.get("height")
        src_size = None
        if w and h:
            try:
                src_size = max(float(re.sub(r"[^\d.]", "", w)),
                               float(re.sub(r"[^\d.]", "", h)))
                root.set("viewBox", f"0 0 {src_size:g} {src_size:g}")
            except ValueError:
                pass

    strokes, fills = [], []

    def walk(el):
        for a in DROP_ATTRS:
            el.attrib.pop(a, None)
        sw = el.get("stroke-width")
        if sw:
            try:
                strokes.append(float(sw))
            except ValueError:
                pass
        for a in PAINT_ATTRS:
            v = el.get(a)
            if v is None:
                continue
            v = v.strip()
            if v.lower() == "none":
                continue
            meta["has_paint"] = True
            (fills if a == "fill" else strokes and fills).append(v) if False else None
            if a == "fill":
                fills.append(v)
            el.set(a, "currentColor")
        for child in list(el):
            if _local(child.tag) in ("title", "desc", "metadata"):
                el.remove(child)
            else:
                walk(child)

    walk(root)

    if strokes:
        meta["source_stroke"] = max(set(strokes), key=strokes.count)

    # style classification: stroke-only geometry is outline, fill-only is filled
    stroked = any(e.get("stroke") for e in root.iter())
    filled = any(e.get("fill") == "currentColor" for e in root.iter())
    meta["style"] = ("mixed" if stroked and filled
                     else "outline" if stroked
                     else "filled" if filled
                     else "unknown")

    # retarget the grid
    if grid and src_size and src_size != grid:
        scale = grid / src_size
        g = ET.Element(f"{{{SVG_NS}}}g")
        g.set("transform", f"scale({scale:g})")
        for child in list(root):
            root.remove(child)
            g.append(child)
        root.append(g)
        root.set("viewBox", f"0 0 {grid:g} {grid:g}")
        meta["rescaled_from"] = src_size
    elif grid and not src_size:
        root.set("viewBox", f"0 0 {grid:g} {grid:g}")

    # retarget stroke width on the root so children inherit it
    if stroke is not None and meta["style"] in ("outline", "mixed"):
        for e in root.iter():
            e.attrib.pop("stroke-width", None)
        root.set("stroke-width", str(stroke))

    root.attrib.pop("xmlns", None)      # ElementTree re-adds it on serialise
    root.attrib.pop("width", None)
    root.attrib.pop("height", None)
    if meta["style"] == "outline":
        root.set("fill", "none")
        root.set("stroke", "currentColor")

    out = ET.tostring(root, encoding="unicode")
    out = re.sub(r"\s*xmlns:ns\d+=\"[^\"]*\"", "", out)
    out = re.sub(r"ns\d+:", "", out)
    return out, meta


def content_hash(svg_text):
    """Hash normalised GEOMETRY, not markup.

    Two files with different wrappers, different attribute order and different
    float precision but the same shape produce the same hash. That is what
    makes 'we already have this icon under another name' findable.
    """
    try:
        root = ET.fromstring(re.sub(r"<\?xml[^>]*\?>", "", svg_text).strip())
    except ET.ParseError:
        return hashlib.sha256(svg_text.encode()).hexdigest()[:16]

    parts = []
    for el in root.iter():
        tag = _local(el.tag)
        if tag in ("svg", "g", "title", "desc", "metadata", "defs"):
            continue
        seg = [tag]
        for a in GEOM_ATTRS:
            v = el.get(a)
            if v:
                seg.append(f"{a}={canonical_path(v) if a == 'd' else _round_numbers(v)}")
        if len(seg) > 1:
            parts.append("|".join(seg))

    parts.sort()      # attribute and element order must not affect the hash
    return hashlib.sha256("\n".join(parts).encode()).hexdigest()[:16]


def fingerprint(svg_text):
    """Measurable style properties, used to infer a project's icon style when
    nobody wrote it down."""
    _, meta = normalize(svg_text)
    try:
        root = ET.fromstring(re.sub(r"<\?xml[^>]*\?>", "", svg_text).strip())
    except ET.ParseError:
        return {}
    vb = root.get("viewBox")
    grid = None
    if vb:
        try:
            n = [float(x) for x in re.split(r"[ ,]+", vb.strip())]
            grid = max(n[2], n[3]) if len(n) == 4 else None
        except ValueError:
            pass
    caps = [e.get("stroke-linecap") for e in root.iter() if e.get("stroke-linecap")]
    joins = [e.get("stroke-linejoin") for e in root.iter() if e.get("stroke-linejoin")]
    return {
        "grid": grid,
        "stroke": meta.get("source_stroke"),
        "style": meta.get("style"),
        "cap": max(set(caps), key=caps.count) if caps else None,
        "join": max(set(joins), key=joins.count) if joins else None,
    }
