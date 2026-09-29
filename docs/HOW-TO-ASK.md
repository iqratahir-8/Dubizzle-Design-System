# How to ask the design agent for these screens

This file is the user-facing guide to the design system in this repo. It lives here so it
travels with the project: any Claude account, any machine with this folder, same instructions.

There is no syntax to learn. Describe the design work in plain English — the skills in this
repo (`SKILL.md`, `.claude/skills/responsive-design`, `live-capture`, `token-check`) trigger on
their own. What changes the result is **naming the screen you want to start from**: name one and
the work starts from a pixel-perfect capture of the real page; name none and it starts from
scratch.

## Start the servers (optional, but useful)

```bash
npm run kit
```

http://localhost:4321 — the design kit: tokens, components, icons, and
http://localhost:4321/templates/index.html, every page template with its measured difference
from the live site.

```bash
npm run dev
```

http://localhost:6006 — Storybook: **Templates → Pages** frames those same template files with a
desktop/mobile toggle; every component sits under Components / Layout / Mobile.

Both also start from the app's preview launcher (`.claude/launch.json`).

## What to say

| Ask | What the agent does |
|---|---|
| "Design a saved-search banner on the **property landing**, mobile only" | Copies `design-kit/templates/mobile/property-landing.html` and builds on it, composing anything new from the component library |
| "Add a compare toggle to the **cars search** page, desktop and mobile" | Both templates, built side by side, checked against the live screenshots |
| "Open the **Vehicles mega menu** and try a promo panel in it" | Starts from the `menu-vehicles` template, or from `<MegaMenu items={MEGA_MENUS}>` when it needs to open on hover |
| "Use the **list card**, not the grid one" | `AdListCard` with the right device and type (list price is charcoal; grid price is red) |
| "The home page changed on live — **recapture** it" | The `live-capture` skill: re-snapshot, verify against a fresh screenshot, rebuild templates and stories |
| "What's missing from the Property vertical?" | Reads `docs/PAGE-COVERAGE.md`, the audit of live navigation against what we hold |
| "Does this CSS follow the rules?" | `token-check`: off-palette colours, invented radii, and the AI-slop patterns in `RULES.md` |
| "Store the components you find in this page" | Measures them on live, builds React + kit versions, adds stories and a parity pair |

Two things worth saying out loud when they matter:

- **"mobile only"** or **"mobile and desktop"** — the default is both, side by side.
- **"prototype"** or **"production React"** — a throwaway HTML screen and a library component are
  different deliverables.

## Screens that are not in the repo

45 templates are built from **logged-in captures** and stay on the machine that captured them —
chat, my ads, edit profile, settings, packages, the user menu, the whole post-an-ad and upsell
flow, and every agency-portal screen. They hold real people's names and messages, so
`.gitignore` keeps them out of git by design. In a fresh clone they simply do not exist.

Two things follow:

- **After cloning, run `npm run build:templates`.** Every screen with a hand-built source
  (`design-kit/templates/_pages/`) is generated from it, and the ones with a local capture are
  regenerated from that instead.
- **`chat` has a shareable version.** Its inbox list is measured from the live screen, and
  everyone in it is a fixture. Use it for chat-screen work in any session, on any account. The
  **thread on the right is a proposal, not a measurement** — the capture shows the empty state,
  because the agent never opens a real conversation. Say so in any ticket that uses it.

## The screens you can name

47 public page templates, each in desktop and mobile. You don't have to use the exact name —
"the rent listing" or "the compound page" is enough.

- **Home & verticals:** `home`, `motors`, `property-landing` (`/en/realestate/`), `car-finance`
- **All-ads listings:** `vehicles-listing`, `properties`
- **Motors search:** `search` (cars), `search-cars-model`, `search-motorcycles`, `search-trucks`
- **Property search:** `search-property`, `search-property-rent`, `search-property-commercial`,
  `search-property-vacation`, `search-property-land`, `property-area`, `property-compound`
- **Goods:** `search-mobiles`
- **New Cars:** `new-cars`, `new-cars-brand`, `new-cars-model`, `car-comparison`,
  `car-comparison-result`, `electric-cars`, `car-finance-bank`
- **Ad detail:** `ad-detail` (car), `ad-detail-property`, `ad-detail-property-rent`,
  `ad-detail-mobile-phone`
- **Profiles & directories:** `seller-page` (dealer), `agency-page`, `property-agencies`
- **Chrome states:** `menu-vehicles`, `menu-properties`, `menu-mobiles`, `menu-jobs`,
  `menu-furniture`, `menu-electronics`, `menu-more-categories`, `menu-vehicles-car-care`,
  `location-dropdown`, `search-suggestions`
- **Mobile pages:** `m-search-overlay`, `m-search-suggestions`, `m-location-page`
- **Other:** `login` (dialog), `not-found`

The authoritative list is `design-kit/templates/live-templates.json`, rendered at
http://localhost:4321/templates/index.html.

### Local-only screens

The signed-in screens — My Ads, chats, Edit profile, settings, business packages, the whole Post
an Ad flow, upselling, the user menu and the mobile account page — are built from **redacted**
logged-in captures. Those stay on the machine that made them and are never committed, so on a
fresh clone they have to be recaptured:

```bash
npm run capture:login
```

Sign in yourself in the window that opens (the agent never types credentials), confirm with
`npm run capture:login -- --check`, then ask for the account captures.

## Using the components in code

```bash
npm install && npm run build
```

```tsx
import { Header, MegaMenu, MEGA_MENUS, AdCard, AdListCard, Chip, ContactBar } from 'dubizzle-design-system';
```

`Header` carries the category strip and its mega menus; `MEGA_MENUS` is the live menu content.
Every component is measured against the live site — see `docs/LIVE-MEASUREMENTS.md` — and the
React and HTML versions are kept identical by `npm run check:parity`.

## Asking for a re-capture after a dubizzle release

| Task | Command (or just ask) |
|---|---|
| Public pages | `npm run capture:rendered -- home motors …` |
| Dropdowns and overlays | `npm run capture:states` |
| The whole mega menu content | `node scripts/extract-mega-menus.mjs` |
| Signed-in screens | `npm run capture:login`, then `npm run capture:account` |
| Rebuild templates + stories | `npm run build:templates` |
| Verify | `npm run check:captures`, `npm run check:templates`, `npm run check:parity` |

## If the agent seems not to know any of this

Say "read PROGRESS.md" — it is the handoff file, kept current, and it points at everything else:
`RULES.md` (the binding constraints), `docs/COMPONENT-INVENTORY.md` (what exists and what's next),
`docs/LIVE-MEASUREMENTS.md` (every measured value), `docs/PAGE-COVERAGE.md` (what's captured),
`docs/DECISIONS.md` (why things are the way they are).


## The agency portal prototype

The eight portal sections plus three sub-screens are a clickable prototype built from real
captures. Start at **Dashboard** and use the sidebar.

- Kit: `npm run kit`, then open `http://localhost:4321/templates/desktop/portal-dashboard.html`
- Storybook: `npm run dev` → Templates → Pages → Agency portal — …

Say **"rebuild the portal prototype"** after a re-capture, and **"check the prototype"** to
run `npm run check:prototype` (privacy, dead links, and a real click-through of every route).
Desktop only: dubizzle Pro has no mobile layout.

**What works in it (2026-09-22):** sidebar drawer; Leads tabs and Date Range; working
filters on every page (dubizzle's real option lists); the **ad details drawer** (click any
Agency Ads card; five tabs); and **every popup** — More Filters, Request Brand/Model, the
credits dropdown, the ⋯ and ⋮ action menus, Change Agent, Invite agent, Sort by, Export
Leads, Purchase Lead. Cancel, a click outside, or Escape closes them. Confirm buttons do
nothing on purpose: those actions were never performed, so there is no screen after them.

## Popups and modals you can name

Consumer: `login-dialog`, `dpv-phone` (login gate), `dpv-report` / `dpv-report-form`,
`dpv-gallery`, `sort-menu`, `m-filters` (mobile), `save-search`, `dpv-details-expanded`.
Portal: `portal-ads-credits`, `portal-ads-more-filters`, `portal-ads-request-brand`,
`portal-ads-actions`, `portal-ad-assign-agent`, `portal-agents-invite`,
`portal-agents-sort`, `portal-agents-actions`, `portal-leads-export`,
`portal-vip-purchase`, `portal-leads-daterange`. All in Storybook → Templates → Pages and
in the kit's templates index. There is no live toast to capture: every dubizzle toast
follows a real action (see PROGRESS item 35).

## Checking a component against live

Say **"check it against live"** to run `npm run check:live` (needs Storybook + the kit
running). It compares each component with the frozen live capture — values, text position
and a pixel diff — and writes a live / ours / diff picture per component to
`design-kit/reference/live/screens/_live-check/`. After a dubizzle release: re-capture,
then run it; anything that moved shows up in red.

## Checking a design and handing it over

Two skills, used in this order:

| Say | What happens |
|---|---|
| "**QA** the favourites page" / "is this design ready?" / "check the states" | `design-qa`: builds the case matrix (states × platforms × breakpoints), shows it to you, then runs the checks and writes `design-kit/qa/report/report.html` — verdict PASS, PASS WITH WARNINGS or BLOCKED. `npm run qa -- --scope favourites` does the same. |
| "**Design** a new feature" (any `feature-design` ask) | Ends with a **hand-off pack**: every screen and state registered, draft `flows.json` and `deliverable.json`, and a first QA verdict shown with the design — so "make the deliverable" afterwards is one step. |
| "**Make the deliverable** for favourites" / "handoff for the devs" | `design-deliverables`: runs QA first and stops if it is BLOCKED; otherwise asks you a short intake table, then builds **one self-contained HTML file** (screens with redlines and stable node ids, state screens, tokens, accessibility, acceptance criteria, open questions) into `design-kit/deliverables/<feature>/dist/`. It is stamped INTERNAL — the fonts are licensed. |

Things to know:

- **Only screens we designed can block.** The 55 frozen live templates are reported as notes, because a
  snapshot of production can't be "fixed". A revamp counts as designed (`authored`).
- **Empty is always required.** A list screen with no empty state is BLOCKED even if nobody mentioned it.
- **English only** for now (Arabic is parked). Say "include Arabic" to switch those checks on.
- You own `design-kit/qa/product/{copy,flags,roles}.md` and `waivers.json`. The agent proposes a waiver;
  it never grants one.
- After a re-capture: `npm run qa:registry` refreshes the screen list without losing your edits.

