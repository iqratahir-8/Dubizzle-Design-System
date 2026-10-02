---
name: design-interaction
description: >-
  Specify how dubizzle Egypt screens behave — every state of every control (hover, focus,
  pressed, disabled, loading, selected, error), feedback timing, loading (skeleton vs
  spinner), touch targets, dialogs and sheets, destructive actions (undo vs confirm),
  progressive disclosure, listings pagination, sticky CTAs, gestures. Use whenever a design
  has anything clickable, whenever someone asks "what happens when…", "what are the states",
  "loading state", "confirm dialog", "should this be a modal", "infinite scroll", and before
  design-qa. Web desktop, mobile web and the agency portal.
---

# Interaction — dubizzle Egypt

A screen is not designed until every state a user can reach is drawn. The most common
generated-UI gap is a control with a default and a hover and nothing else.

**Order of authority:** live dubizzle (captures, `docs/LIVE-MEASUREMENTS.md`) → `RULES.md` →
this skill's general rules. When a rule below disagrees with what production does, the
production behaviour wins and the difference goes to `docs/PROPOSALS.md` as a suggestion,
never silently into a component.

## 1. States — the minimum set

Every interactive element specifies **default, hover, focus-visible, pressed, disabled**,
plus **loading, selected, error** where they apply. Write them as a table in the design.

| State | dubizzle rule |
|---|---|
| hover | Colour/border/shadow change only, `0.15s` (`RULES.md` §Motion). **Never `scale()`**. Gate hover styles with `@media (hover: hover)` so phones don't get stuck hover. |
| focus-visible | `:focus-visible` outline, appears instantly (no fade), offset from the edge. Only 1 of 41 component stylesheets defines focus today (`RULES.md` §4b) — every new component ships one. Reserve the outline space so focusing doesn't shift layout. |
| pressed | Darker step of the same token, not a new colour. |
| disabled | Three channels: token-reduced contrast, `cursor: not-allowed`, native `disabled`/`aria-disabled`. Disabled inputs use `--gray-01` background (measured, `Input.module.css`). |
| loading | Button keeps its label, adds an indicator, blocks a second submit. |
| selected | Never colour alone — add weight, a check, or `aria-pressed`/`aria-selected`. Chips: `Chip` `quick`/`filter`/`segment` already have measured selected states (`LIVE-MEASUREMENTS.md` §Chips). |
| error | Border to `--red-05` (measured), message under the field. Border **colour** changes, never border **width**. |

Interaction states raise contrast relative to rest, never lower it.

## 2. Timing and feedback

- **≤100 ms** feels instant — just show the result. **≤1 s** keeps flow — no indicator needed.
  **>1 s** show progress. **>10 s** show percent-done and let the user do something else
  (Nielsen's response-time limits).
- Acknowledge every action in **under 400 ms** (Doherty threshold): show the pressed or
  loading state immediately even if the result is slower.
- Budget **INP ≤ 200 ms** (web.dev, p75 mobile) for filter toggles and the favourite heart —
  this product runs on low-end Android.
- **No flashing loaders:** wait 150–300 ms before showing a spinner/skeleton; once shown, keep
  it ≥300 ms.

## 3. Loading — skeleton or spinner

| Content | Use |
|---|---|
| Listing grid / list, ad detail, chat inbox, search results | **Skeleton shaped exactly like the real card** (`AdCard`, `AdListCard`) — no layout shift. `RULES.md` forbids shimmer that isn't the real loading card. |
| Save, post ad step, login, pay, send | Spinner in the button (loading state). |
| Photo upload in Post an Ad, export | Determinate progress (percent), per photo. |

## 4. Optimistic UI vs waiting

- **Optimistic** for cheap, reversible actions: favourite, mark chat read, follow. Update at
  once; on failure roll back and say so.
- **Wait for the server** for anything with money or publication: post ad, pay, buy package,
  republish, delete ad. Never fake success there.

## 5. Destructive actions — undo before confirm

- **Reversible** (remove favourite, delete saved search, clear recent searches): act
  immediately, show a toast with **Undo**.
- **Irreversible** (delete ad, delete account, remove agent in the portal): confirmation
  dialog that restates the consequence in a sentence, buttons named by the verb
  (`Delete Ad` / `Cancel`, never `OK` / `Yes`), initial focus on the **safe** action.
  Type-to-confirm only for account deletion.
- Use `Dialog` / `PortalModal` (measured) — don't style a new one.

## 6. Dialogs, sheets and overlays

Follow the WAI-ARIA modal dialog pattern:

1. On open, focus moves inside — first field, or the title (`tabindex="-1"`) when content is long.
2. Tab/Shift+Tab stay inside. **Esc closes.** A visible close button always exists.
3. On close, focus returns to the control that opened it.
4. `overscroll-behavior: contain` on sheets and drawers so the page behind doesn't scroll.

**No modal by reflex.** A modal is for a task that needs interruption (login, report ad,
confirm delete). Filters on mobile are a full-screen sheet because live does that
(`MobileFilters`); on desktop they are a sidebar (`layout.json` `searchPage`). Search and
location are dropdowns on desktop and full pages on mobile (`MobileSearchPage`,
`MobileLocationPage`) — copy that split, don't invent a third.

Tabs: arrow keys move between tabs. Combobox / search suggestions: `aria-expanded`, arrows
move, Enter picks, Esc closes, the list overlays content instead of pushing it down.

## 7. Touch, pointer, gestures

- Targets **≥24×24 CSS px** (WCAG 2.2 2.5.8, AA). Aim for **44×44** on mobile — `RULES.md`
  §4b. Label and box of a checkbox/radio share one hit area.
- **Nothing hover-only.** A card's quick action, gallery arrows, a "Call" reveal must also work
  by tap and keyboard.
- **Every drag has a single-pointer alternative** (WCAG 2.5.7): price range slider + number
  inputs; photo reorder in Post an Ad + move up/down buttons. Swipe galleries keep visible
  arrows. Auto-advancing carousels pause on hover and focus.
- Inputs at **1.6rem** on mobile (the measured `Input` already is) so iOS doesn't zoom. Never
  disable zoom. Allow paste into OTP and phone fields.
- A focused element must never sit hidden under the sticky header or the sticky contact bar
  (WCAG 2.4.11) — use `scroll-padding-top`/`-bottom`.

## 8. Decisions and disclosure

- Fewer options per decision (Hick's law). Show the core filters, put the rest behind
  "More filters" (`MoreFiltersPanel`, measured). Car: make → model → year, each revealing the next.
- Primary actions large and in thumb reach (Fitts's law). The mobile ad page's sticky
  Call / Chat / WhatsApp bar (`ContactBar`, measured) is the model; it clears the safe-area inset.
- **One primary button per view** (`RULES.md` §3).

## 9. Listings

- **Pagination** is what search ships (`Pagination`, measured) — keep it. Don't propose
  infinite scroll for results: it breaks comparing, the footer, the scrollbar and back
  navigation. "Load more" is a defensible proposal (Baymard favours it), but it is a change
  to a measured surface → `docs/PROPOSALS.md`.
- Filters, sort and page live in the **URL**. Back from an ad returns to the same scroll
  position in the results.

## 10. Toasts

- Auto-dismiss ≥5 s, pause on hover and focus, never the only way to reach an action.
- Skip a success toast when the result is already visible on screen.
- `Toast` carries **repo values, not measured** — say so if a design depends on it.
- Announce async results through a polite `aria-live` region.

## Deliver this with the design

A **state table** per interactive component (rows = states, columns = what changes, token
used, ARIA), the **loading choice** per region, the **destructive-action policy**, and focus
order for every overlay. `design-qa` checks the states exist (`cov.state`); this skill
decides what they are.

## Sources

Read first-hand: WCAG 2.2 Understanding 2.5.8, 2.5.7, 2.4.11 · WAI-ARIA APG dialog-modal,
tabs, combobox · Vercel Web Interface Guidelines · Hallmark `references/interaction-and-states.md`
· Impeccable `reference/craft-floor.md`. Via search only (pages blocked from the research
sandbox — re-verify before quoting as primary): NN/g response-time limits, skeletons vs
spinners, infinite scrolling; Baymard load-more vs pagination; Laws of UX (Doherty, Hick,
Fitts); web.dev INP; Material 3 state layers; Apple HIG 44pt.
