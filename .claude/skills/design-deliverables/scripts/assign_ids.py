#!/usr/bin/env python3
"""
Assign stable numeric node ids to a screen, Figma-style: {screen}:{node}.

Ids are assigned ONCE and stored in the ledger (design-kit/qa/ids.json). On regeneration nodes are
matched to existing ids by role + path + fingerprint, so inserting a row does not renumber
everything below it. See references/ids.md for why that matters.

    python3 assign_ids.py --screen design-kit/templates/desktop/favourites.html \
        --name web-desktop/favourites [--screen-number 7] [--write] [--annotate out.html]

Without --write nothing is changed. Never edits the source screen: --annotate writes a copy with
data-node-id attributes (the deliverable builder does this in memory).

Importable: assign(html, screen_name, ledger, screen_number=None, components=()) ->
    (annotated_html, results, retired)
"""
import argparse, datetime, json, pathlib, re, sys
from html.parser import HTMLParser

LEDGER_VERSION = 1
INTERACTIVE = {"button", "a", "input", "select", "textarea", "label", "summary"}
NEVER = {"html", "head", "body", "script", "style", "meta", "link", "title", "defs", "symbol",
         "template", "noscript", "br", "hr", "option", "source", "path", "use", "g", "circle", "rect",
         "line", "polyline", "polygon", "ellipse", "clippath", "mask", "lineargradient", "stop"}
WRAPPER = re.compile(r"(^|[-_])(spacer|wrapper|container|inner|row|col|grid|stack|flex|layout)($|[-_])")
TEXT_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "td", "th", "li", "dt", "dd", "small", "strong", "em"}


class NodeWalker(HTMLParser):
    def __init__(self, components=()):
        super().__init__(convert_charrefs=True)
        self.components = set(components)
        self.stack = []          # (segment, node-or-None, tag)
        self.nodes = []
        self.counter = {}
        self.svg_depth = 0
        self.void = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def _path(self):
        return " > ".join(s for s, _, _ in self.stack)

    def _role(self, tag, a):
        cls = (a.get("class") or "").split()
        if a.get("data-role") or a.get("data-component"):
            return a.get("data-role") or a.get("data-component")
        for c in cls:
            if ("-" in c or "_" in c) and not c.startswith(("is-", "has-", "i-")):
                return c
        return cls[0] if cls else tag

    def _component(self, role):
        block = role.split("__")[0].split("--")[0]
        pascal = "".join(w[:1].upper() + w[1:] for w in re.split(r"[-_]", block) if w)
        return pascal if pascal in self.components else None

    def _include(self, tag, a, in_svg):
        if in_svg:
            return False
        if tag in NEVER:
            return False
        if tag in INTERACTIVE or tag in ("svg", "img"):
            return True
        if a.get("data-state") or a.get("data-role") or a.get("data-component") or a.get("data-ugc"):
            return True
        cls = (a.get("class") or "")
        if tag in ("div", "section", "ul", "ol", "nav", "main", "header", "footer", "aside") and \
                (not cls or all(WRAPPER.search(c) for c in cls.split())):
            return False
        if tag in TEXT_TAGS or tag in ("article", "figure", "nav", "header", "footer", "section", "main", "aside", "ul", "ol"):
            return True
        return bool(cls)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        in_svg = self.svg_depth > 0
        role = self._role(tag, a)
        node = None
        seg = tag
        if tag not in NEVER or tag in ("br", "hr"):
            key = f"{self._path()}|{role}"
            self.counter[key] = self.counter.get(key, 0) + 1
            n = self.counter[key]
            seg = f"{role}[{n}]" if n > 1 else role
        if self._include(tag, a, in_svg):
            line, col = self.getpos()
            node = {
                "kind": self._kind(tag), "role": role, "component": self._component(role),
                "path": (self._path() + " > " + seg).strip(" >"), "tag": tag,
                "classes": a.get("class", ""), "text": "", "had_id": "data-node-id" in a,
                "pos": (line, col, self.get_starttag_text()),
            }
            self.nodes.append(node)
        if tag == "svg":
            self.svg_depth += 1
        if tag not in self.void:
            self.stack.append((seg, node, tag))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.void and self.stack and self.stack[-1][2] == tag:
            self.stack.pop()
            if tag == "svg":
                self.svg_depth -= 1

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][2] == tag:
                del self.stack[i:]
                break
        if tag == "svg" and self.svg_depth:
            self.svg_depth -= 1

    def handle_data(self, data):
        t = data.strip()
        if not t or self.svg_depth:
            return
        for _, node, _ in reversed(self.stack):
            if node is not None:
                node["text"] = (node["text"] + " " + t).strip()[:80]
                break

    @staticmethod
    def _kind(tag):
        if tag in INTERACTIVE:
            return "control"
        if tag == "svg":
            return "icon"
        if tag == "img":
            return "image"
        if tag in TEXT_TAGS:
            return "text"
        return "component"


def fingerprint(n):
    return f"text:{n['text'][:40]}|kind:{n['kind']}|cls:{' '.join(sorted(n['classes'].split()))[:60]}"


def load_ledger(p):
    p = pathlib.Path(p)
    if p.exists():
        d = json.loads(p.read_text(encoding="utf-8"))
        d.setdefault("screens", {}); d.setdefault("nodes", {}); d.setdefault("next_node", {}); d.setdefault("retired", [])
        return d
    return {"ledger_version": LEDGER_VERSION, "screens": {}, "nodes": {}, "next_node": {}, "retired": []}


def match(existing, node, screen_name, used):
    fp = fingerprint(node)
    cands = {i: m for i, m in existing.items() if m.get("screen") == screen_name and m.get("status") == "active" and i not in used}
    for i, m in cands.items():                                   # 1 role + path
        if m["role"] == node["role"] and m["path"] == node["path"] and m.get("fingerprint") == fp:
            return i, "exact"
    for i, m in cands.items():                                   # 2 role + fingerprint, path moved
        if m["role"] == node["role"] and m.get("fingerprint") == fp:
            return i, "moved"
    for i, m in cands.items():                                   # 3 role + path, content changed
        if m["role"] == node["role"] and m["path"] == node["path"]:
            return i, "content-changed"
    same = [i for i, m in cands.items() if m["role"] == node["role"]]
    if len(same) == 1:                                           # 4 unique role
        return same[0], "role-only"
    return None, "new"


def assign(html, screen_name, ledger, screen_number=None, components=()):
    if screen_name not in ledger["screens"]:
        snum = screen_number or (max(ledger["screens"].values(), default=0) + 1)
        if snum in ledger["screens"].values():
            raise SystemExit(f"screen number {snum} is already used by another screen — numbers are permanent")
        ledger["screens"][screen_name] = snum
    snum = ledger["screens"][screen_name]
    skey = str(snum)
    ledger["next_node"].setdefault(skey, 1)
    w = NodeWalker(components)
    w.feed(html)
    today = datetime.date.today().isoformat()
    used, results, ids_by_pos = set(), [], []
    for n in w.nodes:
        nid, how = match(ledger["nodes"], n, screen_name, used)
        if nid is None:
            nid = f"{snum}:{ledger['next_node'][skey]}"
            ledger["next_node"][skey] += 1
        used.add(nid)
        prev = ledger["nodes"].get(nid, {})
        ledger["nodes"][nid] = {
            "kind": n["kind"], "role": n["role"], "component": n["component"], "screen": screen_name,
            "path": n["path"], "fingerprint": fingerprint(n), "pair": prev.get("pair"),
            "first_seen": prev.get("first_seen", today), "last_seen": today, "status": "active",
        }
        results.append((nid, how, n["role"], n["path"][:70]))
        ids_by_pos.append((n["pos"], nid, n["had_id"]))
    retired = []
    for nid, m in ledger["nodes"].items():
        if m.get("screen") == screen_name and nid not in used and m.get("status") == "active":
            m["status"] = "retired"; m["retired_on"] = today; retired.append(nid)
            if nid not in ledger["retired"]:
                ledger["retired"].append(nid)
    # splice ids into a copy, using the parser's own positions (never a second regex tokenizer)
    lines = html.split("\n")
    offsets = [0]
    for ln in lines:
        offsets.append(offsets[-1] + len(ln) + 1)
    edits = []
    for (line, col, text), nid, had in ids_by_pos:
        if had or not text:
            continue
        start = offsets[line - 1] + col
        if html[start:start + len(text)] != text:
            continue
        end = start + len(text)
        close = "/>" if text.endswith("/>") else ">"
        head = text[: -len(close)].rstrip()
        edits.append((start, end, f'{head} data-node-id="{nid}"{close}'))
    out = html
    for start, end, new in sorted(edits, reverse=True):
        out = out[:start] + new + out[end:]
    return out, results, retired


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--screen", required=True)
    ap.add_argument("--name", required=True, help="ledger name, e.g. web-desktop/favourites")
    ap.add_argument("--screen-number", type=int, default=None, help="registry 'screen' number for a new screen")
    ap.add_argument("--ledger", default="design-kit/qa/ids.json")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--annotate", default=None, help="write a copy with data-node-id attributes")
    a = ap.parse_args()
    src = pathlib.Path(a.screen)
    ledger = load_ledger(a.ledger)
    comps = set()
    cdir = pathlib.Path(a.ledger).resolve().parents[2] / "src" / "components"
    if cdir.is_dir():
        comps = {p.name for p in cdir.iterdir() if p.is_dir()}
    annotated, results, retired = assign(src.read_text(encoding="utf-8"), a.name, ledger, a.screen_number, comps)
    by = {}
    for _, how, _, _ in results:
        by[how] = by.get(how, 0) + 1
    print(f"screen {a.name} -> {ledger['screens'][a.name]}   nodes {len(results)}")
    for k in ("exact", "moved", "content-changed", "role-only", "new"):
        if by.get(k):
            print(f"  {k:16} {by[k]}")
    if retired:
        print(f"  retired          {len(retired)}  ({', '.join(retired[:8])})")
    unsure = [r for r in results if r[1] in ("role-only", "moved", "content-changed")]
    if unsure:
        print("\nreview — these matched loosely:")
        for nid, how, role, path in unsure[:20]:
            print(f"  {nid:>9}  {how:15} {role:26} {path}")
    if len(results) > 600:
        print(f"\n! {len(results)} nodes on one screen — the inclusion rule is too broad (expect 150–250)")
    if a.annotate:
        pathlib.Path(a.annotate).write_text(annotated, encoding="utf-8")
        print(f"\nwrote annotated copy: {a.annotate}")
    if a.write:
        pathlib.Path(a.ledger).write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"ledger updated: {a.ledger}")
    else:
        print("\ndry run — pass --write to update the ledger")


if __name__ == "__main__":
    main()
