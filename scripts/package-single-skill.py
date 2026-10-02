#!/usr/bin/env python3
"""
Build ONE uploadable skill (dist/skills/dubizzle-design-handoff.skill) from the four repo skills.

The repo keeps design-to-handoff, feature-design, design-qa and design-deliverables as separate
skills (source of truth). For claude.ai upload — where a name like design-qa can clash with skills
already on the account — this stitches them into a single skill with stages as files:

    SKILL.md            orchestrator (name: dubizzle-design-handoff)
    stages/1-design.md  2-qa.md  3-deliverable.md
    qa/…  deliverables/…   (scripts, schema, references, assets)

    python3 scripts/package-single-skill.py [--out dist/skills]
"""
import argparse, pathlib, re, shutil, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SK = ROOT / ".claude" / "skills"
NAME = "dubizzle-design-handoff"
SUB = ("references", "assets", "schema", "scripts")
# Craft and specialist skills bundled under specialists/<name>/ (SKILL.md is shipped as GUIDE.md so the
# package has exactly one SKILL.md). Kept in sync with .claude-plugin/plugin.json by the check below.
SPECIALISTS = ["design-review", "design-copy", "design-forms", "design-grid", "design-interaction",
               "design-typography", "design-inspiration", "design-prompt-images", "icons",
               "token-check", "rtl-arabic", "motion-design", "imagery-illustration", "chart-data-viz"]


EXT = ROOT / ".claude" / "external-skills" / "dubizzle-egypt"
EXTERNAL = [  # (folder, row description) — account skills copied into the repo, not live repo skills
    ("egypt-foundations", "Colour, components and layout foundations written on 2026-08-12 for the consumer site, plus the "
     "page archetypes and RTL mirror list. **Read its precedence rules first: the repo's RULES.md and tokens win** — it lists every difference."),
    ("sync-design-system", "Sync the Claude Design system artifact with the `iqratahir-8/Dubizzle-Design-Agent` repo: rebuild the component bundle "
     "from the latest commit, keep `tokens.json`, re-check every preview, publish. Never overwrite `lastChange` wholesale."),
]


def short_desc(path, limit=230):
    t = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", t, flags=re.S)
    fm = m.group(1) if m else ""
    d = re.search(r"^description:\s*(.*?)(?=^\w[\w-]*:|\Z)", fm, flags=re.S | re.M)
    txt = re.sub(r"\s+", " ", re.sub(r"^[>|][-+]?\s*", "", d.group(1).strip())).strip(" \"'") if d else ""
    return txt if len(txt) <= limit else txt[: limit].rsplit(" ", 1)[0] + " …"



def body(p):
    t = p.read_text(encoding="utf-8")
    m = re.match(r"---\n.*?\n---\n", t, flags=re.S)
    return t[m.end():] if m else t


def retarget(text, skill, folder):
    text = text.replace(f".claude/skills/{skill}/", f"{folder}/")
    text = re.sub(r"(?<![\w/.\-])(%s)/" % "|".join(SUB), rf"{folder}/\1/", text)
    text = re.sub(r"(?<![\w/.\-])CHANGELOG\.md", f"{folder}/CHANGELOG.md", text)
    return text


RELATED = """
## Everything dubizzle Egypt is in this skill

The earlier account skills `dubizzle-egypt-design-skill`, `dubizzle-egypt-colors`, `-components` and `-layout`, and
`sync-dubizzle-design-system`, are bundled under `specialists/` (`egypt-foundations`, `sync-design-system`). **Use this skill, not the
loose copies.** If an older copy is still on the account, delete it so only one answers.

**Precedence for any dubizzle Egypt design question:** (1) this repo's `RULES.md`, `design-kit/tokens` and live captures;
(2) the specialist guides; (3) `specialists/egypt-foundations/original/` only where the repo is silent. Differences go to
`docs/PROPOSALS.md`.

Not part of this skill, because they are other products or other jobs: the generic `design-qa` and `design-deliverables`
(built for another product — do not use them for dubizzle Egypt), `apps-design-deliverable-sop` (iOS/Android hand-offs),
the MyZameen and OLX PK skills, and the product-agent skills (ticket writing). The Agency Portal is designed from this repo's
captured `portal-*` pages; there is no separate portal design agent.
"""


MAP = ("> **Single-skill package.** The other stages are files in this skill, not separate skills: "
       "design = `stages/1-design.md`, QA = `stages/2-qa.md`, deliverable = `stages/3-deliverable.md`. "
       "Where a stage says \"invoke `design-qa`\" or \"use the `design-deliverables` skill\", read that file. "
       "Scripts run from the **repo root** (they need `design-kit/`): `python3 <this skill's folder>/qa/scripts/run.py …`. "
       "The specialist skills (copy, forms, grid, typography, interaction, review, icons, RTL, motion, imagery, charts, tokens) "
       "are guides under `specialists/` — see the index at the end of this file.\n\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="dist/skills")
    a = ap.parse_args()
    out = ROOT / a.out
    stage = out / "_build" / NAME
    shutil.rmtree(out / "_build", ignore_errors=True)
    (stage / "stages").mkdir(parents=True)

    orch = body(SK / "design-to-handoff" / "SKILL.md")
    orch = orch.replace("# Design to hand-off — dubizzle Egypt", "# Design to hand-off — dubizzle Egypt (single skill)", 1)
    orch = orch.replace("each stage is done by its own skill, invoked with the Skill tool.",
                        "each stage is a file in this skill (`stages/`).")
    for old, new in (("Invoke `feature-design`.", "Follow `stages/1-design.md`."),
                     ("Invoke `design-qa`", "Follow `stages/2-qa.md`"),
                     ("Invoke `design-deliverables`.", "Follow `stages/3-deliverable.md`."),
                     ("Invoke `design-review`", "Follow `specialists/design-review/GUIDE.md`"),
                     ("through `design-copy`", "through `specialists/design-copy/GUIDE.md`"),
                     ("through `design-forms`", "through `specialists/design-forms/GUIDE.md`")):
        orch = orch.replace(old, new)
    fm = ("---\nname: %s\ndescription: >-\n"
          "  DUBIZZLE EGYPT ONLY (dubizzle.com.eg consumer site and the Pro agency portal; not other products, not iOS/Android apps).\n"
          "  The single entry point for ALL dubizzle Egypt design work: colours, type, spacing, layout, components, copy, forms, icons,\n"
          "  screens, flows, review, QA and hand-off.\n"
          "  Run the whole dubizzle Egypt design job end to end: intake questions, a written plan the user approves,\n"
          "  then design, QA against every state/platform/breakpoint, and one self-contained INTERNAL hand-off HTML\n"
          "  document, stopping at each gate. Use for \"design this dubizzle feature and hand it over\", \"do the whole\n"
          "  thing for dubizzle\", \"dubizzle design QA\", \"is this dubizzle screen ready\", \"dubizzle deliverable / hand-off\".\n"
          "  Needs the dubizzle-design-system repo checked out to run its scripts.\n"
          "version: 1.2.0\n---\n\n" % NAME)
    (stage / "SKILL.md").write_text(fm + MAP + orch + RELATED, encoding="utf-8")

    d = body(SK / "feature-design" / "SKILL.md")
    d = d.replace(".claude/skills/design-deliverables/", "deliverables/").replace(".claude/skills/design-qa/", "qa/")
    d = d.replace("`references/deliverable-json.md`", "`deliverables/references/deliverable-json.md`")
    (stage / "stages" / "1-design.md").write_text(MAP + d, encoding="utf-8")
    for src, folder, fname in (("design-qa", "qa", "2-qa.md"), ("design-deliverables", "deliverables", "3-deliverable.md")):
        (stage / "stages" / fname).write_text(MAP + retarget(body(SK / src / "SKILL.md"), src, folder), encoding="utf-8")
        shutil.copytree(SK / src, stage / folder,
                        ignore=shutil.ignore_patterns("SKILL.md", "__pycache__", "*.pyc"))

    rows = []
    for name in SPECIALISTS:
        src = SK / name
        if not (src / "SKILL.md").exists():
            raise SystemExit(f"specialist skill missing: {name}")
        dst = stage / "specialists" / name
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("SKILL.md", "__pycache__", "*.pyc"))
        (dst / "GUIDE.md").write_text(retarget(body(src / "SKILL.md"), name, f"specialists/{name}"), encoding="utf-8")
        for md in dst.rglob("*.md"):                      # other files: only rewrite repo-skill paths
            if md.name != "GUIDE.md":
                md.write_text(md.read_text(encoding="utf-8").replace(f".claude/skills/{name}/", f"specialists/{name}/"), encoding="utf-8")
        rows.append(f"| `{name}` | {short_desc(src / 'SKILL.md')} | `specialists/{name}/GUIDE.md` |")
    # account skills that were copied into the repo (see .claude/external-skills/dubizzle-egypt/README.md)
    eg = stage / "specialists" / "egypt-foundations"
    (eg / "original").mkdir(parents=True)
    for n in ("dubizzle-egypt-design-skill", "dubizzle-egypt-colors", "dubizzle-egypt-components", "dubizzle-egypt-layout"):
        (eg / "original" / f"{n}.md").write_text(body(EXT / "original" / f"{n}.md"), encoding="utf-8")
    (eg / "GUIDE.md").write_text(
        "# Egypt foundations (account skills, reconciled with this repo)\n\n"
        + (EXT / "RECONCILIATION.md").read_text(encoding="utf-8").split("\n", 1)[1]
        + "\n## The originals\n\nVerbatim, for what the repo is silent on. Their links to `references/*` and to the typography, spacing and "
          "radius skills are dead (never uploaded).\n\n"
          "- `original/dubizzle-egypt-design-skill.md` — conductor, 6-phase workflow, 20-point quality gate\n"
          "- `original/dubizzle-egypt-colors.md`\n- `original/dubizzle-egypt-components.md`\n- `original/dubizzle-egypt-layout.md`\n",
        encoding="utf-8")
    sy = stage / "specialists" / "sync-design-system"
    sy.mkdir(parents=True)
    (sy / "GUIDE.md").write_text(body(EXT / "original" / "sync-dubizzle-design-system.md"), encoding="utf-8")
    for name, desc in EXTERNAL:
        rows.append(f"| `{name}` | {desc} | `specialists/{name}/GUIDE.md` |")
    index = ("\n\n## Specialist guides (read the one you need, not all of them)\n\n"
             "| Skill | Use when | Read |\n|---|---|---|\n" + "\n".join(rows) + "\n")
    sk = (stage / "SKILL.md")
    sk.write_text(sk.read_text(encoding="utf-8") + index, encoding="utf-8")

    out.mkdir(parents=True, exist_ok=True)
    target = out / f"{NAME}.skill"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(stage.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(stage.parent))
    shutil.rmtree(out / "_build")
    print(f"wrote {target.relative_to(ROOT)}  ({target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
