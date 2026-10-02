#!/usr/bin/env python3
"""
Builds design-kit/deliverables/agency-portal/flows.json — every portal screen and state wired into the
clickable prototype — from the prototype definitions the repo already has (PORTAL_HOTSPOTS in
scripts/lib/prototype.mjs: which control opens which state, checked by `npm run check:prototype`)
and the links on the pages themselves. Each trigger is resolved to a stable node id in the ledger.

    python3 scripts/build-portal-flows.py [--dry-run]

Needs headless Chrome (CHROME_PATH or /opt/pw-browsers). Writes design-kit/qa/ids.json (ledger).
"""
import argparse, json, pathlib, re, subprocess, sys, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".claude/skills/design-deliverables/scripts"))
import assign_ids  # noqa: E402

TPL = ROOT / "design-kit/templates/desktop"
FLOWS = ROOT / "design-kit/deliverables/agency-portal/flows.json"
MAINS = ["dashboard", "ads", "candidates", "leads", "vip", "agents", "insights", "credit"]
KIND = {  # screen kind (flw.dismiss needs a dismiss for modal/drawer/sheet/dialog)
    "ad-overview": "drawer", "ad-info": "drawer", "ad-promo": "drawer", "ad-agent": "drawer", "agents-invite": "drawer",
    "ads-more-filters": "modal", "ads-request-brand": "modal", "ad-assign-agent": "modal", "leads-export": "modal",
    "vip-purchase": "modal", "leads-daterange": "modal", "ads-credits": "modal", "ads-actions": "modal",
    "agents-actions": "modal", "agents-sort": "modal", "ad-chats": "drawer",
}
DISMISS_LABELS = {"Cancel", "Reset", "Apply", "Date Range", "Sort by"}
TABS = {"All", "Phone", "SMS", "WhatsApp", "Chats", "Clear All Filters"}


def parent(s):
    if s in MAINS: return None
    for pre, p in (("ad-", "ads"), ("ads-", "ads"), ("agents-", "agents"), ("leads-", "leads"), ("vip-", "vip"),
                   ("candidate-", "candidates"), ("credit-", "credit")):
        if s.startswith(pre): return p
    return None


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--dry-run", action="store_true"); a = ap.parse_args()
    pages = sorted(p.stem for p in TPL.glob("portal-*.html") if not p.stem.endswith(".annot"))
    ledger = assign_ids.load_ledger(ROOT / "design-kit/qa/ids.json")
    tmp = pathlib.Path(tempfile.mkdtemp())
    for p in pages:  # annotated copies next to the originals so ../_live/assets resolves
        html = (TPL / f"{p}.html").read_text(encoding="utf-8")
        annotated, _, _ = assign_ids.assign(html, f"portal-desktop/{p}", ledger)
        (TPL / f"{p}.annot.html").write_text(annotated, encoding="utf-8")
    try:
        (tmp / "pages.json").write_text(json.dumps(pages))
        subprocess.run(["node", "-e", "import('./scripts/lib/prototype.mjs').then(m=>require('fs').writeFileSync(process.argv[1],"
                        "JSON.stringify(m.PORTAL_HOTSPOTS.map(h=>({on:h.on.source,text:h.text,band:h.band,outside:h.outside,box:h.box,go:h.go})))))",
                        str(tmp / "hotspots.json")], cwd=ROOT, check=True)
        subprocess.run(["node", "scripts/resolve-portal-triggers.mjs", str(tmp / "hotspots.json"), str(tmp / "pages.json"),
                        str(tmp / "resolved.json")], cwd=ROOT, check=True)
    finally:
        for p in pages: (TPL / f"{p}.annot.html").unlink(missing_ok=True)
    R = json.loads((tmp / "resolved.json").read_text())
    names = {p[7:]: p for p in pages}
    trans, seen, skipped = [], set(), []

    def add(frm, to, node, kind, note=None):
        if not node or to not in names or frm == to or (frm, to, node) in seen: return
        seen.add((frm, to, node)); t = {"from": frm, "to": to, "node": node, "kind": kind}
        if note: t["note"] = note
        trans.append(t)

    for p in pages:
        s = p[7:]; v = R[p]; k = KIND.get(s, "page")
        for r in v["res"]:
            to = r["go"][7:] if r["go"].startswith("portal-") else r["go"]
            if to not in names or not r.get("node"):
                if to in names: skipped.append((s, to, r["label"]))
                continue
            if k != "page" and r["label"] in TABS: continue     # tabs behind an open dialog
            if k != "page" and (r["kind"] == "outside" or r["label"] in DISMISS_LABELS or (r["kind"] == "box")) and to == (parent(s) if k != "page" else None) or \
               (k != "page" and (r["kind"] == "outside" or r["label"] in DISMISS_LABELS)):
                add(s, to, r["node"], "dismiss", "click outside" if r["kind"] == "outside" else None)
            elif k == "page" and to == parent(s):
                add(s, to, r["node"], "back", f"tab: {r['label']}" if r["label"] else None)
            else:
                add(s, to, r["node"], "forward", r["label"] and f"'{r['label']}'")
        for target, n in v["anchors"].items():                 # page links: drawer tabs, credit tabs, candidate detail
            t = target[7:]
            if k == "modal": continue                               # tabs behind an open dialog are not its controls
            if n and t in names and t not in MAINS and (t.startswith("ad-") or t.startswith("credit-") or t == "candidate-detail"):
                add(s, t, n["node"], "forward", "link")
    # the sidebar: every main screen links to every other (the portal's navigation is on all of them)
    for m in MAINS:
        for tgt in MAINS:
            n = R["portal-" + m]["anchors"].get("portal-" + tgt)
            if n and m != tgt: add(m, tgt, n["node"], "back" if tgt == "dashboard" else "forward", f"sidebar: {tgt}")
    # every state needs a way back: fall back to the sidebar item of its parent screen
    for s in names:
        if s in MAINS: continue
        has_back = any(t["from"] == s and t["kind"] in ("back", "dismiss", "close") for t in trans)
        if not has_back and parent(s):
            n = R["portal-" + s]["anchors"].get("portal-" + parent(s))
            if n: add(s, parent(s), n["node"], "back", "sidebar")
    screens = {s: {"page": names[s], "platform": "portal-desktop", "kind": KIND.get(s, "page")} for s in sorted(names)}
    flows = {"entries": {"portal-desktop": "dashboard"}, "screens": screens, "transitions": trans}
    # validate: nodes in ledger, everything reachable, every non-entry screen has a way back / dismiss
    ids = set(ledger["nodes"])
    bad = [t for t in trans if t["node"] not in ids]
    reach, todo = {"dashboard"}, ["dashboard"]
    while todo:
        c = todo.pop()
        for t in trans:
            if t["from"] == c and t["to"] not in reach: reach.add(t["to"]); todo.append(t["to"])
    noback = [s for s in names if s != "dashboard" and not any(t["from"] == s and t["kind"] in ("back", "dismiss", "close") for t in trans)]
    nodismiss = [s for s, sc in screens.items() if sc["kind"] != "page" and not any(t["from"] == s and t["kind"] in ("dismiss", "close") for t in trans)]
    print(f"{len(screens)} screens, {len(trans)} transitions | unknown nodes {len(bad)} | unreachable {sorted(set(names) - reach)} | "
          f"no way back {noback} | no dismiss {nodismiss}")
    if skipped: print("rules with no control on the page (state-dependent, e.g. 'Clear All Filters'):", len(skipped))
    if not a.dry_run:
        FLOWS.write_text(json.dumps(flows, indent=2) + "\n", encoding="utf-8")
        (ROOT / "design-kit/qa/ids.json").write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("wrote", FLOWS.relative_to(ROOT))
    return 1 if (bad or noback or nodismiss or set(names) - reach) else 0


if __name__ == "__main__":
    sys.exit(main())
