# design-kit/qa — data for the design-qa and design-deliverables skills

| file | owner | what |
|---|---|---|
| `registry.json` | `build_registry.py` seeds; `feature-design` adds authored screens | every screen: origin, platforms, states, roles, flags, `screen` number |
| `product/copy.md` | you | canonical strings (`cpy.verbatim`) |
| `product/flags.md` | you | feature flags that change a surface |
| `product/roles.md` | you | roles that change a surface |
| `waivers.json` | you (Claude proposes, never grants) | per-element waivers with expiry |
| `ids.json` | `design-deliverables/scripts/assign_ids.py` | stable node-id ledger — commit it |
| `platforms.json` | optional | overrides for `design-qa/schema/platforms.json` |
| `report/` | generated | `report.json`, `report.html`, `matrix.json` — gitignored |

Commands live in the skills: `.claude/skills/design-qa/SKILL.md`,
`.claude/skills/design-deliverables/SKILL.md`.
