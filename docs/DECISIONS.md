# Design Decisions & Discoveries

The design system's memory. Each entry records a decision or a discovery, the
**evidence** behind it, and its status — so it isn't re-litigated or re-broken in
a later session. Read this before building; add to it whenever you learn something
the code alone wouldn't tell you.

Format: `D-NNN — title` · date · status · what · evidence.

---

## D-001 — Price colour depends on the card type: LIST = charcoal, GRID = red
**2026-09-11 · adopted · revised 2026-09-14 after measuring grid cards**

> **Revision (2026-09-14):** the charcoal finding below holds for the **list** card (search
> results, 24px desktop / 18px mobile). The **grid** card — home and landing-page rails and
> the similar-ads widget under an ad — renders its price **red** `#e00000` at 18px/700 on
> desktop and mobile (measured on `home.desktop` / `home.mobile` captures). Components:
> `AdListCard` charcoal, `AdCard` red. See `docs/LIVE-MEASUREMENTS.md`.

The main ad-card price renders in charcoal `#23262a` (`--text-primary` / `--gray-06`),
not the brand red. Red stays reserved for action/brand (Post Your Ad, CTAs).

*Evidence:* measured the saved live dubizzle.com.eg pages — main price computes to
`rgb(35,38,42)` at 24px/700 on both motors and properties. The monorepo code says
red (`.priceLabel { color: $adCardPriceColor }` → `$primaryColor` → `$red05` →
`#e00000`), but **live production renders charcoal**, so the code snapshot is behind
production. The `$gray06` in `gridViewStyles.cssm:127` is on `.downpaymentPriceLabel`
(secondary price), not the main price. Goods/normal-category card has no saved live
reference yet — code says red there too; confirm before assuming charcoal.

## D-002 — The listing card is three category anatomies, not one
**2026-09-11 · adopted**

One shell (`.ad-list-card`), three per-vertical bodies, keyed by category:
- **Cars** — price + model chip → title → `mileage • year` (the live `AdCarSubtitle` shows only two fields).
- **Property** — no free-text title; leads with property **type** + `beds • baths • area`, then attribute chips (Completion Status, Ownership).
- **Goods** — price → title → a single condition attribute; no structured specs.

*Evidence:* the product implements this as a shared `AdCard` that branches
`hero` (cars/property/jobs) vs `normal` (goods) at runtime
(`useShowHeroCategoryAdCardDesign`), with per-vertical subtitle atoms
(`ad/adCarSubtitle`, `adPropertySubtitle`, `adJobSubtitle`). A separate `strat`
property card exists for the Bayut/Zameen layout.

## D-003 — The monorepo lags production; live is ground truth
**2026-09-11 · standing rule**

The extracted `dubizzle-maple` snapshot is behind what actually ships (the price
colour is the proof). When code and live disagree, **live wins.** Re-measure the
live page per feature rather than trusting the snapshot.

## D-004 — Method: capture live, measure with headless Chromium
**2026-09-11 · standing method**

Don't trust the monorepo or a screenshot alone. Serve the saved live page and
measure real elements with `getComputedStyle` + `getBoundingClientRect` (Playwright
/ Chromium). That is how every value in COMPONENT-AUDIT.md and REFERENCES.md was
obtained, and it's what caught the price-colour discrepancy. Note: this environment's
network egress to dubizzle.com.eg is blocked, so live pages must be **saved and
uploaded**, then measured locally.

## D-005 — Page templates are generated from live captures
**2026-09-14 · adopted**

Hand-built templates only approximated production, so feature work started with template
fixes. Templates are now frozen captures (`scripts/build-live-templates.mjs`,
`design-kit/templates/live-templates.json`) and are pixel-checked against the live screenshots
(`npm run check:templates`, ~0–3%). New UI is composed on top of them with the component
library. Hand-built `_pages` remain only where no capture exists. Refresh with the
`live-capture` skill after a release.

## D-006 — Two privacy gates on every logged-in capture
**2026-09-14 · adopted after an incident**

React-controlled form fields restored the account's real name and phone after DOM redaction,
so they appeared in screenshots while the saved HTML was clean. Redaction now sets field values
through the native setter + input event, and `visibleLeaks()` refuses any screenshot whose
rendered text or field values still contain the account name or a non-sample phone. Both
`leaks()` (HTML) and `visibleLeaks()` (screen) must pass. Never remove either.


## D-007 — Gradients and frosted glass are real; the blanket ban was a fabrication
**2026-09-17 · adopted · supersedes the gradient/glassmorphism lines in RULES.md §2**

`RULES.md` claimed gradients were limited to the Featured/Elite/Pro badges, and that
`backdrop-filter` "is not used anywhere in dubizzle". Both were wrong. They were written
before the live-capture pipeline existed, by generalising from three gradient tokens I
happened to recognise in the monorepo, plus a generic anti-AI-slop checklist. Nothing was
measured. `check:design` then enforced the invention as an error, so it actively pushed
generated work *away* from production for weeks.

*Evidence:* swept all 124 local captures for computed `background-image: *gradient*` and
`backdrop-filter != none` on rendered elements (>4px).

- **333 gradient instances, ~30 distinct values, in six roles:** status badges (~100),
  photo scrims `rgba(0,0,0,0)→rgba(0,0,0,.4)` (37), rail edge fades (40), the per-vertical
  "Post your ad" CTA band (~50), the "of the Week" ribbon (14), DPV specs-strip depth (3).
- **The CTA band is tinted per vertical:** home `#f7fafe→#e7f1fd`, motors `#e9eaf7`,
  property `270deg #fef3de→#ffe1e1`, mobiles `#e7f1fd` — all with production's odd
  `79.97%` stop.
- **`backdrop-filter`: exactly one component** — the media-type chip ("Video") over a card
  photo, `blur(4px)` + `rgba(23,25,28,.75)`, radius 4px, 63×22, in 13 captures across both
  verticals and both layouts. Systematic, not a stray.

What survived the correction: **every gradient found does a job.** None is atmosphere — no
mesh, no gradient hero, no gradient button, no gradient text. So the rule is now a *role
allowlist* (RULES.md §1) rather than either a blanket ban or blanket permission, with a
token per role (`--cta-band-*`, `--rail-fade-*`, `--surface-depth`, `--glass-chip-bg/-blur`).
`check:design` allows those tokens and still errors on an inline literal gradient or any
other `backdrop-filter`.

**The general lesson, which matters more than the rule:** a constraint in `RULES.md` that
isn't traceable to a measurement is a liability, because the linter turns it into law.
Every remaining ✗ in §2 should be checkable against the captures. Where one isn't, mark it
as judgement rather than stating it as fact about dubizzle.

## D-008 — Gradient, glass, colour and icon rules relaxed into a proposal workflow
**2026-09-17 · adopted · user decision**

Following D-007, the user set the policy for values the system doesn't yet have. The rules
moved from bans to governance:

- **New gradients and new colours are allowed in a design**, but must be logged in
  `docs/PROPOSALS.md` and **raised with the designer before shipping**. `check:design`
  downgraded both from `error` to `warn` so work isn't blocked — which means the warning,
  plus Claude saying so in the response, is now the only gate. Silence is the failure mode.
- **Glassmorphism is an option, not a default.** Added `.glass-panel` / `.glass-panel--dark`
  with `--glass-panel-{bg,bg-dark,border,blur}`. These are **authored, not measured** —
  production still frosts only the media chip. The distinction is recorded in
  `sync-tokens.mjs`, `PROPOSALS.md` and RULES.md §1 so D-007 doesn't repeat in reverse.
- **Icons: Lucide, Font Awesome and Material Symbols are permitted**, resolved by name.
  `design-kit/icons/` stays first — 587 icons that match each other — with the packs as
  named fallbacks for genuine gaps. Font Awesome **Free only** (CC BY 4.0 / SIL OFL 1.1 /
  MIT, attribution required); no Pro licence exists for this repo. Heroicons, Feather,
  Bootstrap Icons, Phosphor and Iconoir stay out: more sources, more mismatch, no gain.
- **Centred marketing heroes and three evenly-weighted card rows are permitted when the
  brief calls for them** — campaign and landing surfaces, not on top of a results grid.

*Why the provenance table in `PROPOSALS.md` matters:* the system now holds values from three
different sources — measured, adopted, proposed. D-007 happened because an unmeasured value
was stated as fact about dubizzle. Keeping the three labelled is what stops that recurring.

## D-009 — Signed out, the DPV's contact and save actions all open the same login modal
**2026-09-17 · discovered while capturing modals**

"Show Phone Number", "Report this ad" and "Save Search" do **not** open their own dialogs for
a signed-out visitor. All three open the identical **"Login into your Dubizzle account"**
modal (Phone · Email · OR · Google · Facebook · "New to Dubizzle? Create an account").
Verified independently in three captures: `dpv-phone.desktop`, `dpv-report.desktop`,
`save-search.desktop`.

Consequences for capture work:

- The login modal is the single most reachable overlay in the product; `login-dialog` is its
  canonical capture. The other three states document **which actions are gated**, which is
  itself product information worth keeping — don't delete them as duplicates.
- The *real* phone-reveal, report and save-search dialogs only exist behind auth, so they
  need `capture:states --account`. Anything assuming they're public is wrong.
- A capture of a signed-out DPV therefore cannot show a seller's phone number. The
  third-party contact scrubbing added alongside this (`scrubContactsPage` /
  `scrubContactsHtml` / `contactLeaks` in `scripts/lib/redact.mjs`) still matters, because
  the signed-in reveal will show one.

*Also found:* the harness's element finder returned viewport coordinates without scrolling,
so any trigger below the fold was "clicked" at an off-screen point and silently hit nothing —
the capture saved a normal-looking page with no overlay. Only the header mega menus escaped
it, because they are always on screen. `runStep` now scrolls the target into view, re-measures,
and throws if it is still unreachable. **A missed interaction must fail loudly; a capture that
silently records the wrong state is worse than no capture.**

## D-010 — A capture must prove the state opened, and the shot must show it
**2026-09-17 · adopted after two false positives**

Two captures were reported "saved" while showing nothing of the sort: `login-dialog.mobile`
was the plain mobile home page, `dpv-gallery.mobile` the plain mobile DPV. Both were caught
only by opening the PNGs by hand. Three rules now:

1. **Finding the trigger is not proof.** The finder matched an element, clicked it, and the
   page never changed. Every state declares `expect` — `{text}` or `{selector}` that exists
   *only* in the open state ("Login into your Dubizzle account", "Most relevant",
   "Searching For", "Full Leather"). No evidence, no capture; the state FAILS.
2. **Counting overlay boxes is too weak as a default.** A mobile DPV has a sticky contact
   bar, a back button and a photo chip — enough absolutely-positioned elements to pass a
   naive check while showing no gallery. Prefer an explicit `expect`.
3. **The screenshot has to show what the HTML contains.** Freezing the DOM resets scroll, so
   a non-overlay state (an expanded details table) screenshotted the top of the page.
   The capture now scrolls the evidence back into view by absolute offset —
   `scrollIntoView` silently does nothing once the frozen document is height-locked — and
   **skips scrolling when the target sits inside a `position: fixed` ancestor**, because
   scrolling to a modal scrolls the page *behind* it and pushes the dialog out of frame.
   Each result line reports `shot at y=…`, so a scroll mismatch is visible in the log
   rather than only by opening every image.

The `absolute` vs `fixed` distinction is load-bearing: the sort menu is `absolute` and moves
with the page, and scrolling to it revealed **all five options** where the frozen shot had
been clipping it to two at the viewport edge. A capture that is merely plausible is the
thing this whole pipeline exists to prevent.

*Also settled here:* mobile web has no photo gallery ("All 15 images are available in the
app"), and "View +5 more" is the **Details expander**, not a photo control — the state is
`dpv-details-expanded`. `dpv-phone` and `login-dialog` are desktop-only: mobile's Call button
dials directly, and mobile signs in from the bottom nav's Account tab.

## D-011 — A real phone number reached disk. Five bugs, and what they have in common
**2026-09-18 · adopted after an incident**

Capturing the agency portal's Agency Management screen wrote a live agent's phone number
into both the saved HTML and the PNG. It was found by opening the screenshot, not by any
check. That file is deleted, as is every capture from the buggy runs. All 141 captures now
scan clean.

**Why the gates were silent.** `PHONE` used `\b` after the country code — but in
`+201154785698` the `0` and `1` are both word characters, so there is no boundary and the
match never fired. Every gate (`scrubContactsPage`, `scrubContactsHtml`, `contactLeaks`,
`visibleLeaks`) depended on that one pattern, so all four agreed the page was clean.

**Why the fixtures missed it.** `fixturizeTables` was written to overwrite cells wholesale
*precisely because* a name is not a pattern — then implemented as detect-and-replace by
accident: it rewrote only the deepest text node per cell. The Agents table stacks name +
phone + WhatsApp handle in one cell, so it replaced the handle and left the real name and
number. It reported "3 cells replaced", which read like success.

Three more found while verifying:

- **Raw-HTML scanning matched markup.** An inline SVG path (`M12 2a10 10 0 1 0 10 10A…`) and
  an App Store id in a URL both look like Egyptian mobiles, so the first re-scan reported a
  leak in 137 of 139 captures — and `scrubContactsHtml` would have *rewritten those digits*,
  silently corrupting every icon it touched. Scrub and leak-check now read rendered text
  only: never attributes, never inside `<svg>`.
- **`\s` let a newline join two numbers.** The dashboard chart's Y axis renders as
  `15000\n10000`, which matched as a phone, so `visibleLeaks` refused to save a clean page
  twice. Separators are now `[ \t-]`.
- **Empty states are not data rows.** An empty state lives in the `tbody` as one cell
  spanning every column; the fixture pass overwrote "Showing 0 Leads" artwork copy with a
  fixture name. A row now counts as data only if it has roughly as many cells as the table
  has headers.

**The common thread:** every one of these came from treating a phone number as "digits with
flexible separators" and trusting a single pattern to be both the scrubber and the judge.
The scrubber and the gate share `PHONE`, so a hole in it disables detection *and* repair at
once, and nothing is left to notice. Three rules follow:

1. **Verify captures by eye.** Four of these bugs produced output that looked correct, and
   two reported success while doing the wrong thing. This is the same lesson as D-010.
2. **Never soften a gate to unblock a capture.** Both gate failures here were false
   positives, and both were fixed by making the pattern *more accurate*, not more permissive.
   A check that cries wolf is a check someone later disables — which is how the real leak
   returns.
3. **Wholesale overwrite beats detection for third-party data.** Where a person's name can
   appear, replace everything in the region rather than what a detector recognises.

## D-012 — dubizzle Pro has no mobile layout
**2026-09-18 · user decision**

The agency portal is desktop-only. Rendering it at 390px yields a squeezed desktop page,
not a mobile design, so capturing it would put a misleading "mobile portal" in the gallery
and invite someone to build against a layout that does not exist.

`DESKTOP_ONLY` in `scripts/capture-account.mjs` holds every `portal-*` screen, and a mobile
run reports them as **skipped** with the reason rather than silently producing nothing. If
dubizzle ships a Pro mobile layout later, remove the screens from that set — don't work
around it.

The eight portal captures are therefore desktop-only by design, not by omission.

## D-013 — The design-system export: credited, not measured
**2026-09-18 · adopted with a boundary**

A dubizzle Egypt design-system bundle arrived as a design-tool export (`Credit Info Protool.zip`
— the agency portal's Credit Info screen plus a 45-component system). It is the first external
source this project has taken anything from, so its provenance had to be established before use.

**What it agrees with us on.** 37 of its 38 colour tokens match our measured palette **exactly**.
That is a strong independent confirmation of the extraction pipeline, and the reason its other
values are credible at all.

**What it adds that we lacked.** Motion tokens — `--ease-standard` `cubic-bezier(0.4,0,0.2,1)`,
`--duration-fast` 0.15s, `--duration-base` 0.25s, `--skeleton-duration` 1.5s. The system had two
timing values in 1,269 tokens; these are now in `sync-tokens.mjs` under a `motion` group. Also
illustrations and portal icons, extracted to `design-kit/illustrations/` — the system previously
had **no** illustration assets at all, which blocked every empty state.

**Where the boundary is.** These are **adopted, not measured** (the provenance rule from
`PROPOSALS.md`), and the distinction is load-bearing here:

- The bundle's `motion.css` credits a **"Sell with AI" prototype**, and its component list
  includes `AiChip`, `AiFlowSurface`, `AiStarBadge`. **None of those appear in any of our 142
  live captures.** The bundle therefore mixes shipped product with proposed design work — its
  own readme says as much, splitting "Repository Mode" from "Innovation Mode" and labelling the
  latter *Future Recommendation*.
- Its one non-matching colour, `--ai-indigo` `#707ce9`, belongs to exactly that unshipped AI
  work. It went to `docs/PROPOSALS.md` as **open**, not into the token set.
- `--duration-fast: 0.15s` happens to match the figure `RULES.md` asserted before D-007. That
  is corroboration from a second source, **not** a measurement — it may simply share an origin.
  Verify on live with the `motion-design` skill before calling 0.15s production fact.

**Storage.** `design-kit/reference/exports/` is gitignored, like the captures: the bundle is
12.9MB, carries licensed Proxima Nova and GESS font files that must not be redistributed, and
includes raw screenshots. What matters is extracted and committed; the raw bundle stays local.

**The general rule this sets:** an external design system is evidence, not authority. Where it
agrees with a measurement, it corroborates. Where it goes beyond one, it is a proposal — however
official it looks, and however much of it turns out to be right.

## D-014 — Taste-skill library: one of thirteen installed
**2026-09-18 · adopted**

The `taste-skill` library (leonxlnx, 13 skills) was reviewed for this project. **Only
`output-skill` was installed**, as `full-output-enforcement`.

**Why the rest stay out.** They are aesthetic-*selection* skills: they read a brief, infer a
design direction, then supply fonts, spacing, shadows and motion. dubizzle already has all of
those, measured from production across 142 captures. A skill that picks an aesthetic is
solving a problem this project does not have, and would reintroduce exactly what D-007 cost us
— confident values with nothing behind them.

`taste-skill` itself rules this out in its own first line: *"Landing pages, portfolios, and
redesigns. Not dashboards, not data tables, not multi-step product UI."* dubizzle is a dense
product UI with data tables and an agency dashboard. It also says *"the audience picks the
aesthetic, not your taste"* — here the **measurements** pick it.

The style skills (`brutalist`, `minimalist`, `soft`, `gpt-tasteskill`) impose a visual
language; `brandkit` and the `imagegen-*` skills generate brand imagery, which RULES.md §4d
forbids — dubizzle's illustration style is extracted from captures, never generated.

**Why `output-skill` is different.** It carries no aesthetic at all. It bans `// ...`,
`// TODO`, "for brevity", skeleton-instead-of-implementation, and truncated files, and defines
a clean pause/resume protocol at token limits. That is useful for a project whose deliverables
are complete token files, capture scripts and full component sets.

**The general rule:** a skill that supplies *values* competes with the measurements and is
refused. A skill that supplies *rigour* is welcome. Judge an external skill on which of those
it is.

**Revised same day — `taste-skill` is now installed, scoped.** The user needs this agent to
design dubizzle **landing pages**, which is precisely the scope taste-skill declares for
itself. The original call rejected it on the product-UI case without accounting for the
marketing case, and that was too broad.

It is installed as `design-taste-frontend` with a dubizzle preamble above the upstream text:
it governs **composition** on landing/campaign/marketing surfaces — hierarchy, rhythm, section
order, not looking templated — and explicitly does **not** choose the ingredients. Palette,
Proxima Nova / GESS, gradient-by-role, motion tokens, imagery-from-captures, EGP, RTL and the
contrast limits stay binding and outrank it. Where it conflicts, the measurement wins; its
font recommendations and its image generation are to be ignored.

This mirrors the Repository Mode / Innovation Mode split in dubizzle's own design-system
export (D-013), and `RULES.md` §4a now states it directly: **measured surfaces** (listings,
search, DPV, post-an-ad, chat, account, portal) versus **composed surfaces** (landing,
campaign, growth/SEO, app-download). Freedom is in the arrangement, never in the ingredients.

`frontend-design` was narrowed at the same time. Its description had fired on "build web
components, pages, or applications" — most requests here — while its body asks for bold
aesthetics, distinctive display fonts, gradient meshes and dramatic shadows, all of which
contradict RULES.md. It is now explicitly for non-dubizzle work.

Not installed, available in the library if wanted for non-dubizzle work: `taste-skill`,
`taste-skill-v1`, `gpt-tasteskill`, `brutalist`, `minimalist`, `soft`, `brandkit`,
`redesign-skill`, `stitch-skill`, `image-to-code-skill`, `imagegen-frontend-web`,
`imagegen-frontend-mobile`.

## D-015 — Emil Kowalski's animation skills: eight of thirteen installed
**2026-09-18 · adopted**

Motion was the system's weakest area (RULES.md 4c: two timing tokens in 1,269, nothing
honouring `prefers-reduced-motion`). These skills close the craft half of that gap, and
they pass the D-014 test cleanly: **they supply rigour, not values.**

The `animate` skill's own third rule is *"Extend the codebase's tokens, don't fork them.
If `--ease-out` or a duration scale already exists, use it. Adding a parallel system is a
defect"* — which is this project's position stated by someone else. Its frequency gate
(*100+ times/day → no animation, ever*) is doubly right for a scanning product.

**Installed:** `animate` (build), `review-animations` (critique, "approval is earned"),
`improve-animations` (codebase audit), `find-animation-opportunities` (read-only survey),
`animation-vocabulary` (name a motion from a vague description), `emil-design-eng`
(craft philosophy), `mobile-native` (mweb feeling native), `prototype` (variant explorer
for composed surfaces).

**Not installed, and why:** `animate-expo` and `write-swift` target React Native and
Swift; this is a web product. `ask-sonner` and `pick-ui-library` push external
dependencies into a project that has its own 42-component library. `apple-design`
teaches spring and gesture physics that `RULES.md` 4c forbids outright — installing it
would put a skill and the rules in direct conflict, which is the `frontend-design`
problem again.

**Scoping.** Two got a dubizzle preamble. `animate` is pointed at our four adopted motion
tokens (D-013) and the §4c bans. `emil-design-eng` is marked as craft only: its "taste is
trained" framing is about judgement, not licence to choose new ingredients, and where it
suggests a border, shadow, radius or duration that differs from a token, **the token
wins** and the suggestion goes to `PROPOSALS.md`.

The division that keeps both useful: **craft from these skills, provenance from
`motion-design`.** They will happily hand you a duration; `motion-design` insists you use
the token, measure live, or log a proposal. `motion-design` now routes to them by job.

Licence: MIT, Copyright (c) 2026 Emil Kowalski. Notice kept at
`.claude/skills/animate/LICENSE-emil` and recorded in `ATTRIBUTIONS.md`.

**Revised same day — all thirteen are installed.** The user wants the remaining three
available against a future in which dubizzle's components and physics move toward a newer
iOS feel. That is a legitimate reason to hold a skill the current rules do not yet allow,
so the answer is not to refuse it but to scope it honestly:

- **`apple-design`** teaches exactly what `RULES.md` 4c bans. It is installed **ahead of
  the rules** and framed as a **proposal generator**: on a measured surface nothing ships,
  and the spring you would use goes to `PROPOSALS.md` noting that it needs sign-off *and a
  change to 4c*. Three of its ideas apply today regardless, because they are correctness
  rather than style — interruptibility, starting from the current on-screen value, and
  respecting a drag's velocity. None require a spring. RULES.md 4c now says all of this.
- **`pick-ui-library`** has an immediate use. `chart-data-viz` says adding a charting
  dependency is a decision to raise rather than make silently, and the portal ships a
  chart the system cannot draw. This skill is how to raise it well. It is scoped to check
  `src/components/` first: a second library for something we already have is a defect.
- **`ask-sonner`** is scoped so the **captures remain the specification** — appearance,
  copy, placement and timing come from the repo's `Toast` (`src/components/Toast`), not from
  Sonner's defaults. Sonner is a candidate implementation and a reference for what we have
  not captured (promise, loading, updating in place). Adopting it is a proposal with its
  bundle cost stated, themed entirely in dubizzle tokens.

`animate-expo` and `write-swift` remain uninstalled: React Native and Swift are not this
product. If dubizzle ships a native app they become relevant in a day.

**The principle this settles:** a skill whose advice the current rules forbid can still be
worth holding, provided the conflict is written down and the skill is wired to produce
proposals instead of output. What must never happen is a skill quietly overriding a rule —
that is D-007 with extra steps.

## D-016 — AntV chart MCP: registered for exploration, not for shipping
**2026-09-18 · adopted with a hard data boundary**

`.mcp.json` registers `@antv/mcp-server-chart` (26+ chart types: bar, line, column, area,
pie, radar, sankey, funnel, treemap, network, district maps and more). It closes a real
gap — the system could not draw a chart at all — but only for one half of the problem.

**The boundary that matters: the server sends data off this machine.** Every `generate_*`
call POSTs the chart data to `getVisRequestServer()`, defaulting to
`https://antv-studio.alipay.com/api/gpt-vis` (Ant Group), and returns a remote image URL.
For a project that deleted a capture and fixed five redaction bugs over a single phone
number (D-011), posting a leads table or revenue series to a third-party renderer would
undo that in one call. **Fixture-shaped numbers only**, unless self-hosted — the repo
ships a Dockerfile and compose file, and `VIS_REQUEST_SERVER` points wherever you deploy.

**What it produces is not a design-system artefact.** A remote image in AntV's palette and
axis styling is not dubizzle's chart, cannot be tokenised, and `RULES.md` 4d forbids
generated imagery in a composed or measured surface. It is a thinking aid: *which chart
type fits this data*, sketched fast.

**What ships is still the path in RULES.md 4e:** measure the portal's Ads Performance line
chart first (`chart-data-viz`), propose the tokens it implies, get sign-off, pick the
rendering library with `pick-ui-library` — AntV's own React libraries are the natural
candidates precisely because the portal's chart comes from that family — then build the
component in dubizzle tokens and theme the library rather than shipping its defaults.

New skill `dubizzle-charts` holds the usage rules, the data boundary, and the decisions
already made: red is reserved for action so a series is never red, the portal's line is
blue, colour is never the only signal, EGP formatting follows production, and a table
often beats a chart in a dense classifieds product — the portal's own Insights screen
carries trend inside a table with no chart at all.

**Consumer side has no chart today** and the bar stays high: a price-history line on a DPV
is plausible and would still be a new pattern needing product sign-off, not something
added because the capability arrived.

## D-017 — A real applicant's name passed every gate, and I reported it clean
**2026-09-21 · adopted after an incident**

`portal-candidates` and the new `portal-candidate-detail` contained a real job applicant's
full name, city, current employer and degree. The first was captured on 2026-09-18, built
into a template and shown in Storybook, and **I told the user all portal captures scanned
clean**. That was only true for phone numbers and emails. Both files were gitignored and
never committed (git history checked); both are deleted.

**Why it got through.** The Candidates screen lists applicants as **cards** — avatar, name,
city, employer — with no `<table>`. `fixturizeTables` only walks tables, so it reported
"0 cells, 0 rows, 0 tables" and moved on. Every other gate matches patterns, and a name is
not a pattern. So four independent checks all passed a page with a named stranger on it.

**The tell was in the log and I read past it.** Three people-listing screens reported
"fixtures: 0 cells", which should mean "empty" and instead meant "not a table". A redaction
pass that finds nothing to redact on a page that obviously lists people is not a pass — it
is a pass that did not run.

**Fixed:**
- `fixturizeCards()` (lib/redact.mjs): a *person card* is a repeated list item containing
  an avatar-like image; every text leaf in it is overwritten except UI labels, status words,
  dates, numbers and generic enums. Over-replacing is safe; under-replacing leaks.
- Labelled person fields — "Assigned to:", "Posted by:", "Agent:" — have their value
  replaced anywhere on the page, avatar or not. Agency Ads carried "Assigned to: <agent>"
  and was not in the fixture set at all; it is now.
- The capture log reports tables, cards and labelled fields separately, so "found nothing"
  is visible per mechanism instead of summed to a reassuring zero.

**Also found in the same pass:** `portal-ad-overview` was saved against an ad ID that had
expired; the URL fell back to the Agency Ads list and the capture recorded the wrong screen
(the D-010 failure again). Deleted, and removed from `ACCOUNT_SCREENS` until a live ID is used.

**The rule this adds, and it outranks the regexes:** for any screen that lists people, the
**screenshot is checked by eye before the capture is trusted**. Every privacy failure on
this project — D-011's phone number, this name — passed the automated gates and was caught
by looking. The gates are necessary. They have never once been sufficient.

## D-018 — The modern-look toolkit is open: gradients from primitives, glass, glows, accents, heroes (2026-09-22)

**User decision.** Removed from the Don'ts: gradients ("in future we are open to use and make
new gradients for modern look using our primitives"), glassmorphism and coloured glows ("a
possibility… for modern look"), purple / indigo / teal ("somewhere needed — ask the designer
to add it in the colour tokens as primitive and semantic colours"), and centred marketing
heroes ("where needed"). Added to the Do's: icons from Material Symbols (Google Fonts), Font
Awesome and Lucide, "similar to our platform with smooth curve edges with outlined stroke and
not fully pointed".

**What changed.** `RULES.md` §1 (colour accents, gradients from primitives, shadows incl.
glows), new §2a "Do — the modern-look toolkit", §2 Forbidden rewritten around what is still
wrong (literal colours, a non-red CTA, glow/gradient on body text or dense listings, dark
mode, neon); iconography now specifies the variant (Material Symbols Rounded outlined, FA
Regular, Lucide at 1.5–1.75 stroke). The kit's Rules panel (`build-preview.mjs`) — which
still showed the old Don'ts to designers — was rewritten to match. `check:design`: a
gradient built only from `var()` stops is a note to register it, not a violation; literal
stops are flagged; purple/indigo/teal hex now says "allowed accent, needs tokens"; the shadow
error points glows at `--glow-*` tokens. `taste-skill`'s own anti-purple / anti-glow /
anti-centre defaults are overridden in its dubizzle preamble.

**What did not change.** The gate. Every new gradient, glow and accent colour is still a
**proposal** until the designer confirms it and it becomes a token — and Claude must say so
in the response. Purple/indigo/teal have no tokens yet: the designer needs to add a
primitive ramp (`01…07`) and semantic roles for each.

## D-019 — Headings and button labels use Title Case (2026-10-01)

**User decision:** "Keep the Title case … for heading and button labels." Live mixes Title Case
(`Post Your Ad`, `Save Search`, `Clear All Filters`, `Popular Searches`) and sentence case
(`Show phone number`, `Change password`, portal buttons); web guides (GOV.UK, Polaris, Microsoft)
recommend sentence case.

**Rule:** new **headings and button labels** use Title Case (minor words — a, an, the, and, or,
for, of, in, on, to, at, by, with — lowercase unless first or last; brand casing kept). Field
labels, tabs, links, chips and menu items are not covered: they follow live on their surface.
Sentences — errors, hints, descriptions, toasts, empty-state body — stay sentence case. Existing
live strings are still copied verbatim; a heading or button live writes both ways uses its Title
Case form. English only.

**Changed:** `design-copy` (casing section, examples), `design-interaction`, `design-review`,
`design-copy/references/{principles,dubizzle-voice}.md`, `design-kit/qa/product/copy.md` table,
`RULES.md` §4.

## D-020 — Arabic uses Western digits (2026-10-01)

**User decision:** "Arabic digits: Western." Live already writes prices, area and time in Western
digits (`990,000 ج.م`, `220 م٢`, `منذ 2 أيام`) but card mileage in Arabic-Indic (`١٦٬٠٠٠ كم`), and
CLDR's `ar-EG` locale defaults to Arabic-Indic.

**Rule:** every number in the Arabic UI uses Western digits 0–9 with a Western comma separator —
prices, mileage, area, counts, time, phone numbers. Code formats with `ar-EG-u-nu-latn`, never bare
`ar-EG`. Live's Arabic-Indic mileage is a defect to report. Seller-typed digits inside titles are
user content and stay as written.

**Changed:** `design-copy` (+ `references/arabic.md`, `dubizzle-voice.md`), `design-typography`,
`design-qa` checklist, `PROGRESS.md` open items.

## D-021 — `#f6f6f6` as a page background belongs to the apps, not the web (2026-10-02)

**User decision:** "Page background `#f6f6f6` is for app specific."

**Rule:** on web (desktop and mobile web) the page background is white (`--surface-page`). `#f6f6f6`
(`--surface-subtle`) is a section or band colour on web — the header top row, section backgrounds — and is
the page background only on the apps (iOS / Android). A web design never uses it for the whole page.

**Why recorded:** the account skill `dubizzle-egypt-colors` says "page = `#F6F6F6`", which is wrong for web
by this decision. It is now flagged in `.claude/external-skills/dubizzle-egypt/RECONCILIATION.md` (row 2).

**Not checked:** whether the repo defines separate app-platform tokens for it; RULES.md does not yet say "apps only".

