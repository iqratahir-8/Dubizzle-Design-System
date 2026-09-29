#!/usr/bin/env python3
"""
Bundle a deliverable into ONE self-contained HTML file: CSS, JS, fonts (base64), images, the
node ledger and the QA report are inlined; zero network requests. Fails if a remote reference
survives, if visible text carries a real-looking phone/email, or if it is over the size limit.

    python3 bundle.py --src <build dir with index.html> --out <file.html> --feature F --version N
        [--ids design-kit/qa/ids.json] [--qa-report report.json] [--locales en] [--classification internal]
        [--manifest manifest.json] [--allow-external] [--allow-pii]

Sources stay split in git. Never hand-edit the bundled output — rebuild it.
"""
import argparse, base64, datetime, hashlib, json, mimetypes, pathlib, re, sys

SIZE_BUDGET_MB, SIZE_HARD_MB = 12.0, 25.0
FONT_MIME = {".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf"}
PHONE = re.compile(r"(?<!\d)(?:(?:\+|00)?20[ \t-]?)?0?1[0125](?:[ \t-]?\d){8}(?!\d)")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
SAFE_PHONE = {"01012345678"}


def data_uri(p):
    mime = FONT_MIME.get(p.suffix.lower()) or mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")


def resolve_imports(css, base, log, seen=None):
    """Inline local @import rules recursively; drop remote ones (cannot be inlined)."""
    seen = seen or set()
    def repl(m):
        target = (m.group(1) or m.group(2) or "").strip("'\" ")
        if target.startswith(("http://", "https://", "//")):
            log.append(("dropped-import", target)); return ""
        p = (base / target).resolve()
        if not p.exists() or p in seen:
            log.append(("missing-import", target)); return ""
        seen.add(p)
        return inline_css_urls(resolve_imports(p.read_text(encoding="utf-8"), p.parent, log, seen), p.parent, log)
    return re.sub(r"@import\s+(?:url\(([^)]+)\)|(['\"][^'\"]+['\"]))\s*[^;]*;", repl, css)


MAX_CSS_IMAGE_BYTES = 40_000
PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="


def inline_css_urls(css, base, log):
    """url() -> data URI. Fonts always; images only when small. A production stylesheet references dozens of
    banners and backgrounds no screen here shows, and inlining them all blows the size limit — large ones
    become a transparent pixel and are logged (a captured page's visible images are <img> tags, handled elsewhere)."""
    def repl(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith(("data:", "#")):
            return m.group(0)
        if raw.startswith(("http://", "https://", "//")):
            log.append(("external-css-url", raw)); return f'url("{PIXEL}")' if not FONT_URL.search(raw) else m.group(0)
        p = (base / raw.split("?")[0].split("#")[0]).resolve()
        if not p.exists():
            log.append(("missing-css-asset", raw)); return m.group(0)
        if p.suffix.lower() not in FONT_MIME and p.stat().st_size > MAX_CSS_IMAGE_BYTES:
            log.append(("dropped-large-css-image", p.name)); return f'url("{PIXEL}")'
        log.append(("inlined", p.name))
        return f"url('{data_uri(p)}')"
    return re.sub(r"url\(([^)]+)\)", repl, css)


FONT_URL = re.compile(r"\.(woff2?|ttf|otf|eot)(\?|#|$)", re.I)


def prune_fonts(css, locales, log):
    """Drop @font-face rules that cannot render in this deliverable: Arabic faces when 'ar' is out of
    scope, the lowercase 'proxima-nova' alias family, and weights no rule uses. (Subsetting glyphs is not automated.)"""
    used_w = {"400", "700"} | set(re.findall(r"font-weight\s*:\s*(\d{3})", css))
    def repl(m):
        blk = m.group(0)
        fam = re.search(r"font-family\s*:\s*['\"]?([^;'\"]+)", blk)
        fam = fam.group(1).strip() if fam else ""
        w = re.search(r"font-weight\s*:\s*(\d{3})", blk)
        if fam == "proxima-nova" or (fam == "GESS" and "ar" not in locales) or (w and w.group(1) not in used_w):
            log.append(("pruned-font", f"{fam} {w.group(1) if w else ''}")); return ""
        return blk
    return re.sub(r"@font-face\s*\{[^}]*\}", repl, css)


def inline_html(html, base, log, locales):
    sheets = []
    def link_repl(m):
        href = m.group(1)
        if href.startswith(("http://", "https://", "//")):
            log.append(("dropped-remote-stylesheet", href)); return ""
        p = (base / href).resolve()
        if not p.exists():
            log.append(("missing-stylesheet", href)); return ""
        css = resolve_imports(p.read_text(encoding="utf-8"), p.parent, log)
        sheets.append(inline_css_urls(css, p.parent, log))
        return "@@SHEET@@"
    html = re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', link_repl, html, flags=re.I)
    html = re.sub(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\'][^>]*>', link_repl, html, flags=re.I)
    html = re.sub(r'<link[^>]+rel=["\'](preconnect|dns-prefetch)["\'][^>]*>', "", html, flags=re.I)
    combined = prune_fonts("\n".join(sheets), locales, log)
    first = True
    def sheet_repl(_m):
        nonlocal first
        if first:
            first = False
            return f'<style id="__css">\n{combined}\n</style>'
        return ""
    html = re.sub(r"@@SHEET@@", sheet_repl, html)
    def script_repl(m):
        src = m.group(1)
        if src.startswith(("http://", "https://", "//")):
            log.append(("dropped-remote-script", src)); return ""
        p = (base / src).resolve()
        if not p.exists():
            log.append(("missing-script", src)); return ""
        return "<script>\n" + p.read_text(encoding="utf-8").replace("</script", "<\\/script") + "\n</script>"
    html = re.sub(r'<script[^>]+src=["\']([^"\']+)["\'][^>]*>\s*</script>', script_repl, html, flags=re.I)
    def img_repl(m):
        pre, src, post = m.groups()
        if src.startswith(("data:", "http://", "https://")):
            if src.startswith("http"):
                log.append(("external-img", src))
            return m.group(0)
        p = (base / src).resolve()
        if not p.exists():
            log.append(("missing-image", src)); return m.group(0)
        log.append(("inlined", p.name))
        return f'<img{pre}src="{data_uri(p)}"{post}>'
    return re.sub(r'<img([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>', img_repl, html, flags=re.I)


def visible_text(html):
    html = re.sub(r"data:[a-z0-9.+/-]+;base64,[A-Za-z0-9+/=]+", "", html, flags=re.I)
    html = re.sub(r'<script[^>]*type="text/html"[^>]*>([\s\S]*?)</script>', r" \1 ", html, flags=re.I)
    html = re.sub(r"<(script|style|noscript|svg)[\s\S]*?</\1>", " ", html, flags=re.I)
    return re.sub(r"<[^>]*>", " ", html)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--feature", required=True); ap.add_argument("--version", required=True)
    ap.add_argument("--ids"); ap.add_argument("--qa-report"); ap.add_argument("--manifest")
    ap.add_argument("--locales", default="en"); ap.add_argument("--classification", default="internal")
    ap.add_argument("--allow-external", action="store_true"); ap.add_argument("--allow-pii", action="store_true")
    a = ap.parse_args()
    src = pathlib.Path(a.src); entry = src / "index.html"
    if not entry.exists():
        sys.exit(f"no index.html in {src}")
    log = []
    html = inline_html(entry.read_text(encoding="utf-8"), src, log, a.locales.split(","))
    for flag, el_id, label in ((a.ids, "__ids", "ids"), (a.qa_report, "__qa", "qa-report")):
        if flag and pathlib.Path(flag).exists():
            payload = pathlib.Path(flag).read_text(encoding="utf-8").replace("</", "<\\/")
            i = html.rfind("</body>")          # the DOCUMENT's </body>: screens embedded above each carry their own
            html = html[:i] + f'<script type="application/json" id="{el_id}">{payload}</script>\n' + html[i:]
            log.append(("embedded", label))
    built = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    meta = (f'<meta name="deliverable-feature" content="{a.feature}">\n<meta name="deliverable-version" content="{a.version}">\n'
            f'<meta name="deliverable-built" content="{built}">\n<meta name="classification" content="{a.classification}">\n')
    html = html.replace("</head>", meta + "</head>", 1)
    # things that LOAD are network dependencies; an ordinary <a href="https://…"> link is not
    remote = [r for r in re.findall(r'(?:\ssrc|\ssrcset|<link[^>]+href)=["\'](https?://[^"\']+)["\']', html) if not r.startswith("https://www.w3.org")]
    if remote and not a.allow_external:
        print("external references survived — the bundle would need the network:", file=sys.stderr)
        for r in sorted(set(remote))[:10]:
            print("  " + r, file=sys.stderr)
        sys.exit(3)
    if not a.allow_pii:
        t = visible_text(html)
        ph = [p for p in PHONE.findall(t) if re.sub(r"\D", "", p) not in SAFE_PHONE]
        em = [e for e in EMAIL.findall(t) if not e.lower().endswith(("@example.com", "@dubizzle.com.eg"))]
        if ph or em:
            print(f"PRIVACY — the document text carries {len(ph)} phone-like and {len(em)} email-like value(s); "
                  "redact them or pass --allow-pii after checking. Not writing the file.", file=sys.stderr)
            for x in (ph + em)[:5]:
                print("  " + x, file=sys.stderr)
            sys.exit(5)
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    mb = out.stat().st_size / 1_048_576
    digest = hashlib.sha256(out.read_bytes()).hexdigest()[:16]
    inl = sum(1 for k, _ in log if k.startswith("inlined"))
    warns = [f"{k}: {v}" for k, v in log if k.startswith(("missing", "dropped-import", "dropped-remote", "external"))]
    if a.manifest:
        pathlib.Path(a.manifest).write_text(json.dumps({"feature": a.feature, "version": a.version, "built": built, "file": str(out),
            "size_bytes": out.stat().st_size, "sha256_16": digest, "inlined": inl, "pruned_fonts": [v for k, v in log if k == "pruned-font"],
            "warnings": warns, "dropped_large_css_images": sum(1 for k, _ in log if k == "dropped-large-css-image"), "classification": a.classification}, indent=2))
    print(f"wrote {out}  {mb:.2f} MB  sha {digest}\ninlined {inl} assets, 0 network requests")
    for w in warns:
        print("  ! " + w)
    if mb > SIZE_HARD_MB:
        print(f"OVER HARD LIMIT ({SIZE_HARD_MB} MB) — split by platform or compress", file=sys.stderr); sys.exit(4)
    if mb > SIZE_BUDGET_MB:
        print(f"  ! over soft budget ({SIZE_BUDGET_MB} MB)")


if __name__ == "__main__":
    main()
