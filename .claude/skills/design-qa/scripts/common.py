"""Shared helpers for the design-qa scripts."""
import json, pathlib, re

def repo_root(start=None):
    # the working directory first, so the scripts also work when the skill is installed outside the repo
    starts = [pathlib.Path(start).resolve()] if start else [pathlib.Path.cwd().resolve(), pathlib.Path(__file__).resolve()]
    for p in starts:
        for parent in [p] + list(p.parents):
            if (parent / "package.json").exists() and (parent / "design-kit").is_dir():
                return parent
    raise SystemExit("cannot find the repo root (package.json + design-kit/)")

def load_json(p, default=None):
    p = pathlib.Path(p)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))

def load_platforms(root):
    skill = pathlib.Path(__file__).resolve().parent.parent
    cfg = load_json(skill / "schema" / "platforms.json")
    override = load_json(root / "design-kit" / "qa" / "platforms.json", {}) or {}
    for k, v in (override.get("platforms") or {}).items():
        cfg["platforms"].setdefault(k, {}).update(v)
    for k in ("canonical_breakpoints",):
        if k in override:
            cfg[k] = override[k]
    return cfg

def resolve_file(root, page, plat, state):
    """(path, marker) for a page/platform/state, or (None, None) if not declared.
    state_files values are 'path' or 'path#name' (name = [data-state=name] inside the file)."""
    if state == "default":
        p = (page.get("platforms") or {}).get(plat)
        return (p, None) if p else (None, None)
    v = ((page.get("state_files") or {}).get(state) or {}).get(plat)
    if not v:
        return (None, None)
    path, _, marker = v.partition("#")
    return (path, marker or None)

def file_ok(root, path, marker=None):
    fp = root / path
    if not fp.exists():
        return False
    if marker:
        return f'data-state="{marker}"' in fp.read_text(encoding="utf-8", errors="ignore")
    return True

def select_pages(registry, scope):
    pages = registry.get("pages", {})
    if not scope or scope == "all":
        return dict(pages)
    out = {}
    for k, v in pages.items():
        if scope in (k, v.get("feature"), v.get("vertical"), v.get("origin"), v.get("kind")):
            out[k] = v
    return out

def visible_text(html):
    html = re.sub(r"data:[a-z0-9.+/-]+;base64,[A-Za-z0-9+/=]+", "", html, flags=re.I)
    html = re.sub(r"<(script|style|noscript|svg|template)\b[\s\S]*?</\1>", " ", html, flags=re.I)
    chunks = re.split(r"<[^>]*>", html)
    out = []
    for c in chunks:
        c = re.sub(r"&nbsp;", " ", c)
        c = re.sub(r"&amp;", "&", c)
        c = re.sub(r"\s+", " ", c).strip()
        if c:
            out.append(c)
    return out


# Regions that are measured production components reused inside authored pages (header, footer, bottom nav).
# Findings inside them are production's, not ours — they are treated as origin=live (capped at note).
LIVE_REGIONS_DEFAULT = ["header", "footer", ".header", ".footer", ".header-mobile", ".bottom-nav",
                        ".mobile-footer", "[data-live-partial]"]

def live_regions(registry):
    return registry.get("live_regions") or LIVE_REGIONS_DEFAULT

def strip_live_regions(html):
    for tag in ("header", "footer"):
        html = re.sub(rf"<{tag}\b[\s\S]*?</{tag}>", " ", html, flags=re.I)
    html = re.sub(r"<nav\b[^>]*bottom-nav[\s\S]*?</nav>", " ", html, flags=re.I)
    return html
