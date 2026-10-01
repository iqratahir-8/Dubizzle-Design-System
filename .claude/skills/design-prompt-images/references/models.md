# Model notes (as of 2026-10)

`[read]` from the provider's cookbook or repository; `[snippet]` from search summaries — re-verify.

## GPT Image 2 (OpenAI) — default for new photoreal work [read]
- Size: any multiple of 16 under 3840 px; aspect at most **3:1**; 2560×1440 is the reliable ceiling
  (above is "experimental"). Quality low / medium / high. Transparent PNG/WebP for cutouts
  (`background="transparent"`, "isolated, no shadow").
- No seed — iterate by **editing** ("change only X; keep everything else").
- `input_fidelity` is disabled on gpt-image-2 (already high). On gpt-image-1.5 the first reference
  image keeps the finest detail; use `input_fidelity="high"` for faces and logos.
- Responds strongly to "photorealistic", "candid", "smartphone photo"; reads detailed lens specs
  loosely. Strongest in-image text, but dubizzle never renders text in the image.
- Outputs carry C2PA and (since May 2026) SynthID [snippet].
- Higgsfield's default image model is GPT Image (version per the Higgsfield catalogue).

## Gemini image — "Nano Banana" (Google) [read quick-start; snippet guides]
- **NB2 Lite** `gemini-3.1-flash-lite-image` (fast, ≤3 references) · **NB2** `gemini-3.1-flash-image`
  (≤14 references, 512 px–4K, Search grounding) · **NB Pro** `gemini-3-pro-image-preview`
  (thinking, 4K).
- Ratios 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, plus **1:4, 4:1, 1:8, 8:1** on NB2 and
  Pro — the best fit for the 1280×180 PromoBanner.
- Multi-turn edits; narrative prose over keywords; state the purpose; **positive "semantic
  negatives"** ("an empty street"); photographic terms; step-by-step for complex scenes.
- Google's photoreal template: "A photorealistic [shot] of [subject], [action], set in [env].
  Illuminated by [light], creating a [mood]… Captured with [camera/lens], emphasizing [textures].
  [ratio]."
- **Keep grounding off** — it can pull in real brands and places. SynthID on every output.

## Imagen (Google) [snippet]
- Deprecated in the Gemini API (the cookbook points to Nano Banana); still on Vertex. Negative-prompt
  field takes nouns. Not recommended for new work.

## FLUX.2 (Black Forest Labs) [read repo]
- Pro, Flex, Dev, Klein 4B/9B. Prose, front-loaded subject (early words weigh more). **No negative
  prompt** — phrase exclusions positively. ≤4 references (Klein). Hex colours and JSON-structured
  prompts supported. 4–8 steps to explore, ~25 for finals.
- **FLUX Dev is a non-commercial licence** — use Pro/API for anything shipped.
- **Kontext** for one precise edit with everything else preserved.
- BFL recommends invisible watermarking plus C2PA.

## Midjourney V7 [snippet]
- No official API and the terms forbid automated access — an agent can only **hand a person a
  prompt to paste**.
- Short prompts; `--ar` for ratio; **`--style raw`** (less automatic beautification) and
  **`--stylize 0–50`** (default 100) for realism; `--no` only for a persistent intruder (naming a
  thing invites it); `--sref` / omni-reference for consistency.
- The glossiest default of all — never use it without raw and low stylize.
- Commercial use needs a paid plan; companies over $1M revenue need Pro or Mega.

## Seedream (ByteDance 4.0 / 4.5 / 5 Lite) [snippet]
- [Subject + Action + Setting] + [Style], natural language, under 600 words; ≤14 references.
- Strong skin and light realism; **defaults towards an East Asian look — state Egypt explicitly.**

## Agent skills reviewed (for structure only)
| Skill | Useful | Avoid |
|---|---|---|
| wuyoscar `gpt-image` craft.md | canvas and layout first, scene density, one capture frame, "RAW, unprocessed, iPhone camera", "no visible brand logos" — the best of the set | its "8K_UHD" JSON field |
| sanky369 `image-generation` | spec block (use, subject, style, composition, light, mood, ratio, negatives), 3–4 real variants, never from a vague prompt | "4K, highly detailed" |
| runcomfy `ai-image-generation`, `nano-banana-2` | model routing, subject first, seed lock, don't mix styles | "cinematic, ultra-detailed" samples |
| inference-sh `product-photography` | shot types, negative space for text overlay | studio gloss, "magazine quality, 4K" |
| skillsforge `midjourney-replicate-flux`, agency-agents `image-prompt-engineer` | layered structure | mandates "award-winning", "cinematic", "stunning" — the AI look itself |
