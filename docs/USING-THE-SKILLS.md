# Using the dubizzle design skills

One workflow, four ways to get it. Pick by where you work.

| You work in | Do this | What works |
|---|---|---|
| **Claude Code, in this repo** (best) | Clone the repo, `npm install`, run `claude` inside it. Nothing to install: the skills load from `.claude/skills/`. | Everything, including real QA runs and building deliverables |
| **Claude Code, any folder** | Clone the repo and `npm install`, then once: `/plugin marketplace add chaudhary-umair-ahmad/dubizzle-design-system` and `/plugin install dubizzle-design@dubizzle`. Restart Claude Code. | The same, from any directory — but open it in the repo clone when you run QA or build a deliverable |
| **claude.ai / Claude Design** | Settings → Capabilities → Skills → Upload `skills/dubizzle-design-handoff.skill`. An org admin can enable it for everyone. | The process, the questions, the plan and all the craft guides. **Not** the QA scripts or deliverable builder (no repo there) |
| **Someone with no setup** | Send them `skills/dubizzle-design-handoff.skill` and this page | Same as the row above |

Cloud Claude Code sessions on this repo already have the skills (no plugin install; `/plugin` is not available there).

## Prerequisites (for running QA and building deliverables)

- The repo cloned and `npm install` done (Node 22).
- Python 3.11+.
- Chrome or Chromium for the render checks: set `CHROME_PATH`, or it is found automatically on macOS and in `/opt/pw-browsers`.
- Account-captured screens (e.g. `my-ads`, `chat`) exist only on machines that ran the capture; the Agency Portal pages are in the repo.

## What to say

| You say | It does |
|---|---|
| **"Do the whole thing for [feature]"**, or `/design-to-handoff` | Asks a few questions, shows a plan and **waits for your approval**, then designs, reviews, runs QA and builds the hand-off document, stopping at any blocker |
| "Design [feature]" | Just the design stage; ends with registry entries, a draft flow and a first QA run |
| "Review this design" / "does this look AI-made?" | `design-review`: P0–P3 findings |
| "Write the error message / button labels" | `design-copy` (Title Case headings and buttons; Western digits in Arabic) |
| "QA the favourites page" / "is this ready?" | `design-qa`: PASS, PASS WITH WARNINGS or BLOCKED, plus a report |
| "Make the deliverable for [feature]" | `design-deliverables`: one self-contained INTERNAL HTML file in `design-kit/deliverables/<feature>/dist/` |
| "Which icon for…" / "write a prompt for a campaign photo" | `icons` / `design-prompt-images` |

Say "just design", "just QA" or "just the deliverable" to run one stage.

## First run — a 5-minute check

1. Open Claude Code in the repo and type `/` — you should see `design-to-handoff`, `design-qa`, `design-review`, `design-copy` and the rest.
2. Ask: *"QA the favourites revamp."* You should get a case matrix, then one verdict line.
3. Ask: *"Do the whole thing for [a small feature]."* It must ask questions and wait for your approval before it draws anything. If it starts designing without a plan, it is not using the skill.

## Rules everyone gets by default

- Deliverables are **INTERNAL** (licensed fonts): never share them outside dubizzle.
- Nothing unmeasured is presented as fact; gaps go to `docs/PROPOSALS.md` and are said out loud.
- No real names, phones or emails in designs or captures.
- If the bundled Egypt foundations disagree with `RULES.md` or `design-kit/tokens`, the repo wins and the difference is logged in `docs/PROPOSALS.md`.

## One skill, no loose copies

Everything dubizzle Egypt is in `dubizzle-design-handoff`, including the older account skills
`dubizzle-egypt-design-skill`, `-colors`, `-components`, `-layout` and `sync-dubizzle-design-system` (now `specialists/`). After uploading the
new file, **delete those five from the account** so only one skill answers. Leave alone: the generic `design-qa` / `design-deliverables`
(another product), `apps-design-deliverable-sop`, the MyZameen and OLX PK skills, and the product-agent skills.
Where the old Egypt guidance disagrees with this repo, the repo wins (`.claude/external-skills/dubizzle-egypt/RECONCILIATION.md`).

## Updating

- In the repo: `git pull` — the skills update with it.
- Plugin: `/plugin marketplace update dubizzle`.
- Uploaded file: after any skill change run `npm run package:skill`, copy `dist/skills/dubizzle-design-handoff.skill` to `skills/`, commit, and upload the new file again (replace the old one so two versions never coexist).

## Troubleshooting

| Symptom | Cause |
|---|---|
| `/plugin` says "not available in this environment" | You are in a cloud session. Skills already load there; no install needed |
| Skill not listed after install | Restart Claude Code; check you opened it inside the repo clone |
| "cannot find the repo root" | Run scripts from the repo root (they need `package.json` and `design-kit/`) |
| QA says render checks skipped | No Chrome found — set `CHROME_PATH` |
| Deliverable refuses ("remote images") | Run `npm run localize:assets` on a machine that can reach dubizzle.com.eg, rebuild, or use `--placeholder-images` for a draft |
| Two skills answer "design QA" or "Dubizzle Egypt colours" | An older loose copy is still on the account. Delete `dubizzle-egypt-*` and `sync-dubizzle-design-system`; the generic `design-qa` belongs to another product, so say "dubizzle" or name the skill |
