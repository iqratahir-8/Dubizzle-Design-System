# Arabic copy — dubizzle Egypt

Claude does not invent Arabic UI strings for production. Use live strings verbatim
(`dubizzle-voice.md`); new strings come from a translator or the dubizzle content team. This file is
for **structuring, reviewing and briefing** Arabic copy, and for drafts clearly marked as drafts.
No Egyptian/MENA company (Talabat, Noon, Careem, Instapay, Vodafone, OLX, Bayut) publishes a
content guideline — the register rules below are inferred from live dubizzle plus public guides.

## Register — Modern Standard for controls, Egyptian for people

Live already splits it this way, and it is the recommended rule:

| Use | Register | Live examples |
|---|---|---|
| buttons, tabs, labels, titles, statuses, filters, navigation | **Modern Standard (فصحى)** | `انشر إعلانك` · `بحث` · `حفظ البحث` · `عمليات البحث الشائعة` |
| prompts, hints, empty states, onboarding, persuasion, **safety tips** | **Egyptian colloquial (عامية)** | `بيع دلوقتي` · `اختار عربيتك من دوبيزل` · `متدفعش او تحول فلوس الا لما تعاين المنتج كويس` |

- MSA controls are short, standard and readable across the region; colloquial sounds like a person
  exactly where trust and motivation matter.
- **One register per string.** Never mix MSA grammar with `دلوقتي` / `عشان` / `كويس` in one
  sentence — it reads as machine-translated.
- Friendly ≠ slangy: clear, contemporary, professional.

## Buttons — verbal noun or imperative (decision pending)

Android/AOSP uses the **verbal noun (مصدر)**: `بحث`, `حفظ`, `حذف`, `إلغاء`, `مشاركة`, `إرسال` —
no gender, no person, short. The Arabic Content Style Guide prefers the **imperative** for action
buttons (`أضف كتابًا`). Live mixes both (`انشر إعلانك`, `اتصل` vs `بحث`, `إظهار الرقم`, `عرض الكل`).

**Recommended (until the user decides):** verbal noun for utility/system actions (حفظ، بحث، إلغاء،
حذف، تعديل، إرسال، عرض الكل); imperative only for the main conversion CTA (`انشر إعلانك`).

Confirmation buttons name the outcome, never نعم / لا: `تجاهل التغييرات؟` → `إلغاء` / `تجاهل`.
Avoid two "Cancel"s side by side — use e.g. `غير مهتم` for leaving.

## Addressing the reader — avoid gender

Arabic defaults to masculine for an unknown reader (Twitter and Aramex shipped opt-in feminine
Arabic in 2021). Prefer structures without gender:
- verbal nouns on buttons;
- impersonal forms: `تعذّر حفظ الإعلان` (couldn't save), `جارٍ التحميل…` (loading);
- statements: `تم الحفظ` / better, the result itself (see Success).
Accept a masculine imperative only when no neutral form reads naturally. **Never** slash forms
(`أدخل/ي`). Groups neutrally: `أصحاب الأعمال`, not `رجال الأعمال`.

## Errors, success, empty

- **Errors:** state the rule, not "invalid": `يجب أن يتكوّن رقم الموبايل من 11 رقمًا`, not
  `رقم الموبايل غير صالح`. Avoid `خطأ` and `فشل`. Don't blame: `رقم الموبايل غير صحيح`, not
  `الرقم الذي أدخلته خاطئ`. `عذرًا` at most once, for a system fault, never for validation;
  `يُرجى` sparingly.
- **Success:** skip the cliché `تم … بنجاح`; say the result and its value:
  `تمت الإضافة إلى المفضلة`.
- **Empty:** never `عذرًا، لا توجد…`; say what will appear + the next step:
  `الإعلانات اللي هتحفظها هتظهر هنا` (colloquial — it's a prompt) + `تصفّح الإعلانات`.
- Titles and labels: no end punctuation. Never give directions like "top left" — RTL mirrors.

## Punctuation and loanwords

- Arabic marks: comma `،`, semicolon `؛`, question mark `؟`, quotes `« »`; no space before them.
  Live: `مدينة نصر، القاهرة`.
- Keep brand and tech names in Latin script where users know them that way (WhatsApp may stay
  `واتساب` as live writes it). Use established loanwords (`فلاتر`, `كمبوند`, `شات`). No invented abbreviations.

## Numbers, prices, dates — pin the locale

- **Plurals have six forms** (CLDR `ar`: zero, one, two, few 3–10, many 11–99, other 100+).
  Never build them with a formula — live's `منذ 2 أيام` should be `منذ يومين`, `منذ 17 ساعات` →
  `منذ 17 ساعة`, `2 حمامات` → `حمامين`. Use ICU MessageFormat / `Intl.PluralRules('ar')`.
- **Digits:** CLDR `ar-EG` defaults to **Arabic-Indic** — `Intl.NumberFormat('ar-EG', {style:
  'currency', currency: 'EGP'})` → `١٬٢٥٠٬٠٠٠٫٠٠ ج.م.‏`. Live prices are **Western** (`990,000 ج.م`)
  while live mileage is Arabic-Indic. If Western is chosen, **pin `ar-EG-u-nu-latn`** or the
  formatter silently switches. The choice is the user's (open question).
- **Price:** number then `ج.م`, Western comma for 6–7 digits (`990,000 ج.م`), no decimals.
- **Dates:** Gregorian Egyptian month names (`١ أكتوبر` / `1 أكتوبر`), not Levantine
  (`تشرين الأول`); order `الخميس، 16 أبريل`. Prefer `اليوم` / `أمس`. Relative time: live uses
  `منذ`; ICU produces `قبل` — keep live's `منذ`.
- Times `5 مساءً`; ranges with an en dash, no spaces `10–20`; percent `٪`. Phone numbers without
  separators: `01012345678`.

## Bidirectional text

- Isolate every inserted value — user names, ad titles, prices, phone numbers, plates, model
  names — with `<bdi>` or `dir="auto"`; in plain strings use FSI…PDI (U+2068/U+2069). Otherwise a
  number jumps to the wrong side of an Arabic phrase.
- Phone numbers, plates, codes, URLs: `dir="ltr"`.
- A string starting with Latin text inside Arabic UI starts with RLM (U+200F) — Android does this
  for `‏Wi‑Fi…`.

## Length

English → Arabic usually grows ~20–25% (sources range −30% to +40%); short strings grow most.
Budget ~30% extra width on buttons, chips and tabs; nothing may wrap to two lines
(`design-review` `rev.labels`). Write Arabic for meaning, not word-for-word.

## Open questions (for the user)

1. Verbal noun vs imperative on buttons (recommendation above).
2. Western vs Arabic-Indic digits — one system per surface.
3. Keep the MSA-controls / Egyptian-people split (recommended), or one register?
4. `عذرًا` / `يُرجى` — allowed once for system faults (recommended) or never?
5. Opt-in feminine Arabic: out of scope unless product asks.
6. Fix the live plural defects at the source.

## Sources

[read] UX-Writing/content-style-guide-in-arabic (voice and tone, actionable language, style and
mechanics) · AOSP `values-ar/strings.xml` · Unicode CLDR `plurals.xml`, `ar.xml`, `ar_EG.xml` ·
Node `Intl` (ICU 77.1) output · W3C i18n "Inline markup and bidirectional text", "Unicode controls
vs markup" · samuelya/SevenHabitsTools #227 (register split by string type) · Mozilla Arabic style
guide (low weight). [snippet] Twitter feminine Arabic (Arab News), Aramex #AddressHerCorrectly,
Arabic punctuation, digits in Egypt (helw.net), text-expansion articles, Arabic UI articles (UXbert,
UXPA). Live evidence: `dubizzle-voice.md`.
