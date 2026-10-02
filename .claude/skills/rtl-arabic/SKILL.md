---
name: rtl-arabic
description: >-
  Build, capture and verify the Arabic / RTL side of dubizzle Egypt. Use whenever a screen
  must work in Arabic, when the ask mentions RTL, Arabic, العربية, bidirectional text, GESS,
  or mirroring, and as a required check before calling any new screen done — dubizzle Egypt
  is bilingual and the Arabic side has never been verified.
---

# Arabic and RTL

**Start from the honest position: no Arabic screen in this system has ever been captured or
verified.** `RULES.md` says to use logical properties, the GESS font is shipped, and
`fixtures.json` carries Arabic content — but not one rendered Arabic page has been measured.
Any claim that a component "works in RTL" is untested until you test it.

Treat that as the first thing to fix, not a footnote. Arabic is not a localisation pass on
an Egyptian marketplace; for much of the audience it is the product.

## Capture the Arabic side first

Every dubizzle page has an Arabic twin. The language switch in the header (`العربية`) leads
to it — the URL is usually the same path with `/ar/` in place of `/en/`.

```bash
# confirm the route exists, then capture it like any other page
npm run capture:live -- <name>     # add /ar/ entries to the capture manifest
npm run check:captures -- <name>   # same fidelity bar as the English captures
```

Capture at minimum: home, a listing page, an ad detail, the header states (mega menu,
location dropdown, search), and one form. Those cover every mirroring decision the system
makes.

## What to check, and what actually breaks

Mirroring is not "flip everything". Work through these:

| Thing | Rule |
|---|---|
| Layout direction | `dir="rtl"` on the root. Everything else follows from logical properties. |
| Spacing / position | `margin-inline-start`, `padding-inline-end`, `inset-inline-start`. **Never** `left` / `right` / `margin-left`. |
| Icons | Directional ones mirror (chevrons, back arrows, breadcrumb separators). Non-directional ones do **not** (clock, camera, phone, logos, brand marks). |
| Numbers | Prices and specs stay LTR inside RTL text. `EGP 3,190,000` does not reverse. **Western digits (3, not ٣) everywhere — decided D-020**; format with `ar-EG-u-nu-latn` (plain `ar-EG` produces Arabic-Indic). Live's Arabic-Indic card mileage is a defect. |
| Mixed strings | A title like `Mercedes-Benz E300 موديل 2018` is bidirectional. This is where rendering usually breaks — verify against the capture. |
| Typography | `--font-arabic` (GESS). Arabic has different vertical metrics: line-height tuned for Proxima Nova often clips ascenders or looks cramped. **Measure the Arabic line-height; don't reuse the Latin one.** |
| Text length | Arabic strings are frequently shorter than English, sometimes much longer. Buttons sized to English copy can look wrong either way. |
| Shadows / gradients | A direction-bearing gradient (`--cta-band-property` is `270deg`) and an offset shadow both need checking — production may or may not flip them. Measure. |

## Verifying

1. `npm run check:design` already errors on physical directions (`physical-direction` rule).
2. Render the component with `dir="rtl"` in Storybook **and** compare against the Arabic
   capture — the linter proves the properties are logical, not that the result is right.
3. Add parity pairs for the RTL variant, the same as LTR.

## What you may not do

- **Don't machine-translate UI copy.** Arabic dubizzle has real, specific wording. Take it
  from the Arabic capture or `fixtures.json`; if it isn't there, mark it as needing copy.
- **Don't assume a mirror is correct because it looks symmetrical.** Check it against the
  capture, which is the only source of truth.
- **Don't ship an "RTL-ready" claim you haven't rendered.** Say what you verified and what
  you didn't.

If a component genuinely cannot be verified because no Arabic capture exists yet, say so and
capture it. That is a short task and it removes the guesswork permanently.
