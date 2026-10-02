---
name: design-prompt-images
description: >-
  Write image-generation prompts for dubizzle Egypt that produce photos which do not look
  AI-made — campaign and landing heroes, promo-banner plates, app-download and seasonal visuals,
  mock-up placeholders for composed surfaces — and review the output before it is used. Covers
  the prompt template, Egypt-realistic settings, banned "glossy" vocabulary, model choice (GPT
  Image, Nano Banana, FLUX, Midjourney, Seedream, via Higgsfield), text-free plates with HTML
  copy, crops for the 1280×180 / 390×150 slots, the AI-look checklist, and provenance. Use
  whenever someone says "generate an image / banner / hero / campaign photo", "write a prompt for
  Midjourney / GPT Image / Nano Banana", "make it not look AI", or before any higgsfield-generate
  call for dubizzle. Never for listing photos or illustrations.
---

# Prompting images that don't look AI-made — dubizzle Egypt

## First: is generation allowed here?

`imagery-illustration` and `RULES.md` §4d decide that, and they win.

| Need | Generate? | Instead |
|---|---|---|
| **Listing / ad photos**, seller content, "real seller" stories, testimonials, before/after | **Never.** Deceptive, and the fastest tell. | Real images from `design-kit/reference/live/` captures |
| **Empty-state and error illustration** | **Never** — a second illustration style is worse than none | `design-kit/illustrations/`, or extract from a capture |
| **Partner / agency / brand logos**, real people, real number plates | **Never** | `fixtures.json` agencies; initials avatars |
| **Promo banner in production** | Normally **supplied artwork** (often Arabic-first) | Use the supplied file; generate only a *mock* plate, labelled |
| **Campaign / landing / seasonal hero, app-download band, composed-surface photo** | **Yes**, as a proposal | This skill |
| Mock placeholder for a composed surface in a design | **Yes**, labelled "generated placeholder" | This skill |

Every generated image is a **proposal**: log it in `docs/PROPOSALS.md` and say so to the user
(`PROGRESS.md` item 41). Generated imagery never ships on a measured surface.

## The prompt template

Slot order matters — models weight the start of the prompt most. Write prose, 40–120 words.

```
1 CANVAS & USE     Photorealistic 16:9 web banner photo for a classifieds marketplace in Egypt;
                   the left 40% kept as quiet negative space for an HTML headline.
2 CAPTURE          One frame only: "candid photo taken on a recent smartphone"
                   OR "35mm documentary photo, eye level".
3 SUBJECT + ACTION Who/what, doing what, framing, gaze, hands:
                   "a man in his 40s photographing a used silver hatchback with his phone,
                   looking at the screen, not at the camera; full body, feet visible".
4 SETTING          5–12 concrete local nouns (see references/egypt-realism.md):
                   "residential street in Giza, sand-coloured 5-storey apartment blocks, AC units,
                   satellite dishes, cars parked on the right, dusty kerb".
5 LIGHT & TIME     "late-afternoon low sun from the left, slight haze, natural colour, no grading".
6 TEXTURE          "dust on the bonnet, scuffed alloy, creased cotton shirt, visible skin pores".
7 PALETTE          "muted warm neutrals; red only if it occurs naturally".
8 CONSTRAINTS      Short, targeted: "No text, no logos or badges, no readable number plates,
                   no watermark."
9 EDIT LOCK        (edits) "Change only X. Keep identity, pose, angle, lighting, framing."
```

**Worked example (property campaign hero, desktop):**
> Photorealistic 21:9 web banner photo for a property marketplace in Egypt; the right 45% kept as
> calm out-of-focus wall for an HTML headline. Candid photo taken on a recent smartphone. A
> couple in their 30s seen from behind, walking up a paved path towards a beige stucco townhouse
> in a gated compound, the woman pointing at a balcony. Palms, a low hedge, a parked compact car,
> a guard booth in the distance. Late-afternoon sun from the left, slight haze, natural colour,
> no grading. Visible paving cracks, dust on the car. No text, no signage, no logos, no readable
> number plates.

## Rules

**Realism**
1. Say **"photorealistic"** and give **one** capture frame (smartphone or 35mm documentary).
   Stacked camera specs conflict; detailed lens numbers are read loosely.
2. **Ban the glossy vocabulary:** stunning, award-winning, 8K, 4K, ultra-detailed, hyper-realistic,
   cinematic, dramatic, epic, masterpiece, editorial, magazine-quality, perfect. These pull towards
   the polished render that reads as AI (OpenAI's own guide: avoid studio polish, cinematic
   lighting, dramatic colour grading). Most prompting skills online add them — don't.
3. **Ask for real texture:** pores, wrinkles, fabric wear, dust, scuffs, uneven paint;
   "honest and unposed, no retouching".
4. **Side or back light** (low sun, overcast) — flat frontal light makes plastic skin.
5. **Scene density, not adjectives:** 5–12 concrete nouns + 2–4 light/material notes.
6. **Off-centre, imperfect framing:** partial occlusion, foreground clutter, slightly tilted horizon.
   No perfect symmetry.
7. **Natural colour, no HDR**, no teal-and-orange grade.

**People**
8. **No identifiable faces by default:** backs, three-quarter-away, distance, hands with a phone.
   Avoids likeness, consent and the uncanny-face tell.
9. **Activity, not posing:** inspecting, negotiating, carrying, driving — never "smiling at camera".
10. Spell out framing, gaze and hand action; keep hands small, occluded or out of frame where you can.
11. Egyptian dress and families, modest everyday clothing; women with and without hijab is realistic;
    **never Gulf dress as "Arab" shorthand** (`references/egypt-realism.md`).

**Brands, plates, text**
12. **No text in the image — ever.** Headlines, prices, CTAs and Arabic go on top as HTML
    (translatable, zoomable, RTL-ready; WCAG 1.4.5). Prompt for a text-free plate and reserve the
    copy area in the prompt.
13. **No brands:** "no logos, no car badges or emblems, no brand labels". Models invent near-miss
    badges — a tell and a trademark risk. Vehicles are "a generic compact sedan typical of Egyptian
    roads", never a make or model. Phones are a generic dark slab or show dubizzle's own UI,
    composited afterwards.
14. **Plates never legible:** angle them away or "plain blank plate". Never generate Egyptian plate
    characters.
15. No real compound, developer or landmark names in the prompt — and keep search grounding off.

**Banners and crops**
16. **Generate at a supported ratio, crop to the slot.** Desktop PromoBanner **1280×180 (~7:1)**,
    mobile **390×150 (2.6:1)** (`docs/LIVE-MEASUREMENTS.md`). GPT Image caps at 3:1 — generate 21:9
    or 3:1 and crop; Nano Banana 2 / Pro offer 4:1 and 8:1. Keep the subject inside the band both
    crops share.
17. **RTL:** the copy side mirrors in Arabic. Don't flip a photo with cars, traffic or writing — make
    a second plate with the copy space on the other side.
18. Composed surfaces only: never full-bleed photography behind dense text (`RULES.md` §Layout).

**Process**
19. **Write the purpose into the prompt** ("for a used-car marketplace campaign banner").
20. **Exclude positively** for Gemini, FLUX and Midjourney ("an empty quiet street", not "no cars");
    keep avoid-lists short and aimed at a known bad default.
21. **Edit, don't re-roll:** at ~80% right, change one thing per turn and repeat the preserve-list.
22. **Draft cheap, finish high:** low quality / 1K to explore; high / 2K for finals.
23. **3–4 genuinely different variants** (composition or angle) for any hero, not synonym swaps.
24. **Post-process like a photo:** slight grain, a crop, a small exposure fix. Keep the original file.
25. **Review every output with the checklist** (`references/ai-look-checklist.md`) at 100% zoom,
    faces and hands first. Someone other than the prompter signs off on cultural fit.
26. **Record provenance** for every kept image (below).

## Model choice

Full notes: `references/models.md`.

| Job | First choice | Why |
|---|---|---|
| Photoreal campaign hero / banner plate | **GPT Image 2** (Higgsfield default) | Best instruction following; responds to "photorealistic, candid, smartphone" |
| Ultra-wide banner (4:1, 8:1), multi-reference consistency, iterative edits | **Nano Banana 2 / Pro** | Native wide ratios, up to 14 references, conversational edits |
| Precise single edit on an existing plate | **FLUX Kontext** / Nano Banana edit | One change, rest preserved |
| Only if a human will paste it | **Midjourney V7** with `--style raw --stylize 0–50` | No API; glossiest default — always raw, low stylize |
| Realistic skin and light | **Seedream** | State "Egypt" explicitly — defaults towards an East Asian look |

**Running it:** use `higgsfield-generate` (CLI) or the Higgsfield MCP — the MCP currently **needs
reconnecting** and the CLI is installed and signed in **by the user** (never run its installer).
Pass this skill's prompt as written; don't let a wrapper add "cinematic" or "8K".

## Provenance and labelling

For every image kept, record in the design's notes (and the `docs/PROPOSALS.md` row): model and
version, full prompt, seed (if any), reference images, date, and the human edits made. Don't strip
C2PA / SynthID metadata on purpose; re-encoding removes C2PA, so keep originals.
Label as "AI-generated" anything that could be read as a real person, place, event or listing. No
real people or lookalikes, no trademarks, never presented as inventory.

## Hand-off checklist

- [ ] Allowed by the table above; logged in `docs/PROPOSALS.md` and said out loud
- [ ] Prompt follows the template; no glossy words; one capture frame
- [ ] No text, logos, badges, legible plates, identifiable faces in the image
- [ ] Copy is HTML over a reserved area; both crops (1280×180, 390×150) and the RTL plate checked
- [ ] AI-look checklist passed at 100%; cultural fit signed off
- [ ] Provenance recorded

## Sources

[read] OpenAI cookbook — GPT Image 2 prompting guide, high input fidelity · Google Gemini cookbook —
Nano Banana quick-start (models, ratios, references) · Black Forest Labs FLUX.2 repo and model card ·
agent skills reviewed for structure (and their glossy defaults): runcomfy `ai-image-generation`,
`nano-banana-2`; skillsforge `midjourney-replicate-flux`; agency-agents `image-prompt-engineer`;
sanky369 `image-generation`; inference-sh `product-photography`; wuyoscar `gpt-image` craft.md (the
most useful). [snippet] Google Vertex Gemini image best practices; Gemini 2.5 Flash Image and Nano
Banana Pro prompting posts; Imagen prompt and negative-prompt pages; Midjourney docs and terms;
Seedream prompt guide; Kamali et al. 2024 "How to Distinguish AI-Generated Images from Authentic
Photographs"; 2025 perception study (faces and hands ≈62% of cues); C2PA / SynthID announcements; EU
AI Act Art. 50; Egypt SCMR advertising rules; Egypt vehicle-plate and car-sales sources. Re-check
[snippet] items before quoting them as primary.
