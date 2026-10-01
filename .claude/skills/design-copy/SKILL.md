---
name: design-copy
description: >-
  Write and check interface copy for dubizzle Egypt — buttons, labels, hints, errors, empty
  states, confirmations, toasts, loading text, prices, dates and numbers — in dubizzle's voice
  and without AI-sounding filler. Use whenever a design has words on it, when someone asks
  "what should this say", "write the error message", "empty state copy", "button label",
  "microcopy", "UX writing", "does this copy sound AI-made", and before design-review. English
  first; Arabic strings come from live or a translator, never invented.
---

# Copy — dubizzle Egypt

**Order of authority:** strings on live dubizzle → `design-kit/qa/product/copy.md`
(canonical strings, checked by `cpy.verbatim`) → `RULES.md` §4 → this skill.
**A string that exists on live is copied verbatim, never rewritten.** Pull it from
`design-kit/reference/live/` captures. Only new strings are written with the rules below.

## Voice

Direct, second person, imperative, short. dubizzle is a utility people use to buy and sell
quickly — copy gets out of the way. (`RULES.md` §4.)

- Verbs that do the job: `Post Your Ad`, `Call`, `Chat`, `Save search`, `Show packages`.
- Never: Get Started, Discover, Unlock, Elevate, Seamless, Effortless, Empower, Leverage,
  Revolutionise, "your journey", "the power of", delve, pivotal.
- No emoji in UI. No exclamation marks in system copy (never in an error). No jokes in
  errors, payment, deletion or account loss.
- No invented claims or social proof ("Join 10M+ sellers", "98% sell faster"). Real, sourced
  numbers or nothing.

## Casing — follow live, don't impose

Live mixes Title Case (`Post Your Ad`, `My Ads`, `Help & Support`) and sentence case
(`Change password`, `Special communications & offers`, `My ads settings`). The web's
"always sentence case" rule does **not** override that.

- Existing string → exactly as live has it.
- New string on a surface → match that surface's existing pattern (a settings page in
  sentence case, the header/nav in Title Case).
- Record any new canonical string in `design-kit/qa/product/copy.md`.
- Flag the inconsistency to the user as a content question; don't "fix" live strings.

## Buttons

1. Verb + object: `Delete ad`, `Save search`, `Call seller` — not `Submit`, `OK`, `Yes`, `Confirm`.
2. 1–3 words; add a word when it removes doubt (`Add another photo`).
3. Dialog buttons repeat the verb: `Delete ad` / `Keep ad` (people answer buttons without
   reading the question).
4. One primary per view (`RULES.md` §3). Many CTAs means the screen needs simplifying.
5. Same concept, same word everywhere — **ad** (not listing/post), **Chats**, **My Ads**. Keep
   a glossary; don't vary synonyms. Live is not consistent itself — the header says
   `Favourites`, the account menu says `Favorites` — so copy each surface verbatim and raise
   it as a content question rather than picking one.

## Labels, hints, placeholders

- Every field has a visible label. **The placeholder is never the label** — at most an
  example of the format (`e.g. 2019`).
- Hint: one short sentence, no full stop, no link.
- No colon after labels.
- Units sit outside the field and in the label/hint: `Price (EGP)`, `Kilometers`.

## Error messages

Structure: **what happened → how to fix it.** Specific to the failure.

| Failure | Write | Not |
|---|---|---|
| empty | `Enter a price` | `This field is required` |
| format | `Enter a mobile number, like 01012345678` | `Invalid phone` |
| range | `Price must be EGP 100 or more` | `Invalid value` |
| too long | `Title must be 70 characters or less` *(confirm the real limit)* | `Too long` |
| count | `Add at least 3 photos. You've added 1` | `Photos error` |

- Banned in errors: invalid, valid, please, sorry, oops, "you forgot", humour, `!`.
- Don't blame the user; say "we" only when dubizzle caused it.
- Never show codes (500, 404). System failure: one plain sentence + what happened to their
  input + what to do (`Something went wrong. Your ad is saved as a draft — try again`).
- Same wording in the error summary and next to the field.

## Empty states

Say what will appear here + one action to fill it. A different message per kind of empty:

| Kind | Example |
|---|---|
| first use | `No saved searches yet. Save a search to get alerts when new cars are posted` + `Browse cars` |
| no results | `No results for "corolla 2026" in Maadi` + `Remove filters` / `Search all of Cairo` |
| filters too narrow | name the filters, offer to clear them |
| failed to load | what failed + `Try again` |
| no permission (portal) | who can do it, how to get access |

The live favourites and saved-searches empty strings (`No favorites yet.`, `No saved
searches yet.`) are recorded in `docs/PROPOSALS.md` as unverified — check before reusing.

## Confirmations, toasts, success

- Prefer **undo** over a confirm dialog for reversible actions (`design-interaction` §5).
- Destructive confirm names the object and the consequence:
  `Delete "Toyota Corolla 2019"? Its views and chats will be lost. This can't be undone.`
- Toast: past tense, short, no "Successfully": `Ad saved`, `Search saved`. ≤2 lines on mobile,
  at most one action, never `Dismiss`. Anything the user must act on goes inline, not in a toast.
- Success that changes what to do next says so: `Ad submitted. We'll review it within 24 hours`
  *(confirm the real review time — don't invent it)*.
- Loading names the real operation: `Uploading 3 photos…`. Never fake progress.

## Numbers, prices, dates

- Prices: `EGP 3,200,000` — prefix, commas, no decimals, never `3.2M`, never `$` (`RULES.md` §4).
- Numerals, not words (`5 ads`). Ranges with an en dash `EGP 500,000–750,000`; open ranges
  `EGP 500,000 and up` (not `+`, `>`).
- Specs: `3 Beds · 2 Baths · 150 m²`.
- Time: relative when recent (`2 hours ago`), absolute after (`12 Mar 2026`). Never `03/04`.
- **Arabic digits and currency order are an open question** (Western vs Arabic-Indic, `EGP`
  vs `ج.م`): read them from the `.ar` captures, see `rtl-arabic`. Don't guess.

## Writing for translation (Arabic)

- Whole sentences with reorderable placeholders: `{count} photos`, never stitched fragments.
- Plurals through a plural-aware format — Arabic has six plural forms.
- Active voice, no idioms or slang, keep small words (the, then).
- Leave room: short strings grow most when translated (W3C/IBM: ≤10 chars can grow
  200–300%). Buttons and tabs must not wrap to two lines in Arabic (`design-review` `rev.labels`).
- Arabic copy comes from the live site or a translator. Claude does not invent Arabic UI strings.

## Check before handing over

- [ ] Every live string verbatim; new canonical strings added to `copy.md`
- [ ] No banned words, emoji, exclamation marks, invented numbers
- [ ] Every error says what and how; every empty state has an action
- [ ] Buttons are verbs; dialog buttons repeat the verb
- [ ] Prices, dates, specs in the formats above
- [ ] Anything unverified (limits, review times, Arabic) is flagged, not invented

## Sources

Read first-hand (from the publishers' GitHub sources): GOV.UK Design System (error message,
error summary, text input, button, check answers, problem pages) · Shopify Polaris content
(error messages, fundamentals, grammar and mechanics) · Mailchimp Content Style Guide
(voice, web elements, translation) · Impeccable `reference/clarify.md` · Owl-Listener
designer-skills `ux-writing`. Via search only: NN/g error-message rubric and empty states,
Material snackbars, Microsoft style guide, Atlassian messages, W3C/IBM text expansion.
