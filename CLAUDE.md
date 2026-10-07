# Instructions for Claude

1. **Read `PROGRESS.md` first.** It is the current state of this project, the ground rules agreed
   with the user, and what to do next. Continue from its "Next up" section.
2. **Keep `PROGRESS.md` current without being asked.** The user switches between Claude accounts
   at any moment. After every milestone (a feature, fix, capture batch, or user decision):
   update "Last updated", the timeline, "Next up" and any new rules or gotchas, then commit it
   together with the work. Never leave meaningful progress only in the chat.
3. Follow `RULES.md` for design work. Never write the account holder's real name anywhere.
4. **Designing something new, or revamping a screen? Use the `feature-design` skill.**
   It runs the product pass and the design pass, and — critically — makes you check whether
   the screen is already captured before you invent it. Anything with no measured basis goes
   in `docs/PROPOSALS.md` and gets said out loud.
5. **Specialist skills exist for the weak spots** — `rtl-arabic` (never verified),
   `motion-design` (undefined), `imagery-illustration` (no illustration assets),
   `chart-data-viz` (no chart language), `icons` (any icon need: house set first, then one
   style-matched pack, with a recorded reason), plus `npm run check:a11y`. Use them instead of
   improvising a value.
   **Craft skills** — `design-copy`, `design-forms`, `design-typography`, `design-grid`,
   `design-interaction`, `design-inspiration`, `design-prompt-images` (generated photos for banners and
   heroes that don't look AI-made; never listing photos or illustrations) — apply web best practice *through* the measured
   system (live wins where they disagree). **`design-review`** is the anti-slop critique: run it on
   new work before `design-qa`.
   **Finished a design? Run `design-qa`** (gate: states, overflow, breakpoints, flows) and, to hand it
   over, **`design-deliverables`** (one self-contained INTERNAL HTML document; refuses on QA blockers).
6. **`docs/HOW-TO-ASK.md` is the user's guide to this system** — the screens they can name, what
   phrasing triggers what, how to re-capture. If they ask how to use the design agent, or seem
   unsure what exists, point them there (and keep it accurate when the system gains screens or
   components).
7. **Whole job, idea to hand-off? Use `design-to-handoff`.** It asks questions, gets a plan approved,
   then runs `feature-design` → `design-qa` → `design-deliverables` with a gate between each. Use the
   three skills directly when only one stage is wanted.
8. **Analytics — the only multi-tenant part.** Tracking plans, GA4 events and funnels work for every tenant
   (EG, KSA, KW, BH, OM, JO): `analytics-tracking` (entry), `event-taxonomy`, `ga4-event-spec`, `funnel-analysis`,
   `analytics-insights`. Data in `design-kit/analytics/` (read its README). Catalog events are proposals until
   `npm run extract:tracking` sees them on live; never write a GA4 / GTM / Firebase id from memory. Screens stay
   Egypt-measured — never imply another tenant's UI is verified.
9. **How others use the skills:** `docs/USING-THE-SKILLS.md`. The distributable single file is `skills/dubizzle-design-handoff.skill`
   (generated: `npm run package:skill`, then copy to `skills/`). Rebuild and commit it whenever a skill changes.

