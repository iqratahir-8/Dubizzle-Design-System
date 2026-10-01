---
name: design-forms
description: >-
  Design forms for dubizzle Egypt — Post an Ad, login and sign-up, edit profile, change
  password, report ad, filters, contact and portal forms: layout, labels, required/optional,
  input types and mobile keyboards, choosing radio vs select vs chips, validation timing, error
  placement, multi-step flows and review pages. Use whenever a design has an input, when
  someone says "form", "fields", "validation", "error state", "post an ad flow", "sign up",
  "which control should this be", and before design-qa on any screen that collects data.
---

# Forms — dubizzle Egypt

**Order of authority:** live captures (post-ad flow `post-category` → `post-details` →
`post-details-filled`, `edit-profile`, `settings-privacy`, login dialog) → measured components
→ this skill. Use the measured parts: `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`,
`Chip` (`segment`), `MultipleChoiceDropdown`, `Button`. Copy for labels and errors: `design-copy`.

## Measured field (don't restyle it)

`Input` = live's edit-profile field: **48px tall, 1px `--gray-02` border, `--radius-md`,
text 1.6rem**, 12px inset, label 1.4rem/600 above, 0.4rem label gap; focus border
`--gray-04`; error border `--red-05`; disabled `--gray-01` background. 1.6rem also keeps iOS
from zooming. Input and the button beside it share one height (4.8rem).

**Known gap to fix when touching `Input`:** the error text is not linked to the field
(`aria-describedby`), and there is no hint slot. A new form needs both — propose the change
to the component, don't work around it per screen.

## Layout

1. **One column.** Only tightly related pairs share a row (year + mileage).
2. **Labels above fields** — fastest to scan, and they survive long Arabic labels and RTL.
3. Field width matches the expected answer: narrow for year, mileage, OTP; full for title,
   description.
4. Group with headings or `fieldset` + `legend` by the user's model of the thing: category →
   details → photos → price → location → contact.
5. Primary button at the end, start-aligned; on mobile it stays reachable above the keyboard.

## Ask less

- Every field must earn its place. Ask once; **pre-fill what's known** — account phone and
  name, last-used location, details from a previous ad (WCAG 2.2 3.3.7 Redundant Entry).
- Required vs optional: **mark the optional ones `(optional)`**, no asterisks. On a long
  category form where both kinds are many, mark both. Pick one convention per form and keep it.

## Input types and keyboards

| Data | Markup |
|---|---|
| phone | `type="tel" autocomplete="tel"` — accept `010…`, `+20 10…`, spaces, dashes; normalise on the server. No mask. |
| email | `type="email" autocomplete="email" spellcheck="false"` |
| name | one field, `autocomplete="name"` |
| price, mileage, year | `type="text" inputmode="numeric"` — **not** `type="number"` (wheel/arrow changes values). Unit `EGP` / `km` outside the field; accept it if typed. |
| password | `autocomplete="current-password"` / `new-password`, Show/Hide toggle, rules shown before typing, paste allowed, no "confirm password" |
| OTP | `autocomplete="one-time-code" inputmode="numeric"`, paste allowed |
| plate, VIN, codes | `spellcheck="false"`, `dir="ltr"` inside Arabic UI |

Keep fields in a real `<form>` with `<label for>`, stable `name`/`id`, so autofill works.

## Choosing the control

| Situation | Control |
|---|---|
| one of 2–5 short options, a default makes sense (New/Used, Rent/Sale) | `Chip` segment |
| one of up to ~6 options that must be read | `Radio` group in a `fieldset`, nothing pre-selected for a real question |
| one of ~7–15 | `Select` |
| one of many (car make/model, area, compound) | searchable list — as live does for location (`LocationDropdown` / `MobileLocationPage`) |
| several of a set | `Checkbox` group / `MultipleChoiceDropdown`, never a multi-select listbox |
| on/off setting that applies immediately | `Toggle` (as live Notifications) |
| a date people know | day / month / year fields; a calendar only for near dates, always with typing |

Defaults are fine for filters and settings; never pre-answer a question the user should think about.

## Validation

- **Don't validate while typing.** Validate a field on blur once it has a complete entry;
  clear the error the moment it's fixed. The server always validates too.
- **Don't disable Submit** until the form is valid — people think it's broken. Let them submit,
  then show what's wrong. Disable only after the click, to stop a double submit.
- On submit with errors:
  1. an error summary at the top (`There is a problem`) listing each error as a link to its field;
  2. focus moves to the summary;
  3. the same message next to each field, **between label and input**;
  4. red border + text (+ icon) — never colour alone; border colour changes, width never does;
  5. everything the user typed stays.
- Field markup: `aria-invalid="true"`, `aria-describedby` → hint and error, the error starts with
  a visually hidden "Error:". Use `novalidate` so the house pattern replaces browser bubbles.
- Character limits: let people type past the limit, then say `You have 12 characters too many`.
  Show the count under the field.

## Long forms — Post an Ad

- Steps that follow the live flow: category → subcategory → details → photos → price/location →
  review. Each step: a specific heading, a Back that keeps data, a `Continue` button.
- Category decides the fields (a car asks make/model/year/mileage; a flat asks area/beds/baths)
  — reveal only what applies.
- **Save the draft** as the user goes; confirm before discarding input.
- End on a **review page** with a `Change` link per item that returns to review afterwards;
  skipped optional answers show `Not provided`.
- Photos: show per-photo upload progress, a reorder method that works without drag (move
  up/down — WCAG 2.5.7), and say the minimum/maximum count up front.
- **Never publish in captures or tests** — the "every step, never publish" rule (`PROGRESS.md` §3).

## Login and account

- Login errors don't reveal which of email/password was wrong; clear the password field.
- No puzzles or transcription for authentication (WCAG 2.2 3.3.8): paste, password managers,
  OTP autofill, Google/Apple sign-in where live has them.
- Don't ask for email or phone twice — confirm by code.

## Forms checklist

- [ ] One column, labels above, widths fit the answer
- [ ] Only needed fields; known data pre-filled; optional marked consistently
- [ ] Right `type` / `inputmode` / `autocomplete` on every field
- [ ] Control chosen by the table above
- [ ] Errors: blur + submit, summary + inline, linked by `aria-describedby`, input kept
- [ ] Submit never disabled for validation
- [ ] Every state drawn: empty, filled, focus, error, disabled, loading (`design-interaction`)
- [ ] Copy checked with `design-copy`; Arabic layout checked with `rtl-arabic`

## Sources

Read first-hand (publishers' GitHub sources): GOV.UK Design System components (text input,
error message, error summary, radios, checkboxes, select, date input, character count,
password input, button) and patterns (validation, question pages, phone numbers, dates,
passwords, check answers) · WCAG 2.2 Understanding 3.3.7, 3.3.8 · web.dev sign-in, sign-up,
payment and address form best practices · Owl-Listener designer-skills `form-design`.
Via search only: Baymard (inline validation, multi-column forms, required/optional, field
widths), NN/g placeholders and dropdowns, Penzo label eye-tracking, Adam Silver Form Design
Patterns, Smashing on disabled buttons. Where they conflict (blur vs submit validation, error
above vs below the field, masking), this skill states its choice above.
