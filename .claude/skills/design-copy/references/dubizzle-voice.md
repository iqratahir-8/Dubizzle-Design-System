# dubizzle's voice — what live actually says

Audited 2026-10-01 from the 82 committed English live templates (`design-kit/templates/{desktop,mobile}`)
and 10 Arabic desktop captures (`design-kit/reference/live/*.ar.desktop.html`, branch
`claude/live-captures-lfs`: home, login, car-dpv, property-dpv, mobile-dpv, cars-list,
property-list, property-rent-list, seller-page, motors). Counts are pages a string appears on.

This is evidence, not a style guide. **Existing strings are copied verbatim.** Where live breaks a
principle in `SKILL.md`, the live string stays as it is and new copy follows the principle; the
conflict is raised with the user, not fixed silently.

## English

### Buttons and actions (verbatim)

`Post Your Ad` (82) · `Search` (44) · `Call` · `Chat` · `WhatsApp` · `Show phone number` ·
`See location` · `Save Search` · `More Filters` · `Clear All Filters` · `Reset` · `Apply` ·
`Cancel` · `Back to top` · `Sell` · `Sell Now` · `Post now` · `Republish` · `Promote Now` ·
`Promote Ad` · `Sell Similar Item` · `Edit Now` · `Learn more` · `Get App` · `Ok, I understand` ·
portal: `Export Leads`, `Request Export`, `Invite agent`, `Send invite`, `Assign Agent`.

Pattern: short, verb-first, mostly **Title Case** on consumer surfaces (`Save Search`,
`Promote Now`), more often sentence case in settings and the portal (`Invite agent`,
`Change password`). `… Now` is a house habit on upsell actions (`Promote Now`, `Edit Now`, `Sell Now`).

### Placeholders

`Find Cars, Mobile Phones and more...` · `Location or Compound` · `Min` / `Max` ·
`Search by make or model` · `Search for location`. Placeholders here are hints inside search
fields — consistent with "placeholder is never the label".

### Headings

`Popular Searches` · `Featured Businesses` · `Explore Egypt's Largest Marketplace` ·
`Explore dubizzle Motors` · `Recent Searches` · `Your safety matters to us!` ·
`No notifications yet!`

### Messages and states

- Empty: `No notifications yet!` · `Nothing to show yet` · portal `No agent assigned`,
  `No chats basis current filter selection`, `No content`.
- Error: `Oops!` · `Something went wrong. Please try again.` · portal credits:
  `Insufficient credits` / `You don't have enough credits for this transaction.` /
  `Select another option` / `contact your Dubizzle sales representative to get more credits.`
- Safety (ad detail): `Your safety matters to us!` then
  `Only meet in public / crowded places for example metro stations and malls.` ·
  `Never go alone to meet a buyer / seller, always take someone with you.` ·
  `Never pay anything in advance or transfer money before inspecting the product.`
- Promo: `Download the app now!` · `Buy and Sell anytime, anywhere!` ·
  `Promote ad to sell your product faster!` · `Maximize your ad's exposure!` · `Get Verified Now!`
- Login: `Sign in to begin your journey` · `New to Dubizzle? Create an account`

### Formats

| Thing | Live English | Note |
|---|---|---|
| Price | `EGP 2,600,000` | prefix, commas, no decimals — matches `RULES.md` |
| Price label | `Negotiable` · `Down Payment` · `Monthly` · `Daily` | |
| Specs | `3 beds` · `2 baths` · `210 m²` | **lowercase on live**; `RULES.md` §4 wrote `3 Beds · 2 Baths` — corrected to live |
| Time | `2 hours ago` · `1 week ago` · `0 minutes ago` | relative throughout listings |
| Location | `Nasr City, Cairo` · `5th Settlement, New Cairo` | area, city |
| Counts | `13,135 ads` · `See +13K Results` | `K` only in result-count buttons, never in prices |
| Brand | `Dubizzle` in sentences and the footer, `dubizzle` in product names (`dubizzle Pro`, `Explore dubizzle Motors`) | copy each verbatim |

### Where live breaks the principles (don't copy the pattern into new strings)

| Live | Principle it breaks | For new copy |
|---|---|---|
| `Oops!` · `Something went wrong. Please try again.` | no "oops"/"please", say what happened | name what failed and the next step |
| `Sign in to begin your journey` | "your journey" is banned filler (`RULES.md` §4) | say what signing in lets you do |
| `!` on headings and promos | no exclamation marks in system copy | no new `!`; keep live ones verbatim |
| `No chats basis current filter selection` | plain language, name the filter | `No chats match these filters` + `Clear filters` |
| `0 minutes ago` | — | `Just now` (proposal) |
| two spellings of the same thing (see `design-kit/qa/product/copy.md` table) | one word per concept | use the more frequent form, raise it |

## Arabic

### Buttons and actions (verbatim)

`انشر إعلانك` (Post your ad) · `بحث` (Search) · `واتساب` · `مكالمة` (Call) · `المحادثه` (Chat) ·
`إظهار الرقم` (Show number) · `عرض الموقع` (See location) · `حفظ البحث` (Save search) ·
`صنف حسب` (Sort by) · `الإبلاغ عن هذا الإعلان` (Report this ad) · `عرض الكل` (View all) ·
`عرض المزيد من المواقع` · `بيع دلوقتي` (Sell now — Egyptian) · `أجّر دلوقتي` (Rent now — Egyptian) ·
`العودة إلى الأعلى` (Back to top).

### Register — live mixes Modern Standard and Egyptian Arabic

- **Modern Standard (فصحى)** for navigation, buttons, filters, headings, SEO text:
  `انشر إعلانك`, `حفظ البحث`, `عمليات البحث الشائعة`, `استكشف أكبر سوق في مصر`.
- **Egyptian colloquial (عامية)** for persuasion and safety — where it should sound like a person:
  `بيع دلوقتي`, `أجّر دلوقتي`, `اختار عربيتك من دوبيزل`, and every safety tip:
  `قابل البايع في مكان عام زي المترو أو المولات أو محطات البنزين` ·
  `خد حد معاك وانت رايح تقابل البايع أو المشتري` ·
  `عاين المنتج كويس قبل ما تشتري وتأكد ان سعره مناسب` ·
  `متدفعش او تحول فلوس الا لما تعاين المنتج كويس`
- Button grammar mixes imperatives (`انشر`, `بيع`) and verbal nouns (`بحث`, `حفظ البحث`, `إظهار الرقم`, `عرض الكل`).

### Formats

| Thing | Live Arabic | Note |
|---|---|---|
| Price | `990,000 ج.م` | **Western digits**, Western comma, currency **after** the number |
| Mileage on cards | `١٦٬٠٠٠ كم` | **Arabic-Indic digits** with Arabic separator `٬` — in the same card as a Western-digit price |
| Area | `220 م٢` | Western digits, `م٢` |
| Time | `منذ 17 ساعات` · `منذ 2 أيام` | Western digits, **grammatically wrong plurals** (see below) |
| Specs | `3 غرف نوم` · `2 حمامات` | same plural problem (`2` should be dual: `غرفتين`, `حمامين`) |
| Location | `مدينة نصر، القاهرة` | Arabic comma `،` |
| Brand | `دوبيزل` | |

### Known defects on live Arabic (don't reproduce)

- **Plurals by formula.** Arabic number agreement: 1 → singular, 2 → dual, 3–10 → plural,
  11+ → singular. Live writes `منذ 2 أيام` (should be `منذ يومين`), `منذ 17 ساعات` (`منذ 17 ساعة`),
  `منذ 18 دقائق` (`منذ 18 دقيقة`), `2 حمامات` (`حمامين`). Use CLDR plural categories for `ar`
  (zero, one, two, few, many, other).
- **Mixed digit systems** in one card (Western price, Arabic-Indic mileage). **Decided: Western
  everywhere (D-020)** — the Arabic-Indic mileage is a live defect.
- **Spelling variants:** `العودة إلى الأعلى` / `الاعلى`, `الحد الأقصى` / `حد اقصى`, `المحادثه`
  (ه for ة). Use the correct form in new strings; flag the live ones.

## Open content questions for the user

1. ~~Casing~~ — **decided 2026-10-01 (D-019): Title Case for new headings and buttons**, sentences stay sentence case, live strings verbatim.
2. `Login or Signup` vs `Login or Sign up`; `Favourites` vs `Favorites`.
3. ~~Arabic digits~~ — **decided 2026-10-01 (D-020): Western everywhere.**
4. Arabic register: keep MSA for UI and Egyptian for persuasion/safety (live's split), or one register?
5. Fix the Arabic plural defects at the source (a product bug, not a design one).
