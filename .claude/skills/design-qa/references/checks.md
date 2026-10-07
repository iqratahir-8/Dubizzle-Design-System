# Check catalogue

Every check has a stable id. Ids are permanent — a retired check keeps its id and is marked
retired so historical reports stay readable.

**Status:** ✅ implemented · 🔌 wrapped (calls an existing repo command) · 🗓 planned (in the
catalogue, **not run** — never claim it as covered). Severity is the default for `authored`
screens; `live` screens are capped at `note` (`severity.md`).

---

## cov — coverage

| id | test | sev | status |
|---|---|---|---|
| `cov.file` | the registered default file exists on disk | blocker (live: warning) | ✅ |
| `cov.state` | every declared state is rendered (`state_files`, `path#name` verified against `[data-state]`) | blocker | ✅ |
| `cov.empty` | an empty state exists, declared or not, unless `no_list` | blocker | ✅ |
| `cov.flag` | every flag gating the page has its off-state rendered | blocker | ✅ |
| `cov.role` | every `role_differs` role is represented | warning | 🗓 |
| `cov.locale` | every non-`en` locale in scope has a screen or is in `deferred_locales` | warning | ✅ |

`cov.empty` is separate from `cov.state` on purpose: empty is the most commonly missing piece of
a design and PRDs almost never mention it. Failing it independently makes the omission visible.

## tok — tokens

Run on **authored** screens; a live capture's inline styles and hex are production's.

| id | test | sev | status |
|---|---|---|---|
| `tok.inline` | no `style=` attribute except ones that only set custom properties (`--x:`) | blocker | ✅ |
| `tok.hex` | no hex/`rgb()` outside `:root` in `<style>` or inline | blocker | ✅ |
| `tok.px` | no px literal in a declaration (media queries excepted; `0`/`1px` allowed) | warning | ✅ |
| `tok.resolve` | every `var(--x)` is defined in `tokens.css`, `patterns.css`, `generated.css`, or locally | blocker | ✅ |
| `tok.lint` | palette, radius, shadow, font, icon rules from `RULES.md` via `check:design` | error→blocker, warn→warning | 🔌 |
| `tok.class` | every class used exists in `patterns.css` / a component | blocker | 🗓 |

`tok.px` is a warning because media-query conditions cannot use custom properties.

## cpy — copy

| id | test | sev | status |
|---|---|---|---|
| `cpy.placeholder` | no `lorem`, `TODO`, `TBC`, `TBD`, `xxx`, `John Doe` in visible text | blocker | ✅ |
| `cpy.voice` | none of: get started, discover, unlock, seamless, elevate, supercharge, revolutionise, effortless (`RULES.md`) | warning | ✅ |
| `cpy.verbatim` | visible strings equal the canonical strings in `product/copy.md` in casing and punctuation | blocker | ✅ (skipped while `copy.md` lists none) |
| `cpy.missing` | every English string has an Arabic counterpart | warning | 🗓 (Arabic parked) |

Live header/footer/bottom-nav regions are excluded from copy checks (`live_regions`).

## flw — flows

Driven by a `flows.json` per feature (`design-deliverables/references/flows.md`).

| id | test | sev | status |
|---|---|---|---|
| `flw.dead` | every transition endpoint is a screen in the flow | blocker | ✅ |
| `flw.node` | every `node` a transition names is in the ledger `ids.json` (when it has nodes) | blocker | ✅ |
| `flw.reach` | every screen is reachable from `entry` | blocker | ✅ |
| `flw.back` | every non-entry screen has a `back`/`dismiss`/`close` transition | blocker | ✅ |
| `flw.dismiss` | every modal/drawer/sheet/dialog has a `dismiss`/`close` transition | blocker | ✅ (declared in the flow, not detected in the DOM) |
| `flw.orphan` | pages of the feature that no flow references | warning | ✅ |

## par — parity (desktop ↔ mobile)

Only for authored pages present on both. Differences are normal — a dropdown on desktop is a full
page on mobile. The check is "an unexplained difference is a bug until someone says otherwise".

| id | test | sev | status |
|---|---|---|---|
| `par.states` | both platforms declare the same state set | warning | ✅ |
| `par.copy` | the pair shares ≥60% of its visible strings (live regions excluded) | warning | ✅ |
| `par.undeclared` | page on one of desktop/mobile only, with no `unpaired` entry | warning | ✅ |
| `par.actions` | both platforms offer the same actions | warning | 🗓 |

## rtl — right to left (only with `ar` in scope)

| id | test | sev | status |
|---|---|---|---|
| `rtl.physical` | `left`/`right`/`margin-left` where a logical property belongs | blocker | 🔌 `check:rtl` (off while Arabic is parked; `check:design`'s RTL warnings are recorded as notes) |
| `rtl.dir` / `rtl.icon` / `rtl.number` | `dir`, mirrored icons, digits | — | 🗓 (needs `rtl-arabic`) |

## a11y — accessibility

| id | test | sev | status |
|---|---|---|---|
| `a11y.alt` | every image has alt or is decorative | blocker | 🔌 `check:a11y` |
| `a11y.label` | every control has an accessible name | blocker | 🔌 `check:a11y` |
| `a11y.heading` | heading levels don't skip; page starts at h1 | warning | 🔌 `check:a11y` |
| `a11y.target` | hit area ≥ platform `hit_target_min` (24px); below `hit_target_aim` (44px mobile) is a note. Inline links inside a sentence are exempt (WCAG 2.5.8) | blocker | ✅ render |
| `a11y.contrast.*` | text/UI contrast | — | 🗓 — the palette-wide result lives in `check:a11y` (14 of 24 pairings fail AA; **production values, never "fixed"**) |
| `a11y.focusring` / `a11y.focus` | focus visibility / order | — | 🗓 — needs a person (`check:a11y` says so too) |

## ovf — content extremes (render)

The highest-yield family. Injects into **user-generated text**: nodes marked `data-ugc`, else
(as a warning-only fallback) leaf text in an article/card whose class says title/name/location/…
Static labels ("Featured", "3 Beds") are not injected. Fails on new horizontal overflow, a node
past the viewport edge, or clipping with no `text-overflow: ellipsis`.

| id | test | sev | status |
|---|---|---|---|
| `ovf.long` | a 200-character string with no spaces | blocker (heuristic match: warning) | ✅ |
| `ovf.longest_real` | the longest real title in `design-kit/content/fixtures.json` | blocker (heuristic: warning) | ✅ |
| `ovf.big_number` | `999,999,999` replaces the digits of a price/count (`EGP 8,500,000` → `EGP 999,999,999`) | blocker (heuristic: warning) | ✅ |
| `ovf.clipped` | on the page **as designed** (no injection), text cut off by an `overflow:hidden` ancestor with no ellipsis. ≥30% cut = blocker, less = warning. Horizontal scrollers and carousels are skipped. Found a real defect on the first run: the `favourites` mobile spec row is clipped at 390/360/480px | blocker | ✅ |
| `ovf.empty_string` / `ovf.zero` / `ovf.negative` / `ovf.no_image` / `ovf.null_date` | empty, `0`, negative, missing image, null date | — | 🗓 |
| `ovf.arabic` | Arabic equivalent of the longest string | — | 🗓 (Arabic parked) |

## brk — breakpoints (render)

| id | test | sev | status |
|---|---|---|---|
| `brk.render` | no horizontal overflow at each declared width for the platform (`platforms.json`) | blocker | ✅ |
| `brk.canonical` | every breakpoint used is in the canonical set (360, 480, 768, 950, 1280) | warning | 🗓 |

Findings whose element is inside a live region (production header at 768px overflows by 80px)
are recorded as `live` notes, not blockers.

## trk — tracking

Runs when the feature has `registry.features[<feature>].tracking` (a `tracking.json`, written by
`analytics-tracking`). Same code as `npm run check:tracking`. Any tenant in `design-kit/analytics/tenants.json`.

| id | test | sev | status |
|---|---|---|---|
| `trk.catalog` | every event is in `design-kit/analytics/event-catalog.json`, not deprecated; `decision` is reuse / parameter / new | blocker | ✅ |
| `trk.name` | catalog names: snake_case, ≤ 40 chars, no reserved GA4 name or prefix, no duplicates | blocker | ✅ |
| `trk.params` | parameters declared on the event (or shared), required ones set or `dynamic`, enumerated values respected, ≤ 25 per event | blocker | ✅ |
| `trk.pii` | no parameter that would carry personal data (name, phone, email, message, address, national id) | blocker | ✅ |
| `trk.currency` | `price` / `value` always travel with `currency` | blocker | ✅ |
| `trk.tenant` | every tenant exists in `tenants.json`; currency decimals are ISO minor units | blocker | ✅ |
| `trk.screen` | every event names a screen, and the screen is in the feature's `flows.json` | blocker | ✅ |
| `trk.node` | a named node is in the ledger `ids.json` | warning | ✅ |
| `trk.metric` | every metric has events; every event measures a metric (or is `debug_only`) | warning | ✅ |
| `trk.ids` | the tenant has a GA4 measurement id or GTM container recorded (else DebugView verification is impossible) | warning | ✅ |
| `trk.unobserved` | the event has been seen on that tenant's live site (`observed_live`) — otherwise it is a proposal | note | ✅ |
| `trk.fires` | the event actually fires in the built product with these parameters | — | 🗓 needs the implemented build and DebugView; manual today |

## mot — motion (render)

| id | test | sev | status |
|---|---|---|---|
| `mot.reduced` | no animation still runs under `prefers-reduced-motion: reduce`. An essential loader can be waived per element | blocker | ✅ |
| `mot.budget` | no animation exceeds a duration budget | warning | 🗓 — motion is unmeasured in this system (`motion-design`); there is no budget to check against, and one is not invented here |
| `mot.infinite` | no unbounded animation outside loaders | warning | 🗓 |

## prv — privacy

| id | test | sev | status |
|---|---|---|---|
| `prv.leak` / `prv.click` | no real name/phone/email in generated portal pages; sidebar routes resolve | blocker (never capped) | 🔌 `check:prototype`, runs when portal pages are in scope |

## cmp — components (`--components`)

| id | test | sev | status |
|---|---|---|---|
| `cmp.parity` | Storybook and kit compute identical styles (`check:parity`, needs both servers) | blocker | 🔌 |
| `cmp.live` | component specs match live (`check:live`, needs `design-kit/reference/live`) | blocker | 🔌 |

---

## Manual checks

`assets/checklist.md`. They do not automate, and pretending they do produces a green report on a
bad design. Recorded as `manual.*` findings in the same shape.
