# Egypt account skills vs this repo — what wins

**Rule: this repo wins.** `RULES.md`, `design-kit/tokens/tokens.css` and the live captures are the
source of truth (measured on 142+ captures, including the Agency Portal). The account skills were
written on 2026-08-12 against the live **homepage** only. Use them for what the repo is silent on, and log every
difference in `docs/PROPOSALS.md` instead of silently picking one.

✔ = checked against the repo's files here (2026-10-02). Everything else was not checked.

## Where they disagree

| # | Topic | Account skills say | This repo says | Decision |
|---|---|---|---|---|
| 1 ✔ | Input border | `--border-input` = `#919395` ("deliberately darker") | `--border-input` = `#dadbdb` (RULES §1) | Repo. **Open question:** the account value was measured on the header search group; confirm whether the search-group select is a separate token |
| 2 ✔ | Page background | page = `#F6F6F6` | `--surface-page` = `#ffffff`; `#f6f6f6` is `--surface-subtle` (section background) | Repo |
| 3 ✔ | Status colours | "open gap, do not invent" | `--color-success #059e00`, `--color-warning #ffba3c`, `--color-error #e00000` | Repo (defined and measured, incl. portal ad-state pills) |
| 4 ✔ | Card shadow | "no card shadows, ever" | Grid card flat; **list card has `--shadow-card`**; `--shadow-card-hover` on hover | Repo |
| 5 ✔ | Card radius | cards 12, listing image 4 | `--radius-lg` = `--ad-card-border-radius` = 0.8rem (grid); list card 1.2rem desktop / 0.8rem mobile | Repo |
| 6 ✔ | Focus | "no focus ring; propose one" | New interactive components ship `:focus-visible` (RULES.md §4b) | Repo |
| 7 ✔ | Active/pressed | "not implemented" | `--color-primary-active #930100` exists | Repo |
| 8 | Container | 1248 (measured at 1280); code var 75rem | No container token found in `tokens.css` | Measure in the repo before using; do not copy 1248 blindly |
| 9 | Header and mobile bands | Header 68 + 48 + 49 = 165; mobile 81 + 143 + 60 | Not checked | Use as a starting point, verify against a capture |
| 10 | Codebase | Next.js at `zameen_nextjs-main/eg/`, shared `Button`, `Card`… | Repo documents the maple monorepo and this repo's React components | Import paths in the originals are unverified here |

## Same on both sides (✔)

Brand red `#E00000` / hover `#BA0000`, text `#23262A` / `#464C55` / `#919395`, border `#E0E0E0`, link blue `#3A88EF`,
button and input radius 6px (0.6rem), breakpoints 768 / 950 / 1280 / 480 / 360, hover darkens (never lightens), 14px body.

## Token names — translate before copying

| Account skill | Repo token | Value |
|---|---|---|
| `--brand-red` | `--color-primary` (`--red-05`) | `#e00000` |
| `--brand-red-hover` | `--color-primary-hover` (`--red-06`) | `#ba0000` |
| `--link-blue` | `--color-secondary` (`--blue-05`) | `#3a88ef` |
| `--link-blue-dark` | `--blue-06` | `#0f5dc4` |
| `--brand-dark`, `--text-primary` | `--text-primary` | `#23262a` |
| `--text-secondary` | `--text-secondary` | `#464c55` |
| `--text-muted` | `--text-tertiary` | `#919395` |
| `--border-default` | `--border-default` | `#e0e0e0` |
| `--border-light` | (same hex as `--gray-03`) | `#dadbdb` — **repo's `--border-input`** |
| `--border-input` (`#919395`) | no equivalent — see row 1 | — |
| `--bg-surface` | `--surface-page` / card surface | `#ffffff` |
| `--bg-page` | `--surface-subtle` | `#f6f6f6` |
| `--bg-muted` | `--surface-muted` | `#f0f0f0` |

Never write the account names (`--brand-*`, `--bg-*`) in repo code: `check:design` only knows the repo's tokens.

## Dead links in the originals

They point to `dubizzle-egypt-typography`, `-spacing`, `-radius` and `references/{tokens,buttons,forms,navigation,cards-feedback,
codebase-components,prototype-scaffold,design-notes}.md`. None were uploaded. The repo equivalents: `RULES.md` §1,
`design-typography`, `design-grid`, `design-interaction`, `design-copy`, and `design-kit/tokens/tokens.css`.

## Safe to use as-is

Page archetypes (home, search, detail, post-ad, static), the RTL mirror / don't-mirror list, "reserve the bottom inset including
`env(safe-area-inset-bottom)`", tenant isolation (never mix Bayut KSA teal/green or MyZameen dark-mode tokens), and the habit
of flagging unverified values as proposals.
