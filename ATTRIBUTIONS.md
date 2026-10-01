# Attributions

Third-party assets used by this design system, and what each licence asks for in return.

Not legal advice — this records what the licences say and how we satisfy them. If anything
here ships in a product with its own legal review, route it through that too.

---

## Icons

**dubizzle's own icons** — `design-kit/icons/` (587 icons)
Extracted from the production `dubizzle-maple` monorepo. dubizzle's property; no external
attribution applies. These are the first choice for any screen.

**Lucide** — ISC Licence
Requires the copyright notice and permission notice to be retained.

> Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather
> (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

**Font Awesome Free** — icons CC BY 4.0 · fonts SIL OFL 1.1 · code MIT
CC BY 4.0 requires **credit to Font Awesome** wherever the icons are used. Free tier only —
this repo has no Font Awesome Pro licence, so don't reference a Pro-only glyph.

> Font Awesome Free by @fontawesome — https://fontawesome.com
> Icons: CC BY 4.0 · Fonts: SIL OFL 1.1 · Code: MIT

**Material Symbols** (Google Fonts) — Apache Licence 2.0
Requires the licence notice to be carried with any distribution.

> Material Symbols by Google, licensed under the Apache License, Version 2.0.

In use (2026-10-01): the seven new settings icons in `icons/svg/` — `privacy`,
`notification-settings`, `change-password`, `offers-communications`, `recommendations`,
`chat-safety-tips` (six glyphs; the bell counts once). Source and licence per icon: `icons/registry.json`.
The `icons` skill records the licence of everything it adds there.

---

## Agent skills

**Emil Kowalski's skills** — all thirteen, MIT Licence: `animate`, `animate-expo`
(uninstalled), `animation-vocabulary`, `apple-design`, `ask-sonner`, `emil-design-eng`,
`find-animation-opportunities`, `improve-animations`, `mobile-native`,
`pick-ui-library`, `prototype`, `review-animations`, `write-swift` (uninstalled).

> MIT License. Copyright (c) 2026 Emil Kowalski. https://animations.dev/

**taste-skill** `output-skill` and `design-taste-frontend` (leonxlnx) — see that
repository for its licence terms.

MIT requires the copyright and permission notice to travel with the software, which is
why the licence text is kept at `.claude/skills/animate/LICENSE-emil`.

**icons** — uploaded by the user as `icons.skill` (v1.0.0, 2026-09-29), extended here to v1.1.0.
No licence file came with it; ask its author before redistributing it outside this repo.

## Where the credit has to appear

A product that ships any Lucide, Font Awesome or Material Symbols icon carries a visible
credit — an About/Credits screen, a footer legal link, or an open-source licences page.
This file is the source text for it. Shipping the icons with no credit anywhere does not
satisfy CC BY.

If a screen uses only `design-kit/icons/`, nothing is required.

---

## Fonts

**Proxima Nova** (Latin) and **GESS** (Arabic) are the brand typefaces, licensed to dubizzle.
They are not redistributable with this repo beyond the local capture and preview use in
`design-kit/assets/fonts/`. Don't publish them to a public CDN or ship them in an
open-source package.
