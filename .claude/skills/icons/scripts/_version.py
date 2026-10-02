"""
Single source of truth for this skill's version: the SKILL.md frontmatter.

Scripts read it rather than carrying their own constant, because a hardcoded
constant drifts the moment someone bumps the frontmatter and forgets the
script — and then a report claims it came from a version that never produced it.
"""
import pathlib, re

_SKILL_MD = pathlib.Path(__file__).resolve().parent.parent / "SKILL.md"


def skill_version(default="0.0.0"):
    try:
        head = _SKILL_MD.read_text(encoding="utf-8").split("---")[1]
        m = re.search(r"^version:\s*(\S+)", head, re.M)
        return m.group(1) if m else default
    except Exception:
        return default


def skill_name(default="unknown"):
    try:
        head = _SKILL_MD.read_text(encoding="utf-8").split("---")[1]
        m = re.search(r"^name:\s*(\S+)", head, re.M)
        return m.group(1) if m else default
    except Exception:
        return default
