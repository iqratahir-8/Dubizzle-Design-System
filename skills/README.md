# skills/ — the distributable skill

`dubizzle-design-handoff.skill` is the **one file** to hand to other people or upload to claude.ai.
It bundles the whole dubizzle Egypt design workflow:

- **Stages:** design (`feature-design`) → review → QA (`design-qa`) → internal hand-off HTML (`design-deliverables`), run by an orchestrator that asks questions and waits for your plan approval.
- **16 specialist guides:** `design-review`, `design-copy`, `design-forms`, `design-grid`, `design-interaction`, `design-typography`, `design-inspiration`, `design-prompt-images`, `icons`, `token-check`, `rtl-arabic`, `motion-design`, `imagery-illustration`, `chart-data-viz`, plus **`egypt-foundations`** and **`sync-design-system`** — the dubizzle Egypt skills that used to live loose on the claude.ai account (colours, components, layout, design-system sync), reconciled with this repo. Sources and provenance: `.claude/external-skills/dubizzle-egypt/`.

How to use it: **`docs/USING-THE-SKILLS.md`**.

## This file is generated

Do not edit it. The source of truth is `.claude/skills/` (the skills stay separate there and load
automatically for anyone working in this repo). After changing any skill, rebuild and commit:

```
npm run package:skill && cp dist/skills/dubizzle-design-handoff.skill skills/
```

Why it is not in `.claude/skills/`: an unpacked copy there would load alongside the originals and
trigger twice.
