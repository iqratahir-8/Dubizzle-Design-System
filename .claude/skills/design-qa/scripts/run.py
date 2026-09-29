#!/usr/bin/env python3
"""
Design QA runner for dubizzle Egypt.

Native static checks + wrapped repo linters + render checks in headless Chrome, emitted as
report.json (schema v1) and report.html.

    python3 .claude/skills/design-qa/scripts/run.py --scope favourites
        [--platforms web-desktop,web-mobile] [--locales en] [--no-render] [--no-wrap] [--components]
        [--out design-kit/qa/report]

Exit codes: 0 pass · 1 pass with warnings · 2 blocked.
"""
import argparse, datetime, glob, html as htmllib, json, os, pathlib, re, shutil, subprocess, sys, tempfile
from common import (repo_root, load_json, load_platforms, select_pages, resolve_file, file_ok, visible_text,
                    live_regions, strip_live_regions)
from matrix import build_matrix

SKILL_VERSION = "1.0.0"
SCHEMA_VERSION = 1

# default severity per check id (authored screens). Live origin is capped at note — see cap().
SEV = {
    "cov.file": "blocker", "cov.state": "blocker", "cov.empty": "blocker", "cov.platform": "blocker",
    "cov.flag": "blocker", "cov.role": "warning", "cov.locale": "warning",
    "tok.inline": "blocker", "tok.hex": "blocker", "tok.px": "warning", "tok.resolve": "blocker",
    "tok.lint": "warning",
    "cpy.placeholder": "blocker", "cpy.voice": "warning", "cpy.verbatim": "blocker",
    "flw.node": "blocker", "flw.reach": "blocker", "flw.back": "blocker", "flw.dismiss": "blocker",
    "flw.dead": "blocker", "flw.orphan": "warning",
    "par.states": "warning", "par.copy": "warning", "par.undeclared": "warning",
    "rtl.physical": "blocker",
    "a11y.label": "blocker", "a11y.alt": "blocker", "a11y.heading": "warning", "a11y.target": "blocker",
    "brk.render": "blocker", "mot.reduced": "blocker",
    "ovf.long": "blocker", "ovf.longest_real": "blocker", "ovf.big_number": "blocker", "ovf.clipped": "blocker",
    "prv.leak": "blocker", "prv.click": "blocker",
    "cmp.parity": "blocker", "cmp.live": "blocker",
    "render.error": "warning",
}
NEVER_CAPPED = {"prv.leak", "prv.click"}
HINT = {"cov": "state-screens", "ovf": "edge-cases", "brk": "edge-cases", "a11y": "accessibility",
        "rtl": "accessibility", "mot": "accessibility"}

BANNED_VOICE = re.compile(r"\b(get started|discover|unlock|seamless(ly)?|elevate|supercharge|revolutioni[sz]e|effortless(ly)?)\b", re.I)
PLACEHOLDER = re.compile(r"lorem ipsum|\bTODO\b|\bTBC\b|\bTBD\b|\bxxx+\b|placeholder text|sample text|john doe", re.I)


class Report:
    def __init__(self, pages):
        self.pages = pages
        self.findings = []
        self.checks = {}

    def ran(self, check, cases=1):
        c = self.checks.setdefault(check, {"check": check, "status": "pass", "skipped_reason": None, "cases": 0})
        if c["status"] != "skipped":
            c["cases"] += cases

    def skip(self, check, reason):
        if check not in self.checks or self.checks[check]["status"] == "skipped":
            self.checks[check] = {"check": check, "status": "skipped", "skipped_reason": reason, "cases": 0}

    def fail(self, check, screen, message, origin="authored", severity=None, node=None, css_path=None,
             expected=None, actual=None, case=None, source="native", hint=None):
        base = severity or SEV.get(check, "warning")
        sev, capped = cap(check, base, origin)
        c = self.checks.setdefault(check, {"check": check, "status": "pass", "skipped_reason": None, "cases": 0})
        if sev != "note" or origin != "live":
            c["status"] = "fail"
        elif c["status"] == "pass":
            c["status"] = "pass"           # a live-capped note does not fail the check
        self.findings.append({
            "check": check, "severity": sev, "screen": screen, "case": case, "node": node,
            "css_path": css_path, "role": None, "message": message, "expected": expected, "actual": actual,
            "evidence": None, "waived": False, "waiver": None, "origin": origin, "capped_from": capped,
            "source": source, "section_hint": hint or HINT.get(check.split(".")[0], "open-questions"),
        })


def cap(check, sev, origin):
    """Live screens are frozen production snapshots: findings are capped at note (see severity.md)."""
    if origin != "live" or check in NEVER_CAPPED:
        return sev, None
    if check == "cov.file":
        return ("warning", sev) if sev == "blocker" else (sev, None)
    if sev != "note":
        return "note", sev
    return sev, None


# ── helpers ──────────────────────────────────────────────────────────────

def find_chrome():
    for p in [os.environ.get("CHROME_PATH")] + sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")) + [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if p and pathlib.Path(p).exists():
            return p
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        w = shutil.which(name)
        if w:
            return w
    return None


def token_names(root):
    names = set()
    for f in ("design-kit/tokens/tokens.css", "design-kit/patterns/patterns.css", "src/tokens/generated.css"):
        p = root / f
        if p.exists():
            names |= set(re.findall(r"(--[\w-]+)\s*:", p.read_text(encoding="utf-8", errors="ignore")))
    return names


def strip_css_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def strip_root_blocks(css):
    return re.sub(r":root\s*\{[^}]*\}", "", css)


def style_blocks(html):
    return "\n".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", html, flags=re.I))


def authored_slice(html):
    """A page that is a live capture plus a small authored block marks that block with
    <!--authored:start--> … <!--authored:end-->. Token and copy checks run on the block only."""
    parts = re.findall(r"<!--authored:start-->([\s\S]*?)<!--authored:end-->", html)
    return "\n".join(parts) if parts else html


def read(root, rel):
    return (root / rel).read_text(encoding="utf-8", errors="ignore")


# ── native static checks ─────────────────────────────────────────────────

def check_coverage(rep, root, pages, plats_in_scope, locales, pcfg):
    for pid, page in pages.items():
        origin = page.get("origin", "authored")
        if page.get("stale"):
            rep.fail("cov.file", pid, "registered files are not on this machine (stale registry entry, or gitignored account templates)",
                     origin=origin, severity="note")
            continue
        declared = list(page.get("states") or ["default"])
        have = [p for p in (page.get("platforms") or {}) if not plats_in_scope or p in plats_in_scope]
        for plat in have:
            screen = f"{plat}/{pid}"
            path, _ = resolve_file(root, page, plat, "default")
            rep.ran("cov.file")
            if not path or not file_ok(root, path):
                rep.fail("cov.file", screen, f"default screen file missing: {path}", origin=origin)
            states = declared + (["empty"] if "empty" not in declared and not page.get("no_list") else [])
            for st in states:
                if st == "default":
                    continue
                chk = "cov.empty" if st == "empty" else "cov.state"
                f, marker = resolve_file(root, page, plat, st)
                rep.ran(chk)
                if not f:
                    why = ("required whether or not it was declared — the empty list is the state PRDs never mention"
                           if st == "empty" and st not in declared else "declared in the registry but not rendered")
                    rep.fail(chk, screen, f"no '{st}' state: {why}", origin=origin, case=f"{pid}/{plat}/{st}")
                elif not file_ok(root, f, marker):
                    rep.fail(chk, screen, f"'{st}' state points at {f}{'#' + marker if marker else ''} which does not exist"
                             + (f" (no [data-state=\"{marker}\"] in the file)" if marker else ""), origin=origin)
            for fl in page.get("flags") or []:
                rep.ran("cov.flag")
                f, marker = resolve_file(root, page, plat, "flag-off")
                if not f or not file_ok(root, f, marker):
                    rep.fail("cov.flag", screen, f"flag '{fl}' gates this surface but its off-state is not rendered", origin=origin)
            for r in page.get("role_differs") or []:
                rep.ran("cov.role")
        for plat in ("web-desktop", "web-mobile"):
            if len(page.get("platforms") or {}) and plat not in page["platforms"] and (not plats_in_scope or plat in plats_in_scope):
                if plat in (page.get("unpaired") or {}):
                    continue
                if "portal-desktop" in page["platforms"]:
                    continue
                rep.ran("par.undeclared")
                rep.fail("par.undeclared", f"{plat}/{pid}", f"exists on {', '.join(page['platforms'])} but not {plat}, and there is no 'unpaired' entry saying why",
                         origin=origin)
        for loc in locales:
            if loc == "en":
                continue
            for plat in have:
                rep.ran("cov.locale")
                if not ((page.get("locale_files") or {}).get(loc) or {}).get(plat) and loc not in (page.get("deferred_locales") or []):
                    rep.fail("cov.locale", f"{plat}/{pid}", f"locale '{loc}' is in scope but has no screen and no deferral", origin=origin)


def authored_files(root, pages, plats_in_scope):
    """(screen, plat, rel path, origin) for every distinct default+state file of authored pages."""
    seen, out = set(), []
    for pid, page in pages.items():
        if page.get("origin") != "authored" or page.get("stale"):
            continue
        for plat, path in (page.get("platforms") or {}).items():
            if plats_in_scope and plat not in plats_in_scope:
                continue
            files = [path] + [v.partition("#")[0] for st in (page.get("state_files") or {}).values()
                              for p, v in st.items() if p == plat]
            for f in files:
                if f and (root / f).exists() and (f, plat) not in seen:
                    seen.add((f, plat)); out.append((f"{plat}/{pid}", plat, f))
    return out


def check_tokens_and_copy(rep, root, files, tokens):
    canon = set()
    copy_md = root / "design-kit/qa/product/copy.md"
    canon_map = {}
    if copy_md.exists():
        for line in copy_md.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\s*[-*]\s+(?:`|\")?(.+?)(?:`|\")?\s*$", line)
            if m and not line.strip().startswith("- _"):
                s = m.group(1).strip()
                if 1 < len(s) < 80:
                    canon_map[re.sub(r"[^a-z0-9]", "", s.lower())] = s
    else:
        rep.skip("cpy.verbatim", "design-kit/qa/product/copy.md not found")
    if copy_md.exists() and not canon_map:
        rep.skip("cpy.verbatim", "design-kit/qa/product/copy.md lists no canonical strings yet")
    for screen, plat, f in files:
        html = authored_slice(read(root, f))
        # tok.inline — style="" allowed only when it just sets custom properties
        rep.ran("tok.inline")
        for m in re.finditer(r'\sstyle="([^"]*)"', html):
            decls = [d.strip() for d in m.group(1).split(";") if d.strip()]
            bad = [d for d in decls if not d.startswith("--")]
            if bad:
                rep.fail("tok.inline", screen, f'inline style="{m.group(1)[:60]}" — appearance must come from the token sheet',
                         css_path=None, actual=m.group(1)[:80], expected="class from patterns.css / token var()")
                break
        css = strip_root_blocks(strip_css_comments(style_blocks(html)))
        for attr in re.findall(r'\sstyle="([^"]*)"', html):
            css += "\n" + attr
        rep.ran("tok.hex")
        hexes = sorted(set(re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)", css)))
        if hexes:
            rep.fail("tok.hex", screen, f"{len(hexes)} colour literal(s) outside the token sheet: {', '.join(hexes[:5])}",
                     actual=", ".join(hexes[:8]), expected="var(--…)")
        rep.ran("tok.px")
        no_media = "\n".join(l for l in css.splitlines() if "@media" not in l)
        pxs = sorted(set(m for m in re.findall(r"(?<![\w.-])(\d+(?:\.\d+)?px)", no_media) if m not in ("0px", "1px")))
        if pxs:
            rep.fail("tok.px", screen, f"{len(pxs)} px literal(s) in declarations: {', '.join(pxs[:6])}", actual=", ".join(pxs[:10]),
                     expected="spacing/size token")
        rep.ran("tok.resolve")
        used = set(re.findall(r"var\(\s*(--[\w-]+)", css + html))
        local = set(re.findall(r"(--[\w-]+)\s*:", html))
        missing = sorted(u for u in used if u not in tokens and u not in local)
        if missing:
            rep.fail("tok.resolve", screen, f"{len(missing)} var() reference(s) resolve to nothing: {', '.join(missing[:6])}",
                     actual=", ".join(missing[:10]))
        texts = visible_text(strip_live_regions(html))
        rep.ran("cpy.placeholder"); rep.ran("cpy.voice")
        for t in texts:
            if PLACEHOLDER.search(t):
                rep.fail("cpy.placeholder", screen, f"placeholder text in a visible string: “{t[:70]}”", actual=t[:70]); break
        for t in texts:
            m = BANNED_VOICE.search(t)
            if m:
                rep.fail("cpy.voice", screen, f"“{m.group(0)}” is not dubizzle voice (imperative, second person; RULES.md): “{t[:70]}”", actual=t[:70]); break
        if canon_map:
            rep.ran("cpy.verbatim")
            for t in texts:
                k = re.sub(r"[^a-z0-9]", "", t.lower())
                if k in canon_map and canon_map[k] != t:
                    rep.fail("cpy.verbatim", screen, f"“{t}” should read “{canon_map[k]}” exactly (product/copy.md)",
                             expected=canon_map[k], actual=t)


def check_flows(rep, root, registry, pages):
    ledger = load_json(root / "design-kit/qa/ids.json", {}) or {}
    ids = set((ledger.get("nodes") or {}).keys())
    feats = {p.get("feature") for p in pages.values() if p.get("feature")}
    any_flow = False
    for feat in sorted(feats):
        fp = ((registry.get("features") or {}).get(feat) or {}).get("flows")
        if not fp or not (root / fp).exists():
            continue
        any_flow = True
        flow = json.loads((root / fp).read_text(encoding="utf-8"))
        screens = flow.get("screens", {})
        entries = list((flow.get("entries") or {}).values()) or [flow.get("entry")]
        trans = flow.get("transitions", [])
        for c in ("flw.dead", "flw.node", "flw.reach", "flw.back", "flw.dismiss", "flw.orphan"):
            rep.ran(c)
        for t in trans:
            for end in ("from", "to"):
                if t[end] not in screens:
                    rep.fail("flw.dead", feat, f"transition {t['from']} → {t['to']} names a screen that does not exist ('{t[end]}')")
            if t.get("node") and ids and t["node"] not in ids:
                rep.fail("flw.node", feat, f"transition {t['from']} → {t['to']} names node {t['node']} which is not in the ledger",
                         node=t["node"])
        bad_entry = [e for e in entries if e not in screens]
        for e in bad_entry:
            rep.fail("flw.reach", feat, f"entry screen '{e}' does not exist")
        entries = [e for e in entries if e in screens]
        adj = {}
        for t in trans:
            adj.setdefault(t["from"], set()).add(t["to"])
        seen, stack = set(entries), list(entries)
        while stack:
            for n in adj.get(stack.pop(), ()):
                if n not in seen and n in screens:
                    seen.add(n); stack.append(n)
        for s_ in screens:
            if s_ not in seen:
                rep.fail("flw.reach", feat, f"screen '{s_}' is not reachable from any entry ({', '.join(entries)})")
            if s_ not in entries:
                back = [t for t in trans if t["from"] == s_ and t.get("kind") in ("back", "dismiss", "close")]
                if not back:
                    rep.fail("flw.back", feat, f"screen '{s_}' has no route back")
                if screens[s_].get("kind") in ("modal", "drawer", "sheet", "dialog") and not [t for t in back if t.get("kind") in ("dismiss", "close")]:
                    rep.fail("flw.dismiss", feat, f"{screens[s_]['kind']} '{s_}' has no dismiss control")
        for pid, p in pages.items():
            if p.get("feature") == feat and pid not in {v.get("page", k) for k, v in screens.items()} and p.get("kind") != "overlay":
                rep.fail("flw.orphan", pid, f"page '{pid}' is in feature '{feat}' but no flow references it")
    if not any_flow:
        for c in ("flw.dead", "flw.reach", "flw.back", "flw.dismiss"):
            rep.skip(c, "no flows.json registered for the pages in scope (registry.features[*].flows)")


def check_parity(rep, root, pages, plats_in_scope):
    for pid, page in pages.items():
        plats = [p for p in (page.get("platforms") or {}) if p in ("web-desktop", "web-mobile")]
        if page.get("origin") != "authored" or len(plats) < 2 or page.get("stale") or page.get("live_except_authored"):
            continue
        rep.ran("par.states"); rep.ran("par.copy")
        sets = {}
        for pl in plats:
            sts = {"default"} | {s for s, m in (page.get("state_files") or {}).items() if pl in m}
            sets[pl] = sts
        if sets[plats[0]] != sets[plats[1]]:
            rep.fail("par.states", pid, f"{plats[0]} has states {sorted(sets[plats[0]])}, {plats[1]} has {sorted(sets[plats[1]])}")
        texts = {pl: {re.sub(r"\s+", " ", t.lower()) for t in visible_text(strip_live_regions(read(root, page['platforms'][pl]))) if 2 < len(t) < 60}
                 for pl in plats if (root / page["platforms"][pl]).exists()}
        if len(texts) == 2:
            a, b = texts[plats[0]], texts[plats[1]]
            j = len(a & b) / max(1, len(a | b))
            if j < 0.6:
                only = sorted((a ^ b))[:5]
                rep.fail("par.copy", pid, f"desktop and mobile share only {round(j*100)}% of their strings (e.g. {', '.join(repr(x) for x in only)}); "
                         "declare the difference or align it", expected=">=60%", actual=f"{round(j*100)}%")


# ── wrapped repo checkers ────────────────────────────────────────────────

def run_cmd(cmd, root, env_extra=None, timeout=300):
    env = dict(os.environ)
    env.update(env_extra or {})
    try:
        p = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=timeout, env=env)
        return p.returncode, (p.stdout or "") + (p.stderr or "")
    except subprocess.TimeoutExpired:
        return 124, "timed out"
    except FileNotFoundError as e:
        return 127, str(e)


def wrap_design(rep, root, files_by_screen, have_node):
    if not files_by_screen:
        rep.skip("tok.lint", "no authored screens in scope"); return
    if not have_node:
        rep.skip("tok.lint", "node_modules missing — run npm install"); return
    paths = [f for _, f in files_by_screen]
    code, out = run_cmd(["node", "scripts/check-design.mjs"] + paths, root)
    rep.ran("tok.lint", len(paths))
    cur = None
    by_path = {f: s for s, f in files_by_screen}
    for line in out.splitlines():
        m = re.match(r"^(?:\.\./)*(.+\.(?:html|css))\s*$", line)
        if m:
            cur = next((s for f, s in by_path.items() if f.endswith(m.group(1).lstrip("./")) or m.group(1).endswith(f)), m.group(1))
            continue
        m = re.match(r"^\s+(error|warn)\s+(\d+)\s+(.*)$", line)
        if m and cur:
            lvl, _, msg = m.groups()
            chk = "rtl.physical" if "RTL" in msg else "cpy.voice" if "generic copy" in msg else "tok.lint"
            if chk == "rtl.physical":
                rep.fail(chk, cur, msg, severity="note", source="npm:check:design", hint="accessibility")
            else:
                rep.fail(chk, cur, msg, severity="blocker" if lvl == "error" else "warning", source="npm:check:design")
    if code not in (0,) and not any(f["source"] == "npm:check:design" for f in rep.findings):
        rep.fail("tok.lint", "all", f"check:design exited {code}: {out.strip().splitlines()[-1][:120] if out.strip() else ''}",
                 source="npm:check:design")


def wrap_a11y(rep, root, pages, plats_in_scope, chrome, have_node):
    if not have_node or not chrome:
        rep.skip("a11y.alt", "needs node_modules and Chrome"); rep.skip("a11y.label", "needs node_modules and Chrome")
        rep.skip("a11y.heading", "needs node_modules and Chrome"); return
    by_dir = {}
    for pid, page in pages.items():
        if page.get("stale"):
            continue
        for plat, path in (page.get("platforms") or {}).items():
            if plats_in_scope and plat not in plats_in_scope:
                continue
            if (root / path).exists():
                by_dir.setdefault(str(pathlib.Path(path).parent), {})[pathlib.Path(path).name] = (f"{plat}/{pid}", "live" if page.get("live_except_authored") else page.get("origin", "authored"), path)
    for d, files in by_dir.items():
        paths = [v[2] for v in files.values()]
        for i in range(0, len(paths), 40):
            chunk = paths[i:i + 40]
            code, out = run_cmd(["node", "scripts/check-a11y.mjs"] + chunk, root, {"CHROME_PATH": chrome}, timeout=600)
            for c in ("a11y.alt", "a11y.label", "a11y.heading"):
                rep.ran(c, len(chunk))
            for line in out.splitlines():
                m = re.match(r"^\s+!\s+(\S+\.html)\s+(.*)$", line)
                if not m or m.group(1) not in files:
                    continue
                screen, origin, _ = files[m.group(1)]
                for part in [p.strip() for p in m.group(2).split("·")]:
                    if "without alt" in part:
                        rep.fail("a11y.alt", screen, part, origin=origin, source="npm:check:a11y")
                    elif "no accessible name" in part:
                        rep.fail("a11y.label", screen, part, origin=origin, source="npm:check:a11y")
                    elif part.startswith("headings"):
                        rep.fail("a11y.heading", screen, part, origin=origin, source="npm:check:a11y")
            if code not in (0, 1) and "issue group" not in out and "pairings" not in out:
                rep.fail("a11y.label", d, f"check:a11y exited {code}: {out.strip().splitlines()[-1][:120] if out.strip() else ''}",
                         origin="authored", source="npm:check:a11y", severity="warning")
    rep.fail_palette = True


def wrap_simple(rep, root, check, cmd, reason_skip, chrome=None, have_node=True, need_chrome=False, cases=1):
    if not have_node:
        rep.skip(check, "node_modules missing — run npm install"); return
    if need_chrome and not chrome:
        rep.skip(check, reason_skip or "needs Chrome"); return
    code, out = run_cmd(cmd, root, {"CHROME_PATH": chrome or ""}, timeout=600)
    rep.ran(check, cases)
    if code != 0:
        tail = " | ".join(l.strip() for l in out.strip().splitlines()[-4:])[:240]
        rep.fail(check, "repo", f"{' '.join(cmd[1:3])} exited {code}: {tail}", origin="authored", source="npm:" + pathlib.Path(cmd[1]).stem)


# ── render pass ──────────────────────────────────────────────────────────

def render_pass(rep, root, registry, matrix, pages, pcfg, chrome, out_dir):
    if not chrome:
        return False
    fx = load_json(root / "design-kit/content/fixtures.json", {}) or {}
    lst = fx.get("listings") or {}
    groups = lst.values() if isinstance(lst, dict) else [lst]
    titles = [l.get("title", "") for g in groups for l in (g if isinstance(g, list) else []) if isinstance(l, dict)]
    longest = max(titles, key=len) if titles else ""
    jobs, seen = [], set()
    for c in matrix["cases"]:
        if not c["file"] or c["class"] == "sampled" and c["role"] != "default":
            continue
        page = pages[c["page"]]
        f, marker = resolve_file(root, page, c["platform"], c["state"])
        if not f or not file_ok(root, f, marker) or c["locale"] != matrix["scope"]["locales"][0]:
            continue
        key = (f, marker, c["width"])
        if key in seen:
            continue
        seen.add(key)
        authored = page.get("origin") == "authored"
        checks = ["brk", "a11y.target"]
        if c["class"] == "required" and c["width"] == pcfg["platforms"][c["platform"]]["default_width"]:
            checks += ["mot"] + (["ovf"] if authored else [])
        jobs.append({"id": c["id"], "screen": c["screen"], "platform": c["platform"], "file": str(root / f), "width": c["width"],
                     "marker": marker, "origin": page.get("origin", "authored"), "liveAll": bool(page.get("live_except_authored")), "checks": checks})
    if not jobs:
        return True
    cfg = {"chrome": chrome, "longest": longest, "liveRegions": live_regions(registry),
           "targetMin": {k: v.get("hit_target_min", 24) for k, v in pcfg["platforms"].items()},
           "targetAim": {k: v.get("hit_target_aim", v.get("hit_target_min", 24)) for k, v in pcfg["platforms"].items()},
           "jobs": jobs}
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="qa-render-"))
    (tmp / "jobs.json").write_text(json.dumps(cfg)); outp = tmp / "out.json"
    code, out = run_cmd(["node", str(pathlib.Path(__file__).parent / "render_checks.mjs"), str(tmp / "jobs.json"), str(outp)], root, timeout=1800)
    if code != 0 or not outp.exists():
        rep.skip("brk.render", f"render pass failed: {out.strip()[-160:]}")
        return False
    res = json.loads(outp.read_text())
    for chk, n in res["ran"].items():
        rep.ran(chk, n)
    for f in res["findings"]:
        chk = f.pop("check"); sev = f.pop("severity", None)
        rep.fail(chk, f.pop("screen"), f.pop("message"), origin=("live" if f.get("live_region") else f.pop("origin", "authored")), severity=sev,
                 node=f.get("node"), css_path=f.get("css_path"), expected=f.get("expected"), actual=f.get("actual"),
                 case=f.get("case"))
    if not any(j["origin"] == "authored" for j in jobs):
        rep.skip("ovf.long", "no authored screens in scope — content extremes are not injected into frozen captures")
    return True


# ── waivers, verdict, output ─────────────────────────────────────────────

def apply_waivers(rep, root):
    wp = root / "design-kit/qa/waivers.json"
    data = load_json(wp, {"waivers": []}) or {"waivers": []}
    today = datetime.date.today().isoformat()
    notes = []
    for w in data.get("waivers", []):
        if not (w.get("node") or w.get("css_path")):
            notes.append(f"ignored waiver for {w.get('check')} on {w.get('screen')}: needs node or css_path (no blanket waivers)"); continue
        for f in rep.findings:
            if f["severity"] != "blocker" or f["check"] != w.get("check") or f["screen"] != w.get("screen"):
                continue
            if (w.get("node") and f["node"] == w["node"]) or (w.get("css_path") and f["css_path"] == w["css_path"]):
                if w.get("expires_on", "9999") < today:
                    notes.append(f"waiver for {w['check']} on {w['screen']} expired {w['expires_on']} — finding is a blocker again")
                else:
                    f["waived"] = True
                    f["waiver"] = {k: w.get(k) for k in ("reason", "granted_by", "granted_on", "expires_on")}
    return notes


def verdict_of(rep, render_ok, render_needed):
    open_b = [f for f in rep.findings if f["severity"] == "blocker" and not f["waived"]]
    warn = [f for f in rep.findings if f["severity"] == "warning" or (f["severity"] == "blocker" and f["waived"])]
    if open_b or (render_needed and not render_ok):
        return "blocked"
    skipped_in_scope = [c for c in rep.checks.values() if c["status"] == "skipped" and c["check"].split(".")[0] in ("brk", "a11y", "mot")]
    if warn or skipped_in_scope:
        return "pass_with_warnings"
    return "pass"


def write_html(path, report):
    def esc(s): return htmllib.escape(str(s if s is not None else ""))
    rows = "".join(
        f"<tr class='{esc(f['severity'])}{' waived' if f['waived'] else ''}'><td>{esc(f['severity'])}{' (waived)' if f['waived'] else ''}"
        f"{' ← ' + esc(f['capped_from']) if f.get('capped_from') else ''}</td><td>{esc(f['check'])}</td><td>{esc(f['screen'])}</td>"
        f"<td>{esc(f['node'] or f['css_path'] or '—')}</td><td>{esc(f['message'])}</td></tr>" for f in report["findings"])
    chk = "".join(f"<tr><td>{esc(c['check'])}</td><td>{esc(c['status'])}</td><td>{c.get('cases', 0)}</td><td>{esc(c.get('skipped_reason') or '')}</td></tr>"
                  for c in report["checks_run"])
    c = report["counts"]
    path.write_text(f"""<!doctype html><meta charset=utf-8><title>Design QA report</title>
<style>body{{font:14px/1.5 system-ui;margin:24px;color:#222}}table{{border-collapse:collapse;width:100%;margin:12px 0 28px}}
td,th{{border-bottom:1px solid #e6e6e6;padding:6px 8px;text-align:start;vertical-align:top}}th{{background:#f5f5f5}}
.blocker td:first-child{{color:#c00;font-weight:600}}.warning td:first-child{{color:#a60}}.note td:first-child{{color:#666}}
.waived{{opacity:.6}}.v{{font-size:20px;font-weight:700}}.v.blocked{{color:#c00}}.v.pass{{color:#080}}.v.pass_with_warnings{{color:#a60}}</style>
<h1>Design QA — {esc(', '.join(report['scope']['pages'][:6]))}{' …' if len(report['scope']['pages']) > 6 else ''}</h1>
<p class="v {esc(report['verdict'])}">{esc(report['verdict'].replace('_', ' ').upper())}</p>
<p>{c['blocker']} blocker · {c['warning']} warning · {c['note']} note · {c.get('waived', 0)} waived · {c.get('skipped_checks', 0)} check(s) skipped
 — generated {esc(report['generated_at'])} — skill v{esc(report['qa_skill_version'])}, schema v{report['schema_version']}</p>
<p>locales: {esc(', '.join(report['scope']['locales']))} · platforms: {esc(', '.join(report['scope']['platforms']))} ·
render available: {esc(report['render_available'])} · ids available: {esc(report['ids_available'])}</p>
<h2>Findings</h2><table><tr><th>severity</th><th>check</th><th>screen</th><th>node / path</th><th>finding</th></tr>{rows or '<tr><td colspan=5>none</td></tr>'}</table>
<h2>Checks run</h2><table><tr><th>check</th><th>status</th><th>cases</th><th>note</th></tr>{chk}</table>""", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", default="all")
    ap.add_argument("--platforms", default="")
    ap.add_argument("--locales", default="en")
    ap.add_argument("--no-render", action="store_true")
    ap.add_argument("--no-wrap", action="store_true")
    ap.add_argument("--components", action="store_true", help="also run check:parity and check:live (need servers / captures)")
    ap.add_argument("--out", default="design-kit/qa/report")
    ap.add_argument("--registry", default="design-kit/qa/registry.json", help="registry to test (used for fixtures)")
    a = ap.parse_args()

    root = repo_root()
    registry = load_json(root / a.registry)
    if not registry:
        sys.exit("design-kit/qa/registry.json is missing — run build_registry.py first")
    pcfg = load_platforms(root)
    plats = [p for p in a.platforms.split(",") if p] or None
    locales = a.locales.split(",")
    pages = select_pages(registry, a.scope)
    if not pages and a.scope not in ("components",):
        sys.exit(f"nothing in the registry matches scope '{a.scope}'")
    matrix = build_matrix(root, registry, pcfg, a.scope, plats, locales)
    rep = Report(pages)
    tokens = token_names(root)
    chrome = find_chrome()
    have_node = (root / "node_modules").is_dir() and bool(shutil.which("node"))

    check_coverage(rep, root, pages, plats, locales, pcfg)
    files = authored_files(root, pages, plats)
    check_tokens_and_copy(rep, root, files, tokens)
    check_flows(rep, root, registry, pages)
    check_parity(rep, root, pages, plats)

    if not a.no_wrap:
        derived = {f for pg in pages.values() if pg.get("live_except_authored") for f in (pg.get("platforms") or {}).values()}
        wrap_design(rep, root, [(s, f) for s, _, f in files if f not in derived], have_node)
        wrap_a11y(rep, root, pages, plats, chrome, have_node)
        if "ar" in locales:
            wrap_simple(rep, root, "rtl.physical", ["node", "scripts/check-rtl.mjs"], None, have_node=have_node)
        else:
            rep.skip("rtl.physical", "Arabic is parked — 'ar' not in scope (pass --locales en,ar to enable)")
        if any(p.get("vertical") == "portal" for p in pages.values()):
            wrap_simple(rep, root, "prv.leak", ["node", "scripts/check-prototype.mjs"], "needs Chrome", chrome, have_node, need_chrome=True)
        else:
            rep.skip("prv.leak", "no portal pages in scope")
        if a.components or a.scope == "components":
            wrap_simple(rep, root, "cmp.parity", ["node", "scripts/check-parity.mjs"], "needs Storybook :6006 and kit :4321 running", have_node=have_node)
            wrap_simple(rep, root, "cmp.live", ["node", "scripts/check-live.mjs"], "needs Chrome and design-kit/reference/live", chrome, have_node, need_chrome=True)
        else:
            rep.skip("cmp.parity", "component-level; pass --components (needs Storybook and kit servers)")
            rep.skip("cmp.live", "component-level; pass --components (needs design-kit/reference/live)")
    else:
        rep.skip("tok.lint", "--no-wrap"); rep.skip("a11y.alt", "--no-wrap")

    render_needed = not a.no_render
    render_ok = False
    if a.no_render:
        for c in ("brk.render", "a11y.target", "mot.reduced", "ovf.long", "ovf.longest_real", "ovf.big_number"):
            rep.skip(c, "--no-render")
    elif not chrome:
        for c in ("brk.render", "a11y.target", "mot.reduced", "ovf.long"):
            rep.skip(c, "no headless Chrome found (set CHROME_PATH)")
    else:
        render_ok = render_pass(rep, root, registry, matrix, pages, pcfg, chrome, root / a.out)
    for c in ("mot.budget", "ovf.empty_string", "ovf.zero", "ovf.negative", "ovf.no_image", "ovf.null_date", "ovf.arabic", "flw.dismiss"):
        pass

    notes = apply_waivers(rep, root)
    for n in notes:
        rep.findings.append({"check": "waiver.invalid", "severity": "warning", "screen": "waivers", "case": None, "node": None,
                             "css_path": None, "role": None, "message": n, "expected": None, "actual": None, "evidence": None,
                             "waived": False, "waiver": None, "origin": "authored", "capped_from": None, "source": "native",
                             "section_hint": "open-questions"})
    seen_f, uniq = set(), []
    for f in rep.findings:
        k = (f["check"], f["screen"], f["node"], f["css_path"], f["message"])
        if k not in seen_f:
            seen_f.add(k); uniq.append(f)
    rep.findings = uniq
    rep.findings.sort(key=lambda f: ({"blocker": 0, "warning": 1, "note": 2}[f["severity"]], f["check"], f["screen"]))

    counts = {"blocker": 0, "warning": 0, "note": 0, "waived": 0}
    for f in rep.findings:
        if f["waived"]:
            counts["waived"] += 1
        counts[f["severity"]] += 0 if f["waived"] else 1
    counts["skipped_checks"] = sum(1 for c in rep.checks.values() if c["status"] == "skipped")
    ids_avail = any('data-node-id' in read(root, f) for _, _, f in files) if files else False

    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "qa_skill_version": SKILL_VERSION,
        "ids_available": ids_avail,
        "render_available": bool(render_ok),
        "scope": {"feature": a.scope, "pages": list(pages), "platforms": matrix["scope"]["platforms"], "locales": locales,
                  "origins": sorted({p.get("origin", "authored") for p in pages.values()}),
                  "breakpoints": sorted({w for p in pcfg["platforms"].values() for w in p.get("breakpoints", [])})},
        "matrix": {"counts": matrix["counts"], "cases_run": len([c for c in matrix["cases"] if c["file"]]),
                   "cases_skipped": len([c for c in matrix["cases"] if not c["file"]])},
        "verdict": verdict_of(rep, render_ok, render_needed),
        "counts": counts,
        "findings": rep.findings,
        "checks_run": sorted(rep.checks.values(), key=lambda c: c["check"]),
    }
    out = root / a.out; out.mkdir(parents=True, exist_ok=True)
    (out / "matrix.json").write_text(json.dumps(matrix, indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    write_html(out / "report.html", report)

    v = report["verdict"].replace("_", " ").upper()
    print(f"{v} — {counts['blocker']} blocker, {counts['warning']} warning, {counts['note']} note, "
          f"{counts['waived']} waived, {counts['skipped_checks']} skipped  [{a.scope}: {len(pages)} page(s), "
          f"{matrix['counts']['required']} required cases]")
    for f in [f for f in rep.findings if f["severity"] in ("blocker", "warning") and not f["waived"]][:3]:
        print(f"  {f['severity']:8} {f['check']:16} {f['screen']:28} {f['message'][:90]}")
    try:
        shown = (out / "report.json").relative_to(root)
    except ValueError:
        shown = out / "report.json"
    print(f"wrote {shown} and report.html")
    sys.exit({"pass": 0, "pass_with_warnings": 1, "blocked": 2}[report["verdict"]])


if __name__ == "__main__":
    main()
