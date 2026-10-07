#!/usr/bin/env python3
"""
Analytics checks for dubizzle — the event catalog, the tenant file and a feature's tracking.json.

Used two ways:
  * imported by run.py (the trk.* checks in a QA report), and
  * on its own:  npm run check:tracking [-- --feature favourites-revamp]
    which validates design-kit/analytics/* and, with --feature, that feature's tracking.json.

Exit codes (CLI): 0 clean · 1 warnings only · 2 blockers.
"""
import argparse, json, pathlib, re, sys

ANALYTICS = "design-kit/analytics"
TRK_SEV = {
    "trk.catalog": "blocker",   # event missing from the catalog, or deprecated
    "trk.name": "blocker",      # naming rule / reserved name / length
    "trk.params": "blocker",    # parameter not declared, required parameter missing, >25 params
    "trk.pii": "blocker",       # a parameter that would carry personal data
    "trk.currency": "blocker",  # a money parameter without currency
    "trk.tenant": "blocker",    # unknown tenant
    "trk.screen": "blocker",    # event fires on a screen the flow does not have
    "trk.node": "warning",      # node id not in the ledger
    "trk.metric": "warning",    # metric with no event / event with no metric
    "trk.ids": "warning",       # tenant has no GA4 ids recorded — DebugView verification impossible
    "trk.unobserved": "note",   # catalog event never observed on live for this tenant
}
MONEY = {"price", "value"}


def load(root, rel, default=None):
    p = root / rel
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def catalog_issues(cat, tenants):
    """Problems in the catalog itself. Returns [(check, subject, message)]."""
    out = []
    nm = cat["naming"]
    pat = re.compile(nm["pattern"])
    pii = re.compile(nm["pii_param_pattern"], re.I)
    shared = set((tenants or {}).get("shared_parameters", {}))
    seen = set()
    for e in cat.get("events", []):
        n = e.get("name", "")
        if n in seen:
            out.append(("trk.name", n, "event is defined twice in the catalog"))
        seen.add(n)
        if not pat.match(n):
            out.append(("trk.name", n, f"name breaks the naming rule {nm['pattern']} (snake_case, starts with a letter, ≤{nm['limits']['name_chars']} chars)"))
        if any(n.startswith(p) for p in nm["reserved_prefixes"]):
            out.append(("trk.name", n, f"name uses a reserved prefix ({', '.join(nm['reserved_prefixes'])})"))
        if n in nm["reserved_names"]:
            out.append(("trk.name", n, "name is reserved / collected automatically by GA4"))
        if e.get("status") not in cat["status_values"]:
            out.append(("trk.catalog", n, f"status '{e.get('status')}' is not one of {cat['status_values']}"))
        if e.get("status") == "deprecated" and not e.get("replaced_by"):
            out.append(("trk.catalog", n, "deprecated without replaced_by"))
        params = e.get("parameters", {})
        if len(params) + len(shared) > nm["limits"]["params_per_event"]:
            out.append(("trk.params", n, f"{len(params)} parameters + {len(shared)} shared exceeds {nm['limits']['params_per_event']}"))
        for p in params:
            if not pat.match(p):
                out.append(("trk.params", n, f"parameter '{p}' breaks the naming rule"))
            if pii.search(p):
                out.append(("trk.pii", n, f"parameter '{p}' looks like personal data — never send it"))
            if p in shared:
                out.append(("trk.params", n, f"parameter '{p}' is a shared parameter; do not redeclare it per event"))
        if MONEY & set(params) and "currency" not in params:
            out.append(("trk.currency", n, f"has {sorted(MONEY & set(params))} but no currency parameter"))
    for code, t in ((tenants or {}).get("tenants") or {}).items():
        dec = (t.get("currency") or {}).get("decimals")
        if dec not in (0, 2, 3):
            out.append(("trk.tenant", code, f"currency.decimals {dec!r} is not an ISO minor-unit count"))
    return out


def feature_issues(trk, cat, tenants, flows=None, ledger_ids=None):
    """Problems in one feature's tracking.json. Returns [(check, subject, message)]."""
    out = []
    events = {e["name"]: e for e in cat.get("events", [])}
    shared = set((tenants or {}).get("shared_parameters", {}))
    pii = re.compile(cat["naming"]["pii_param_pattern"], re.I)
    known_tenants = set(((tenants or {}).get("tenants") or {}))
    feat = trk.get("feature", "?")
    for t in trk.get("tenants", []):
        if t not in known_tenants:
            out.append(("trk.tenant", feat, f"tenant '{t}' is not in {ANALYTICS}/tenants.json"))
        else:
            ga = tenants["tenants"][t].get("ga4") or {}
            if not ga.get("measurement_id") and not ga.get("gtm_container"):
                out.append(("trk.ids", feat, f"{t} has no GA4 measurement id or GTM container recorded — QA cannot verify these events in DebugView for {t}"))
            for ev in trk.get("events", []):
                ce = events.get(ev.get("event"))
                if ce and t not in (ce.get("observed_live") or {}):
                    out.append(("trk.unobserved", f"{feat}/{ev.get('event')}", f"'{ev.get('event')}' has not been observed on live {t} — it is a proposal, not a measurement"))
    screens = set((flows or {}).get("screens", {}))
    used = set()
    for i, ev in enumerate(trk.get("events", [])):
        name = ev.get("event")
        subj = f"{feat}/{ev.get('id') or name or i}"
        ce = events.get(name)
        if not ce:
            out.append(("trk.catalog", subj, f"event '{name}' is not in the catalog — add it through event-taxonomy (status proposed) or reuse an existing one"))
            continue
        used.add(name)
        if ce.get("status") == "deprecated":
            out.append(("trk.catalog", subj, f"event '{name}' is deprecated — use '{ce.get('replaced_by')}'"))
        if ev.get("decision") not in ("reuse", "parameter", "new"):
            out.append(("trk.catalog", subj, "decision must be reuse | parameter | new (event-taxonomy's three questions)"))
        declared = set(ce.get("parameters", {})) | shared
        given = set((ev.get("params") or {}))
        for p in given - declared:
            out.append(("trk.params", subj, f"parameter '{p}' is not declared on '{name}' in the catalog"))
        for p, spec in ce.get("parameters", {}).items():
            if spec.get("required") and p not in given and p not in (ev.get("dynamic") or []):
                out.append(("trk.params", subj, f"required parameter '{p}' of '{name}' is neither set in params nor listed in dynamic"))
            allowed = spec.get("values")
            v = (ev.get("params") or {}).get(p)
            if allowed and v is not None and v not in allowed:
                out.append(("trk.params", subj, f"'{p}' = {v!r} is not one of {allowed}"))
        for p in given | set(ev.get("dynamic") or []):
            if pii.search(p):
                out.append(("trk.pii", subj, f"parameter '{p}' looks like personal data"))
        if MONEY & (given | set(ev.get("dynamic") or [])) and "currency" not in given | set(ev.get("dynamic") or []):
            out.append(("trk.currency", subj, "money parameter without currency (take the code from tenants.json)"))
        on = ev.get("screens") or ([ev["screen"]] if ev.get("screen") else [])
        if not on:
            out.append(("trk.screen", subj, "no screen — say where the event fires (screen or screens)"))
        for sc in on:
            if flows is not None and sc not in screens:
                out.append(("trk.screen", subj, f"screen '{sc}' is not in the feature's flows.json"))
        if ev.get("node") and ledger_ids is not None and ledger_ids and ev["node"] not in ledger_ids:
            out.append(("trk.node", subj, f"node {ev['node']} is not in the ledger (design-kit/qa/ids.json)"))
    metric_events = set()
    for m in trk.get("metrics", []):
        evs = set(m.get("events", []))
        metric_events |= evs
        if not evs:
            out.append(("trk.metric", f"{feat}/{m.get('id')}", f"metric '{m.get('name')}' has no event that measures it"))
        for e in evs - used:
            out.append(("trk.metric", f"{feat}/{m.get('id')}", f"metric '{m.get('name')}' names '{e}', which this feature does not fire"))
    if not trk.get("metrics"):
        out.append(("trk.metric", feat, "no metrics — every event should measure something the brief cares about"))
    for e in sorted(used - metric_events):
        if not any(ev.get("debug_only") for ev in trk.get("events", []) if ev.get("event") == e):
            out.append(("trk.metric", f"{feat}/{e}", f"'{e}' measures no metric (mark debug_only if it is for debugging)"))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", default=None)
    a = ap.parse_args()
    from common import repo_root
    root = repo_root()
    cat = load(root, f"{ANALYTICS}/event-catalog.json")
    tenants = load(root, f"{ANALYTICS}/tenants.json")
    if not cat or not tenants:
        sys.exit(f"{ANALYTICS}/event-catalog.json or tenants.json is missing")
    issues = catalog_issues(cat, tenants)
    if a.feature:
        reg = load(root, "design-kit/qa/registry.json", {}) or {}
        fe = (reg.get("features") or {}).get(a.feature) or {}
        trk_rel = fe.get("tracking") or f"design-kit/deliverables/{a.feature}/tracking.json"
        trk = load(root, trk_rel)
        if not trk:
            sys.exit(f"{trk_rel} not found")
        flows = load(root, fe.get("flows")) if fe.get("flows") else None
        ids = set(((load(root, "design-kit/qa/ids.json", {}) or {}).get("nodes") or {}))
        issues += feature_issues(trk, cat, tenants, flows, ids)
    worst = 0
    for check, subj, msg in issues:
        sev = TRK_SEV.get(check, "warning")
        worst = max(worst, {"note": 0, "warning": 1, "blocker": 2}[sev])
        print(f"{sev:8} {check:15} {subj:34} {msg}")
    n = len(cat["events"])
    live = sum(1 for e in cat["events"] if e.get("observed_live"))
    print(f"\ncatalog {cat['version']}: {n} events ({live} observed on live) · {len(tenants['tenants'])} tenants · "
          f"{sum(1 for i in issues if TRK_SEV.get(i[0]) == 'blocker')} blocker, {sum(1 for i in issues if TRK_SEV.get(i[0]) == 'warning')} warning")
    sys.exit(worst)


if __name__ == "__main__":
    main()
