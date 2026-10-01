---
name: imagery-illustration
description: >-
  Choose, source and place imagery in dubizzle Egypt screens — listing photography, empty-state
  and error illustrations, avatars, banners, logos. Use when a screen needs a photo, an
  illustration, an empty state, a hero, or when asked to generate or pick images. Prevents
  stock photography and invented illustration styles from entering the system.
---

# Imagery and illustration

The fastest way to make a dubizzle screen look fake is to put a polished stock photo in it.
This is a classifieds marketplace: the photography is **user content**, and it looks like it.

## Photography — use the real thing

Ad images come from sellers with phones. They are uneven, variably lit, sometimes
watermarked, often shot in a driveway or a showroom. That texture is what makes a mock read
as dubizzle.

- **Source images from the captures.** `design-kit/reference/live/` holds 140+ frozen pages
  with their real listing photos inlined. Take images from the closest captured screen.
- **Never use stock photography** — no Unsplash, no Pexels, no AI-generated "listing photo".
  A crisp studio shot of a car is an immediate tell.
- **Never generate a photo of a real place, person or number plate.** Faces and plates in
  captures belong to real people; if one is prominent, crop or blur it.
- Aspect ratios and behaviour come from the captured card, not from your preference. Grid
  cards, list cards and the DPV gallery each crop differently — measure the one you're using.
- Every `<img>` carries `alt`. Decorative ones get `alt=""`, but the attribute exists.

## Illustration — the style exists, the assets don't

Production uses illustration in empty states and errors: soft blue-tinted line work with
pale cloud shapes and a muted palette. Two captured examples to work from:

- **404** (`not-found` capture) — the magnifier with "Oops!"
- **Agency portal Leads empty state** (`portal-leads`) — a figure beside a document

`design-kit/icons/` has **no illustration category**. So:

- **Extract from a capture** when you need one. The captures are frozen HTML with the assets
  inlined — pull the SVG or image out of the real page.
- **Do not draw a new illustration style**, and do not generate one with an image model. A
  second visual language inside one product is worse than a missing illustration.
- If the system has no illustration for the state you're designing, **say so** and use the
  nearest captured one, or ship the state without art and flag it.
- New illustration that a designer actually authors goes through `docs/PROPOSALS.md` like any
  other new value.

## Avatars, logos, banners

- **Avatars**: a photo if there is one, otherwise the initial on `--red-02` with `--red-05`
  text. Circular, `--radius-full`.
- **Agency and brand logos** keep their own colours — they are not recoloured to the palette,
  and they sit on white.
- **Promo banners** are supplied artwork, frequently Arabic-first. Measure the slot
  (`PromoBanner`: 390×150 mobile, 1280×180 desktop, no dots) and treat the image as content.
- **Never redraw a partner logo or invent one.** If a mock needs an agency that doesn't
  exist, use one from `fixtures.json`.

## Empty states

An empty state is illustration + a sentence + one action. The sentence says what is missing
and what to do, in dubizzle's voice — direct, second person, no apology and no exclamation
beyond the brand's own "Oops!".

Only two empty states have ever been captured (404, portal Leads). Before designing one,
check whether live has it: `grep -ril "empty\|no results\|oops" design-kit/reference/live/`.
If it exists on live and isn't captured, capture it — that is a measurement, not an invention.

## Generated photos for banners and heroes

When a **composed surface** (campaign, landing, seasonal, app-download) needs a photo that no capture
has, use **`design-prompt-images`**: Egypt-realistic prompts without the glossy AI look, text-free
plates with HTML copy, the 1280×180 / 390×150 crops, an AI-look review checklist and provenance.
Everything above still holds — never listing photos, illustrations, logos, real people or plates.

## The rule

Photography comes from captures. Illustration comes from captures. Anything you cannot
source from a capture is new, and new things get named as new.
