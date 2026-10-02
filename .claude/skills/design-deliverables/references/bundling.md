# Single-file bundling

## The rule

One HTML file. Every asset inlined. Zero network requests. `bundle.py` fails the build if an
`http(s)://` `src`/`href` survives (remote `@import`s and `<link>`s are dropped, never followed).

## What gets inlined

| asset | how |
|---|---|
| shared CSS (`fonts.css`, `tokens.css`, `patterns.css`) | one `<style id="__css">`, `@import`s resolved, `url()` → data URI |
| screens | `<script type="text/html" data-key="page/platform/state">` templates — the shared CSS ships **once**, and the runtime builds each `<iframe srcdoc>` from it. Inlining it per screen would multiply a ~2 MB stylesheet by the screen count |
| screen images and `url()` | data URIs, resolved against the screen's directory, then `design-kit/patterns` (a `url()` inside a custom property such as `--i:url(../icons/x.svg)` resolves against the stylesheet that *uses* it, not the page) |
| runtime JS + document CSS | `<script>` / `<style>` |
| node ledger, QA report, flows | inline JSON: `__ids`, `__qa`, `__flows` |

## Fonts

Proxima Nova (Adobe woff2 as production serves it) and GESS are inlined as base64. `prune_fonts`
drops what cannot render here: GESS unless `ar` is in scope, the lowercase `proxima-nova` alias
family, and weights no rule uses. This is pruning by rule, not glyph subsetting — subsetting is not
automated. The result is why the bundle is ~1.6 MB rather than 5+.

Fonts are licensed. That is why the document is stamped INTERNAL.

## Size

Soft budget 12 MB, hard limit 25 MB. Screens dominate: a frozen live capture is 2–5 MB alone, which
is one reason live captures are not deliverable screens. If a document cannot fit, split by
platform rather than dropping assets — two honest documents beat one with missing pieces.

**What the build already does to stay small (all lossless):**
- `prune_fonts` — only the weights and locales the screens use.
- `dedupe_css` — a live capture splits one page's CSS into many overlapping hashed files; concatenated, the
  same rules repeat hundreds of times. Identical top-level rules are dropped, **keeping the last copy**, which
  cannot change the cascade (an earlier copy is always overridden by, or equal to, its own later copy). The
  scanner honours backslash escapes — a captured rule such as `[*|\:has\(\%3e]` once unbalanced the
  parenthesis counter and hid all of this. On the agency portal: 10.2 MB of CSS became 1.8 MB.
- The embedded node ledger carries only `kind, role, component, pair` (what the redline panel reads), not each
  node's structural path and fingerprint: 6.2 MB became 0.8 MB.
Together the 30-screen agency portal went from 21.5 MB to 8.2 MB and all 30 screens render pixel-identically
(compared screen by screen in headless Chrome).

**Not done, and why:** removing CSS rules that match no element (a live capture's stylesheet is ~97% unused by
the pages) saves only about 0.7 MB more once duplicates are gone, needs a browser at build time, and cannot see
rules a script would apply later — so it was tried and dropped. Still available if ever needed: image data URIs
repeat across screens (~2.9 MB on the portal); sharing them through one stylesheet would remove that.

## Privacy net

Account captures are redacted before they reach disk (`scripts/lib/redact.mjs`). `bundle.py` is the
second net: it scans the document's visible text (including the screen templates) for phone-like and
email-like values and refuses to write the file if any survive. Known-safe: `01012345678`,
`@example.com`, `@dubizzle.com.eg`. `--allow-pii` exists; using it needs a reason a reviewer would accept.

## Sources stay split

Git holds `deliverable.json`, `flows.json`, the screens. The bundle (`dist/`) is gitignored. Never
hand-edit a bundled file — the next build discards the edit, and data URIs make diffs useless.
