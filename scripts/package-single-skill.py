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


def body(p):
    t = p.read_text(encoding="utf-8")
    m = re.match(r"---\n.*?\n---\n", t, flags=re.S)
    return t[m.end():] if m else t


def retarget(text, skill, folder):
    text = text.replace(f".claude/skills/{skill}/", f"{folder}/")
    text = re.sub(r"(?<![\w/.\-])(%s)/" % "|".join(SUB), rf"{folder}/\1/", text)
    text = re.sub(r"(?<![\w/.\-])CHANGELOG\.md", f"{folder}/CHANGELOG.md", text)
    return text


MAP = ("> **Single-skill package.** The other stages are files in this skill, not separate skills: "
       "design = `stages/1-design.md`, QA = `stages/2-qa.md`, deliverable = `stages/3-deliverable.md`. "
       "Where a stage says \"invoke `design-qa`\" or \"use the `design-deliverables` skill\", read that file. "
       "Scripts run from the **repo root** (they need `design-kit/`): `python3 <this skill's folder>/qa/scripts/run.py …`. "
       "Specialist skills (`token-check`, `rtl-arabic`, `motion-design`, `imagery-illustration`, `chart-data-viz`) "
       "are optional and not in this package.\n\n")


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
                     ("Invoke `design-deliverables`.", "Follow `stages/3-deliverable.md`.")):
        orch = orch.replace(old, new)
    fm = ("---\nname: %s\ndescription: >-\n"
          "  Run the whole dubizzle Egypt design job end to end, step by step: intake questions, a written plan\n"
          "  the user approves, then design, QA against every state/platform/breakpoint, and one self-contained\n"
          "  INTERNAL hand-off HTML document, stopping at each gate. Use for \"design this and hand it over\",\n"
          "  \"do the whole thing\", \"end to end\", \"design QA\", \"is this design ready\", \"make the deliverable\",\n"
          "  \"hand-off for the devs\". Needs the dubizzle-design-system repo checked out to run its scripts.\n"
          "version: 1.0.0\n---\n\n" % NAME)
    (stage / "SKILL.md").write_text(fm + MAP + orch, encoding="utf-8")

    d = body(SK / "feature-design" / "SKILL.md")
    d = d.replace(".claude/skills/design-deliverables/", "deliverables/").replace(".claude/skills/design-qa/", "qa/")
    d = d.replace("`references/deliverable-json.md`", "`deliverables/references/deliverable-json.md`")
    (stage / "stages" / "1-design.md").write_text(MAP + d, encoding="utf-8")
    for src, folder, fname in (("design-qa", "qa", "2-qa.md"), ("design-deliverables", "deliverables", "3-deliverable.md")):
        (stage / "stages" / fname).write_text(MAP + retarget(body(SK / src / "SKILL.md"), src, folder), encoding="utf-8")
        shutil.copytree(SK / src, stage / folder,
                        ignore=shutil.ignore_patterns("SKILL.md", "__pycache__", "*.pyc"))

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
