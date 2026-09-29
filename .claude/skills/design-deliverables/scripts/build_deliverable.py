#!/usr/bin/env python3
"""
Build a design deliverable for a feature: gate on the QA report, assign node ids, generate the
data-driven sections, assemble one index.html, bundle it into a single self-contained file.

    python3 build_deliverable.py --feature favourites-revamp [--report design-kit/qa/report/report.json]

Reads   design-kit/deliverables/<feature>/deliverable.json   (the intake — references/deliverable-json.md)
        design-kit/qa/registry.json, ids.json, report/report.json, tokens.css, patterns.css
Writes  design-kit/deliverables/<feature>/dist/<feature>-v<N>.html  (+ manifest.json), design-kit/qa/ids.json

Never modifies a screen or a token: screens are annotated in memory. Exit 3 = QA gate blocked.
"""
import argparse, copy, datetime, html as H, json, pathlib, re, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parent
sys.path.insert(0, str(HERE))
import assign_ids, consume_report  # noqa: E402

DELIV_VERSION_SCHEMA = 1


def repo_root():
    for p in [HERE] + list(HERE.parents):
        if (p / "package.json").exists() and (p / "design-kit").is_dir():
            return p
    sys.exit("cannot find the repo root")


def jload(p, default=None):
    p = pathlib.Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


def esc(s):
    return H.escape(str(s if s is not None else ""))


def md_to_html(md):
    """Tiny renderer for the fragments this skill generates: tables, headings, paragraphs, bullets, inline code/bold/italic."""
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    def inline(t):
        t = esc(t)
        t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
        t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
        t = re.sub(r"(?<![\w])_([^_]+)_(?![\w])", r"<em>\1</em>", t)
        return t
    out, lines, i = [], md.splitlines(), 0
    while i < len(lines):
        ln = lines[i]
        if ln.strip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            head = [c.strip() for c in re.split(r"(?<!\\)\|", ln.strip().strip("|"))]
            i += 2; rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", lines[i].strip().strip("|"))]); i += 1
            out.append("<table><tr>" + "".join(f"<th>{inline(h)}</th>" for h in head) + "</tr>" +
                       "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows) + "</table>")
            continue
        m = re.match(r"^(#{2,4})\s+(.*)$", ln)
        if m:
            lvl = len(m.group(1)) + 1
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>"); i += 1; continue
        if re.match(r"^\s*[-*]\s+", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i]):
                items.append(re.sub(r"^\s*[-*]\s+", "", lines[i])); i += 1
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>"); continue
        if ln.strip():
            para = [ln.strip()]; i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith(("|", "#", "-", "*")):
                para.append(lines[i].strip()); i += 1
            out.append(f"<p>{inline(' '.join(para))}</p>"); continue
        i += 1
    return "\n".join(out)


def table(headers, rows):
    return ("<table><tr>" + "".join(f"<th>{esc(h)}</th>" for h in headers) + "</tr>" +
            "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows) + "</table>")


# ── gathering ───────────────────────────────────────────────────────────────

def collect_screens(root, registry, dj):
    """[(group, page_id, platform, state, key, rel_file, marker)] for every existing file."""
    out = []
    for pid in dj["pages"]:
        page = registry["pages"].get(pid)
        if not page:
            sys.exit(f"deliverable.json names page '{pid}' which is not in the registry")
        for plat in dj["platforms"]:
            if plat not in (page.get("platforms") or {}):
                continue
            group = f"{pid}/{plat}"
            files = [("default", page["platforms"][plat], None)]
            for st, m in (page.get("state_files") or {}).items():
                v = m.get(plat)
                if v:
                    path, _, marker = v.partition("#")
                    files.append((st, path, marker or None))
            for st, path, marker in files:
                if (root / path).exists():
                    out.append((group, pid, plat, st, f"{group}/{st}", path, marker))
    return out


def prepare_screen(root, rel, marker, ledger, name, number, comps):
    html = (root / rel).read_text(encoding="utf-8")
    annotated, results, retired = assign_ids.assign(html, name, ledger, number, comps)
    sheets = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']', annotated, flags=re.I)
    annotated = re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>', "", annotated, flags=re.I)
    base = (root / rel).parent
    def img(m):
        pre, src, post = m.groups()
        if src.startswith(("data:", "http")):
            return m.group(0)
        p = (base / src).resolve()
        if not p.exists():
            return m.group(0)
        import base64, mimetypes
        mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        return f'<img{pre}src="data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"{post}>'
    annotated = re.sub(r'<img([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>', img, annotated, flags=re.I)
    def cssurl(m):                       # url(...) in <style> and in custom properties like --i:url(../icons/x.svg)
        raw = m.group(2)
        if raw.startswith(("data:", "http", "#", "//")):
            return m.group(0)
        rel = raw.split("?")[0].split("#")[0]
        # a url() in a custom property (--i:url(../icons/x.svg)) resolves against the stylesheet that USES the
        # variable — patterns.css — not against the page, so try the page first, then design-kit/patterns
        p = next((c for c in ((base / rel).resolve(), (root / "design-kit/patterns" / rel).resolve(), (root / "design-kit" / rel).resolve()) if c.exists()), None)
        if p is None:
            return m.group(0)
        import base64, mimetypes
        mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        return f"url(data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()})"
    annotated = re.sub(r"url\(\s*(['\"]?)([^)'\"]+)\1\s*\)", cssurl, annotated)
    return annotated, [(base / s).resolve() for s in sheets], results


def consumed_tokens(root, screens_html):
    tokens_css = (root / "design-kit/tokens/tokens.css").read_text(encoding="utf-8", errors="ignore")
    values = dict(re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", tokens_css))
    fonts = root / "design-kit/tokens/fonts.css"
    patterns = re.sub(r"/\*.*?\*/", "", (root / "design-kit/patterns/patterns.css").read_text(encoding="utf-8", errors="ignore"), flags=re.S)
    classes = set()
    for h in screens_html:
        for c in re.findall(r'\sclass="([^"]*)"', h):
            classes |= set(c.split())
    used = {}
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", patterns):
        if any(c in classes for c in re.findall(r"\.([\w-]+)", sel)):
            for v in re.findall(r"var\(\s*(--[\w-]+)", body):
                used[v] = used.get(v, 0) + 1
    for h in screens_html:
        for v in re.findall(r"var\(\s*(--[\w-]+)", "".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", h)) + "".join(re.findall(r'style="([^"]*)"', h))):
            used[v] = used.get(v, 0) + 1
    for v in list(used):                                        # one level of aliasing (--color-primary: var(--red-01))
        for inner in re.findall(r"var\(\s*(--[\w-]+)", values.get(v, "")):
            used.setdefault(inner, 0)
    return [(t, values.get(t, "— (not in tokens.css)"), n) for t, n in sorted(used.items())], patterns


def button_states(patterns, screens_html):
    cls = set()
    for h in screens_html:
        for tag, c in re.findall(r'<(button|a)[^>]*\sclass="([^"]*)"', h):
            for x in c.split():
                if re.match(r"^(btn|button|contact-btn|chip|pill)([-_]|$)", x) or tag == "button":
                    cls.add(x)
    rows = []
    states = {"hover": r":hover", "active": r":active", "focus": r":focus", "disabled": r":disabled|\[disabled\]|--disabled|is-disabled",
              "loading": r"--loading|is-loading|\[aria-busy"}
    sels = re.findall(r"([^{}]+)\{", patterns)
    for c in sorted(cls):
        have = {s: any(re.search(rf"\.{re.escape(c)}\b", sel) and re.search(rx, sel) for sel in sels) for s, rx in states.items()}
        rows.append((f"<code>.{esc(c)}</code>", "✓", *["✓" if have[s] else "—" for s in states]))
    return rows


# ── section builders ─────────────────────────────────────────────────────────

def frame_box(key, plat, marker):
    return f'<div class="dd-frame-box" data-key="{esc(key)}" data-platform="{esc(plat)}"></div>'


def screens_section(groups):
    out = ['<p class="dd-hint">Press <b>R</b> (or the button) to turn on redlines, then click any element: id, role, design-system component, box and computed style. '
           'Ids are stable across versions — quote them in tickets.</p><div class="dd-bar"><button class="dd-btn" id="dd-rl-toggle" aria-pressed="false">Redlines (R)</button></div>']
    for group, variants in groups.items():
        first = variants[0][0]
        out.append(f'<div class="dd-screen"><h3>{esc(group)} <small>{esc(" · ".join(v[0] for v in variants))}</small></h3>')
        if len(variants) > 1:
            out.append(f'<div class="dd-bar dd-picker" data-group="{esc(group)}" role="group" aria-label="state">' +
                       "".join(f'<button data-variant="{esc(st)}" aria-pressed="{"true" if st == first else "false"}">{esc(st)}</button>' for st, _, _ in variants) + "</div>")
        for st, key, plat in variants:
            out.append(f'<div class="dd-variant" data-group="{esc(group)}" data-variant="{esc(st)}"{"" if st == first else " hidden"}>{frame_box(key, plat, None)}</div>')
        out.append("</div>")
    return "\n".join(out)


def state_coverage(registry, dj, collected):
    have = {(g, s) for g, _, _, s, *_ in collected}
    rows = []
    for pid in dj["pages"]:
        page = registry["pages"][pid]
        for plat in dj["platforms"]:
            if plat not in (page.get("platforms") or {}):
                continue
            states = list(page.get("states") or ["default"])
            if "empty" not in states and not page.get("no_list"):
                states.append("empty")
            for st in states:
                ok = (f"{pid}/{plat}", st) in have
                link = f'<a href="?screen={esc(pid)}/{esc(plat)}&state={esc(st)}#screens-redlines">designed</a>' if ok else '<span style="color:var(--bad)">not designed</span>'
                rows.append((esc(pid), esc(plat), esc(st), link))
    return table(["page", "platform", "state", "status"], rows)


def next_display_numbers(sections, applicable):
    n, out = 0, {}
    for sid in sorted(sections, key=lambda s: sections[s]["order"]):
        if applicable.get(sid, (True, ""))[0]:
            n += 1; out[sid] = n
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", required=True)
    ap.add_argument("--report", default="design-kit/qa/report/report.json")
    ap.add_argument("--allow-blocked", action="store_true", help="debugging only; stamps the document DRAFT")
    a = ap.parse_args()
    root = repo_root()
    ddir = root / "design-kit/deliverables" / a.feature
    dj = jload(ddir / "deliverable.json")
    if not dj:
        sys.exit(f"{ddir / 'deliverable.json'} not found — do the intake first (references/deliverable-json.md)")
    version = int(dj["version"])
    if not any(int(c.get("version", 0)) == version for c in dj.get("changelog", [])):
        sys.exit(f"deliverable.json has no changelog entry for version {version} — a reviewer opening v{version} must see what changed")
    registry = jload(root / "design-kit/qa/registry.json")
    if not registry:
        sys.exit("design-kit/qa/registry.json missing")

    # 1 ── gate ────────────────────────────────────────────────────────────
    rep = consume_report.load(root / a.report)
    consume_report.gate(rep, a.allow_blocked)
    draft = rep["verdict"] == "blocked"
    scope_pages = set(rep["scope"].get("pages", []))
    missing = [p for p in dj["pages"] if p not in scope_pages and rep["scope"].get("feature") != "all"]
    if missing:
        sys.exit(f"the QA report does not cover page(s) {missing}; run design-qa on this feature first (scope: {sorted(scope_pages)[:6]})")
    frags, _counts = consume_report.fragments(rep)

    # 2 ── ids + screens ───────────────────────────────────────────────────
    ledger_path = root / "design-kit/qa/ids.json"
    ledger = assign_ids.load_ledger(ledger_path)
    before = copy.deepcopy(ledger["nodes"])
    comps = {p.name for p in (root / "src/components").iterdir() if p.is_dir()} if (root / "src/components").is_dir() else set()
    collected = collect_screens(root, registry, dj)
    if not collected:
        sys.exit("no screen files found for the pages/platforms in deliverable.json")
    script_tags, screens_html, css_sheets = [], [], []
    for group, pid, plat, st, key, rel, marker in collected:
        page = registry["pages"][pid]
        html, sheets, _res = prepare_screen(root, rel, marker, ledger, f"{plat}/{pid}" if st == "default" else f"{plat}/{pid}#{st}",
                                            None, comps)
        screens_html.append(html); css_sheets += sheets
        safe = html.replace("</script", "<\\/script")
        script_tags.append(f'<script type="text/html" data-key="{esc(key)}"' + (f' data-marker="{esc(marker)}"' if marker else "") + f">{safe}</script>")
    # pair web-desktop ↔ web-mobile nodes by role so redlines can say "differs from mobile"
    by_role = {}
    for nid, m in ledger["nodes"].items():
        if m.get("status") == "active":
            by_role.setdefault((m["screen"].split("/", 1)[-1], m["role"], m.get("fingerprint")), []).append(nid)
    for (_scr, _role, _fp), ids in by_role.items():
        if len(ids) == 2 and ledger["nodes"][ids[0]]["screen"] != ledger["nodes"][ids[1]]["screen"]:
            ledger["nodes"][ids[0]]["pair"], ledger["nodes"][ids[1]]["pair"] = ids[1], ids[0]
    ledger_path.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    added = sorted(set(ledger["nodes"]) - set(before))
    retired_now = sorted(i for i, m in ledger["nodes"].items() if m.get("status") == "retired" and before.get(i, {}).get("status") == "active")
    changed = sorted(i for i, m in ledger["nodes"].items() if i in before and before[i].get("fingerprint") != m.get("fingerprint") and m.get("status") == "active")

    # 3 ── applicability ───────────────────────────────────────────────────
    sections = jload(SKILL / "schema/sections.json")["sections"]
    flows_rel = (registry.get("features", {}).get(a.feature) or {}).get("flows") or dj.get("flows")
    flows = jload(root / flows_rel) if flows_rel and (root / flows_rel).exists() else None
    tokens_rows, patterns_css = consumed_tokens(root, screens_html)
    btn_rows = button_states(patterns_css, screens_html)
    imgs = sorted({m for h in screens_html for m in re.findall(r'<img[^>]*\ssrc="(?!data:)([^"]+)"', h)})
    n_data_imgs = sum(len(re.findall(r'<img[^>]*\ssrc="data:', h)) for h in screens_html)
    n_svg = sum(len(re.findall(r"<svg\b", h)) for h in screens_html)
    excl = (dj.get("sections") or {}).get("exclude", {})
    app = {}
    for sid, s in sections.items():
        why = None
        if sid in excl: ok, why = False, excl[sid]
        elif s.get("always"): ok = True
        elif sid == "prototype": ok, why = bool(flows), "no flows.json registered for this feature"
        elif sid == "button-states": ok, why = bool(btn_rows), "no button-like component appears on these screens"
        elif sid == "motion": ok, why = bool(dj.get("motion")), "no motion specified — motion is unmeasured in this system (motion-design); nothing is invented here"
        elif sid == "dotlottie": ok, why = bool(dj.get("lottie")), "no dotLottie asset — the design system ships none"
        elif sid == "gestures": ok, why = bool(dj.get("gestures")) and "web-mobile" in dj["platforms"], "no gesture specified for a touch platform in scope"
        elif sid == "assets": ok, why = bool(imgs or n_data_imgs or n_svg), "screens use no images or icons"
        elif sid == "performance": ok, why = bool(dj.get("performance")), "no performance budget declared"
        elif sid == "platform-notes": ok, why = len(dj["platforms"]) > 1, "one platform in scope"
        else: ok, why = True, None
        app[sid] = (ok, why or "")
    nums = next_display_numbers(sections, app)

    # 4 ── section bodies ──────────────────────────────────────────────────
    body = {}
    sm = dj.get("summary", {})
    prev = [c for c in dj.get("changelog", []) if int(c.get("version", 0)) < version]
    body["summary"] = (f"<p><b>Problem.</b> {esc(sm.get('problem', ''))}</p><p><b>Scope.</b> {esc(sm.get('scope', ''))}</p>"
                       f"<p><b>Platforms.</b> {esc(', '.join(dj['platforms']))} · <b>Locales.</b> {esc(', '.join(dj.get('locales', ['en'])))} · "
                       f"<b>Audience.</b> {esc(dj.get('audience', ''))}</p>" +
                       (f"<p><b>What changed since v{prev[-1]['version']}.</b> {esc(sm.get('changed', ''))}</p>" if prev else "") +
                       (f"<p><b>Sign-off.</b> {esc(', '.join((dj.get('signoff') or {}).get('who', [])))} — {esc((dj.get('signoff') or {}).get('meaning', ''))}</p>" if dj.get("signoff") else ""))
    if flows:
        pk = {}
        for sid, s in flows["screens"].items():
            key = f"{s['page']}/{s.get('platform', dj['platforms'][0])}/{s.get('state', 'default')}"
            pk[sid] = dict(s, key=key, platform=s.get("platform", dj["platforms"][0]))
        flows_out = dict(flows, screens=pk)
        body["prototype"] = ('<div id="dd-proto"><div class="dd-bar"><button class="dd-btn" id="dd-proto-back">← Back</button>'
                             '<button class="dd-btn" id="dd-proto-reset">Reset</button><button class="dd-btn" id="dd-proto-hot" aria-pressed="false">Show hotspots</button>'
                             '<select id="dd-proto-plat" aria-label="platform"' + ('' if flows.get('entries') else ' hidden') + '></select><select id="dd-proto-pick" aria-label="jump to screen"></select></div><p class="dd-hint" id="dd-proto-title"></p>'
                             '<div class="dd-frame-box" id="dd-proto-box"></div></div><p class="dd-hint">Deep link: <code>?screen=&lt;screen id&gt;</code>. '
                             'Transitions key on node ids, so a hotspot survives a re-layout.</p>')
    else:
        flows_out = None
    body["button-states"] = ("<p>Declared in <code>design-kit/patterns/patterns.css</code> for the components on these screens. "
                             "<b>Not rendered side by side</b> — forcing :hover/:focus on a static page is not automated, so this shows which states the system defines, not how they look.</p>"
                             + table(["component class", "default", "hover", "active", "focus", "disabled", "loading"], btn_rows) if btn_rows else "")
    body["state-screens"] = "<p>Every state the registry declares, plus <b>empty</b> (required whether or not anyone declared it).</p>" + state_coverage(registry, dj, collected) + md_to_html(frags["state-screens"])
    body["screens-redlines"] = screens_section({g: [(st, key, plat) for gg, _, plat, st, key, *_ in collected if gg == g] for g in dict.fromkeys(c[0] for c in collected)})
    rules = dj.get("rules", [])
    body["rules"] = (table(["id", "rule", "how it is tested"], [(esc(r.get("id", "")), esc(r["text"]), esc(r.get("test", "")) or '<span style="color:var(--bad)">⚠ no test stated</span>') for r in rules])
                     if rules else '<p class="dd-na">No behavioural rules were supplied. Add them to deliverable.json → rules (each needs a test).</p>')
    body["motion"] = table(["transition", "duration", "easing", "trigger", "reduced motion"], [(esc(m.get("name")), esc(m.get("duration")), esc(m.get("easing")), esc(m.get("trigger")), esc(m.get("reduced_motion"))) for m in dj.get("motion", [])])
    body["dotlottie"] = ""
    body["gestures"] = table(["gesture", "target node", "threshold", "below threshold", "on scroll conflict"], [(esc(g.get("name")), esc(g.get("node")), esc(g.get("threshold")), esc(g.get("below")), esc(g.get("conflict"))) for g in dj.get("gestures", [])])
    body["edge-cases"] = md_to_html(frags["edge-cases"]) + ("".join(f"<p>{esc(x)}</p>" for x in dj.get("edge_cases", [])) if dj.get("edge_cases") else "")
    body["assets"] = table(["asset", "type", "used"], [(esc(i), esc(pathlib.Path(i).suffix.lstrip(".") or "img"), "screens") for i in imgs] +
                           [("(inlined images)", "data URI", f"{n_data_imgs} instance(s)"), ("(inline SVG icons)", "svg", f"{n_svg} instance(s)")])
    body["tokens"] = ("<p>Filtered view — only tokens these screens consume, resolved from <code>design-kit/tokens/tokens.css</code>. "
                      "The full set lives there; this is not a copy of it.</p>" + table(["token", "value", "rules using it"], [(f"<code>{esc(t)}</code>", esc(v), n or "alias") for t, v, n in tokens_rows]))
    body["accessibility"] = md_to_html(frags["accessibility"]) + "<p class=\"dd-hint\">Palette-wide: several production colour pairings fail AA (<code>npm run check:a11y</code>); they are production values and are not changed here. RTL/Arabic: " + ("in scope." if "ar" in dj.get("locales", ["en"]) else "<b>out of scope</b> — Arabic is parked.") + " Focus order and screen-reader behaviour need a person.</p>"
    body["performance"] = f"<p>{esc(json.dumps(dj.get('performance')))}</p>"
    body["acceptance"] = md_to_html(frags["acceptance"]) + ("<h3>Authored criteria</h3><ul>" + "".join(f"<li>{esc(x)}</li>" for x in dj["acceptance"]) + "</ul>" if dj.get("acceptance") else "")
    unpaired = [(pid, pl, why) for pid in dj["pages"] for pl, why in (registry["pages"][pid].get("unpaired") or {}).items()]
    par = [f for f in rep["findings"] if f["check"].startswith("par.") and not f.get("waived")]
    body["platform-notes"] = ((table(["page", "platform", "declared difference"], [(esc(p), esc(pl), esc(w)) for p, pl, w in unpaired]) if unpaired else "<p>No declared differences.</p>")
                              + ("<h3>Undeclared differences (open questions)</h3>" + table(["check", "screen", "finding"], [(esc(f["check"]), esc(f["screen"]), esc(f["message"])) for f in par]) if par else ""))
    oq_authored = dj.get("open_questions", [])
    body["open-questions"] = md_to_html(frags["open-questions"]) + "<h3>Authored questions</h3>" + (
        table(["question", "who can answer", "blocked until answered"], [(esc(q.get("q")), esc(q.get("owner")) or '<span style="color:var(--bad)">⚠ no owner</span>', esc(q.get("blocks"))) for q in oq_authored]) if oq_authored else "<p>None.</p>")
    n_oq = len(oq_authored) + sum(1 for f in rep["findings"] if f.get("waived") or f["severity"] == "warning")

    # 5 ── assemble ────────────────────────────────────────────────────────
    order = sorted(sections, key=lambda s: sections[s]["order"])
    toc = "".join((f'<a href="#{s}">{nums[s]}. {esc(sections[s]["title"])}</a>' if app[s][0] else f'<a class="na" href="#{s}">— {esc(sections[s]["title"])} (n/a)</a>') for s in order)
    secs = []
    for s in order:
        ok, why = app[s]
        h = f'<h2><span class="n">{nums[s]}</span>{esc(sections[s]["title"])}</h2>' if ok else f'<h2><span class="n">—</span>{esc(sections[s]["title"])}</h2>'
        inner = body.get(s, "") if ok else f'<p class="dd-na">Not applicable — {esc(why)}.</p>'
        secs.append(f'<section class="dd-sec" id="{s}">{h}{inner}</section>')
    cl_rows = [(esc(c.get("version")), esc(c.get("date")), esc(c.get("notes"))) for c in sorted(dj.get("changelog", []), key=lambda c: -int(c.get("version", 0)))]
    diff = (f"<p>Node ids since the last build: <b>{len(added)}</b> added, <b>{len(retired_now)}</b> retired, <b>{len(changed)}</b> content-changed."
            + (f" Added: <code>{esc(', '.join(added[:15]))}</code>{' …' if len(added) > 15 else ''}" if added else "") + "</p>")
    secs.append('<section class="dd-sec" id="changelog"><h2><span class="n">◦</span>Changelog</h2>' + table(["version", "date", "notes"], cl_rows) + diff + "</section>")
    verdict = rep["verdict"]
    seen_sheets, screen_sheets = set(), ""
    for sh in css_sheets:
        if sh.exists() and sh not in seen_sheets and "/design-kit/tokens/" not in str(sh) and "/design-kit/patterns/" not in str(sh):
            seen_sheets.add(sh); screen_sheets += f'<link rel="stylesheet" href="{sh}">\n'
    flows_tag = ('<script type="application/json" id="__flows">' + json.dumps(flows_out).replace("</", "<\\/") + "</script>") if flows_out else ""
    cls = dj.get("classification", "internal")
    title = dj.get("title") or a.feature
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} — design deliverable v{version}</title>
<link rel="stylesheet" href="../../../tokens/fonts.css">
<link rel="stylesheet" href="../../../tokens/tokens.css">
<link rel="stylesheet" href="../../../patterns/patterns.css">
{screen_sheets}
</head><body>
<div class="dd-banner">{esc(cls)} — dubizzle Egypt design deliverable — do not share outside dubizzle{' — DRAFT: QA is BLOCKED' if draft else ''}</div>
<header class="dd-head"><h1>{esc(title)}</h1>
<div class="dd-meta"><span>v{version}</span><span>{esc(a.feature)}</span><span>{datetime.date.today().isoformat()}</span>
<span>QA: <span class="dd-badge {esc(verdict)}">{esc(verdict.replace('_', ' '))}</span></span><span>{n_oq} open question(s)</span></div></header>
<div class="dd-wrap"><nav class="dd-toc" aria-label="sections">{toc}<a href="#changelog">◦ Changelog</a></nav><main>{''.join(secs)}</main></div>
{''.join(script_tags)}
{flows_tag}
<script src="deliverable.js"></script>
</body></html>"""
    build = pathlib.Path(tempfile.mkdtemp(prefix="dd-build-"))
    (build / "index.html").write_text(page, encoding="utf-8")
    (build / "deliverable.js").write_text((SKILL / "assets/deliverable.js").read_text(encoding="utf-8"), encoding="utf-8")
    css_doc = (SKILL / "assets/deliverable.css").read_text(encoding="utf-8")
    # the document's own stylesheet rides in the bundle as an extra <style> appended after the shared sheets
    (build / "index.html").write_text((build / "index.html").read_text(encoding="utf-8").replace("</head>", f"<style id=\"__docstyle\">{css_doc}</style></head>"), encoding="utf-8")
    tokens_dir, patterns_dir = root / "design-kit/tokens", root / "design-kit/patterns"
    html_final = (build / "index.html").read_text(encoding="utf-8")
    html_final = html_final.replace("../../../tokens/", str(tokens_dir) + "/").replace("../../../patterns/", str(patterns_dir) + "/")
    (build / "index.html").write_text(html_final, encoding="utf-8")

    out = ddir / "dist" / f"{a.feature}-v{version}.html"
    cmd = [sys.executable, str(HERE / "bundle.py"), "--src", str(build), "--out", str(out), "--feature", a.feature, "--version", str(version),
           "--ids", str(ledger_path), "--qa-report", str(root / a.report), "--manifest", str(ddir / "dist" / "manifest.json"),
           "--locales", ",".join(dj.get("locales", ["en"])), "--classification", cls]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sys.stdout.write(r.stdout); sys.stderr.write(r.stderr)
    if r.returncode:
        sys.exit(r.returncode)
    size = out.stat().st_size / 1_048_576
    inc = [s for s in order if app[s][0]]; exc = [s for s in order if not app[s][0]]
    print(f"\n{a.feature} v{version} — {len(inc)} sections ({', '.join(inc)}); excluded: {', '.join(f'{s} ({app[s][1][:40]})' for s in exc) or 'none'}; "
          f"{n_oq} open question(s); {size:.2f} MB of 12 MB budget; QA {verdict}{' — DRAFT' if draft else ''}")


if __name__ == "__main__":
    main()
