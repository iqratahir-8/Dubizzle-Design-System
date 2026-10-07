# What each section needs

Canonical ids and applicability are in `schema/sections.json`. This file is about content — what
makes each section useful rather than decorative. Rule for all of them: a section that does not
apply is marked **not applicable, with a reason**. Never fill a shape with invented content.

## summary
Feature, the problem, platforms, scope, sign-off, and — past v1 — what changed since the previous
version. Audience-sensitive: engineers want scope and constraints, stakeholders want the problem
and the decision. Ask which; don't average.

## prototype
Clickable, driven by `flows.json` (`flows.md`). Needs back, reset, a screen picker, hotspot reveal,
deep links. Deep-link matters more than it sounds: it is how a reviewer sends someone to the exact
thing they are commenting on.

## button-states
For each button-like component used, which of hover / active / focus / disabled / loading the
system's `patterns.css` **declares**. It does not render them side by side (forcing pseudo-states on
a static page is not automated) and says so. A missing "focus" is a real finding.

## state-screens
Every state the registry declares, plus **empty** whether or not anyone declared it. The table shows
designed / not designed with a deep link into the screen picker. Generated from the registry + QA.

## screens-redlines
The screens themselves with the inspector attached: press R, click any node — id, role, the design-
system component it instantiates, its box and computed style. The section engineers work from.

## rules
Behaviour not visible in a screenshot: conflict handling, what validates when, what persists, what is
optimistic. **Each rule must be testable** — the build flags any without a stated test. "Should feel
responsive" is not a rule.

## motion
Every transition with duration, easing, trigger, and reduced-motion behaviour. **Motion is unmeasured
in this design system** (2 tokens in 1,269), so this section applies only when the feature supplies
values measured from live (`motion-design`). A duration with no easing is half a spec. Never invent one.

## dotlottie
The system ships no Lottie. Normally not applicable.

## gestures
Only when web-mobile is in scope and gestures are specified. Each gesture: target node id, threshold,
what happens below threshold, what happens on conflict with scroll.

## edge-cases
Content extremes (the `ovf.*` results: 200-character string, longest real title, 999,999,999),
clipped text, breakpoints (`brk.render` at 360/390/480/767 or 768/950/1280/1440), plus authored network,
permission and empty-vs-error cases. Where the longest Egyptian place name lives.

## assets
Every image and icon the screens use, with where it is used. Illustrations come from
`design-kit/illustrations/` — never stock (`imagery-illustration`). All inlined.

## tokens
**A filtered view.** Only the tokens the screens consume (through the classes they use in
`patterns.css` and their own `var()`s), each resolved from `tokens.css`. Never restate the full set:
a copy disagrees with the source within a month.

## accessibility
Hit targets, labels, alt, headings, reduced motion — from QA. States plainly that the palette's known
AA failures are production values and that RTL/Arabic is out of scope while parked, and that focus order
and screen-reader behaviour need a person.

## performance
Only when a budget is declared, naming what is budgeted against what number and where the number came
from. A budget with no source is a wish.

## tracking

Analytics and tracking. Applies when the feature registers a `tracking.json`
(`analytics-tracking`). Generated: metrics; events (user action, event, decision, screen and node,
parameters, when it fires, catalog status and where it has been seen live, key event); one dataLayer
example; custom definitions to register; per tenant currency, decimals, which GA4 ids are known and key
events; the DebugView checklist; open `trk.*` findings; tracking questions. **Never says an event is
live unless `observed_live` says so.** Deeper engineering detail: `ga4-event-spec`.

## acceptance
Every criterion objectively checkable, tied to a check id or node id. Generated from checks that passed,
plus authored criteria. Skipped checks are listed as **not verified** — claiming nothing beats implying
coverage that does not exist.

## platform-notes
Every declared desktop/mobile difference with its reason (`unpaired`), and every undeclared one as an
open question. Differences are usually correct; silent ones usually aren't.

## open-questions
QA warnings, waived blockers with reason/grantor/expiry, and authored questions. Each names who can
answer it and what it blocks. An open question with no owner will still be open at sign-off — the build
flags any without one.
