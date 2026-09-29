#!/usr/bin/env python3
"""
Turn a design-qa report.json into deliverable section fragments (markdown).

Five sections are generated rather than authored: state-screens, edge-cases, accessibility,
acceptance, open-questions. That is the practical argument for gating on QA first.

    python3 consume_report.py --report design-kit/qa/report/report.json --out <dir> [--allow-blocked]

Exit: 0 ok · 2 unsupported schema · 3 BLOCKED (nothing written unless --allow-blocked, which is for
debugging only and stamps the fragments DRAFT).
This skill reads report.json and nothing else from design-qa.
"""
import argparse, collections, json, pathlib, sys

ACCEPTED_SCHEMA = {1}
HINT_TO_SECTION = {k: k for k in ("state-screens", "edge-cases", "accessibility", "acceptance", "open-questions")}


def md_table(rows, headers):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    for r in rows:
        out.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in r) + " |")
    return "\n".join(out)


def load(path):
    rep = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    sv = rep.get("schema_version")
    if sv not in ACCEPTED_SCHEMA:
        print(f"report schema_version {sv} is not accepted (accepts {sorted(ACCEPTED_SCHEMA)}). "
              "Stopping rather than guessing at the shape.", file=sys.stderr)
        sys.exit(2)
    return rep


def gate(rep, allow_blocked=False):
    if rep["verdict"] == "blocked":
        blockers = [f for f in rep["findings"] if f["severity"] == "blocker" and not f.get("waived")]
        print(f"BLOCKED — {len(blockers)} unwaived blocker(s)"
              + ("" if blockers else " (render checks did not run)")
              + (". Building a DRAFT anyway (--allow-blocked)." if allow_blocked else ". Not building."), file=sys.stderr)
        for f in blockers[:15]:
            print(f"  {f['check']:18} {f['screen']:28} {f['message'][:80]}", file=sys.stderr)
        if not allow_blocked:
            sys.exit(3)


def fragments(rep):
    buckets = collections.defaultdict(list)
    for f in rep["findings"]:
        buckets[HINT_TO_SECTION.get(f.get("section_hint"), "open-questions")].append(f)
    out = {}
    live_note = ("Findings on frozen production captures (`origin: live`) are recorded as notes: "
                 "they describe production, not this design.")
    for sec in ("edge-cases", "accessibility", "state-screens"):
        fs = [f for f in buckets.get(sec, []) if not (f["severity"] == "note" and f.get("origin") == "live")]
        n_live = sum(1 for f in buckets.get(sec, []) if f["severity"] == "note" and f.get("origin") == "live")
        rows = [(f["check"], f["screen"], f.get("node") or f.get("css_path") or "—", f["severity"], f["message"][:140]) for f in fs]
        body = md_table(rows, ["check", "screen", "node", "severity", "finding"]) if rows else "_No findings in this category._"
        if n_live:
            body += f"\n\n_{n_live} further note(s) on live captures omitted. {live_note}_"
        out[sec] = f"<!-- generated from QA report -->\n\n{body}\n"
    passed = [c for c in rep.get("checks_run", []) if c["status"] == "pass"]
    skipped = [c for c in rep.get("checks_run", []) if c["status"] == "skipped"]
    acc = ["<!-- generated from QA report -->", "",
           "Verified by the design QA run that gated this deliverable. Each is objectively checkable; re-running QA re-verifies it.", "",
           md_table([(c["check"], c.get("cases", 0), "verified") for c in passed], ["criterion", "cases", "status"]) if passed
           else "_No checks passed — this deliverable should not have been built._"]
    if skipped:
        acc += ["", "### Not verified", "", "These checks did not run. Nothing is claimed either way.", "",
                md_table([(c["check"], c.get("skipped_reason") or "—") for c in skipped], ["check", "why it did not run"])]
    out["acceptance"] = "\n".join(acc) + "\n"
    oq = []
    for f in rep["findings"]:
        if f.get("waived"):
            w = f.get("waiver") or {}
            oq.append((f["check"], f["screen"], "waived blocker",
                       f"{w.get('reason', 'no reason recorded')} (granted by {w.get('granted_by', '?')}, expires {w.get('expires_on', '?')})"))
        elif f["severity"] == "warning":
            oq.append((f["check"], f["screen"], "warning", f["message"][:120]))
    out["open-questions"] = ("<!-- generated from QA report; authored questions are merged in by the builder -->\n\n"
                             + (md_table(oq, ["source", "screen", "kind", "question / note"]) if oq else "_No QA warnings or waivers._") + "\n")
    return out, {"state-screens": len(buckets.get("state-screens", [])), "edge-cases": len(buckets.get("edge-cases", [])),
                 "accessibility": len(buckets.get("accessibility", [])), "acceptance": len(passed), "open-questions": len(oq)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", default="design-kit/qa/report/report.json")
    ap.add_argument("--out", required=True)
    ap.add_argument("--allow-blocked", action="store_true")
    a = ap.parse_args()
    rep = load(a.report)
    gate(rep, a.allow_blocked)
    frags, counts = fragments(rep)
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for name, body in frags.items():
        (out / f"{name}.md").write_text(body, encoding="utf-8")
    print(f"verdict {rep['verdict']} — wrote {len(frags)} section fragments to {out}")
    for k, v in counts.items():
        print(f"  {k:16} {v} entries")


if __name__ == "__main__":
    main()
