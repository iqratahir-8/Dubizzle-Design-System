# UX-writing principles — the research behind design-copy

The frameworks the best writing teams use, condensed to what changes a decision. `[read]` = read
first-hand (often via the publisher's GitHub source because the sandbox proxy blocks their sites);
`[snippet]` = from search summaries only — re-check before quoting. dubizzle's own live strings
and `RULES.md` override anything here (`dubizzle-voice.md`).

## The four review standards (Podmajersky, *Strategic Writing for UX*)

Score each new string 0–10 on all four; fix anything under 7. [read, via a skill derived from the book]

| Standard | Test |
|---|---|
| **Purposeful** | Serves the user's goal *and* dubizzle's; says what's in it for the user |
| **Concise** | Every word has a job; the key word comes first |
| **Conversational** | Sounds natural read aloud; active voice; small words kept |
| **Clear** | The accurate verb (`Delete` when it's permanent, `Save` not `OK`). Headings and buttons in Title Case (D-019); one term per concept |

**Write the conversation first:** draft the exchange as two people talking ("I want to sell my
car." "OK — what make is it?"), then compress it into UI. [snippet]

**Voice chart:** one column per product principle (for dubizzle: *fast*, *local*, *trustworthy*),
rows for concepts, vocabulary, verbosity, grammar, punctuation, capitalisation. Voice stays the
same everywhere; **tone** shifts with stakes — light on an empty favourites list, plain and serious
on a scam warning or a failed payment. [snippet]

## Message types

**Errors — three kinds** (Podmajersky) [read]:
- **Inline** — next to the field, names the fix: `Enter a year between 1980 and 2027`.
- **Detour** — a task can't complete: title + what happened + the fix action.
  `Payment didn't go through` / `Your card was declined. Check the details or use another card.` / `Update Card`.
- **Blocking** — the service is down: say what is safe and when it's back.
  `Your ad and chats are safe. Posting is back in a few minutes.`

Problems the user can't fix (eligibility, permissions, moderation) are **not errors** — no red;
a status page that says why, what happens next and when (GOV.UK) [read].

**GOV.UK error rules** [read]: reuse the field label's words (`Price` → `Enter a price`); one
message per failure; instruction for empty, description for limits (`Title must be 70 characters
or less`); never "An error occurred", "This field is required", valid/invalid, please, sorry,
oops, you forgot; keep what was typed; same text inline and in the summary; don't repeat the
hint's example.

**Apple** [read]: prevent the error first; place it next to the problem; say how to fix
(`Use at least 8 characters`, not `That password is too short`); no "oops"/"uh-oh"; if many people
hit the same error, redesign the interaction instead of rewording it. State rules positively
(`Use only letters`, not `Don't use numbers`).

**Empty states — three kinds** [read]:
- **First use:** what will appear + the benefit + one action.
- **Cleared by the user:** acknowledge it (`All caught up`).
- **No results:** suggest a change + a way to browse everything.
Never put information in an empty state that disappears once content loads (Apple).

**Success:** short past tense (`Search saved`). Add a body only for a next step or a consequence.

**Settings:** describe what happens when the setting is **on** (Apple) — live's Notifications
toggles already do: `Receive recommendations based on your activity`.

## Plain language and scanning (Winters, *Content Design*; GOV.UK) [snippet]

- Start from **user needs and evidence** (search terms, support tickets), not what dubizzle wants to say.
- **Reading age 9.** By then people know ~5,000 common words by shape and skip-read them — plain
  words are fastest for everyone, experts included. Sentences around 25 words maximum.
- People drop up to ~30% of words while reading → **front-load**: the word they're looking for
  goes first in the title, sentence and link.
- **Pair writing:** designer + subject expert write together (accuracy and plain language in one pass).

## Conversion microcopy (Yifrah, *Microcopy*) [snippet / read via the Arabic guide]

- Buttons that convert say **value + relevance** — what the user gets here, not the mechanism
  (`Show packages` beats `Continue`; `Sell Faster` beats `Upgrade`).
- **Prevent friction before it happens:** answer the doubt next to the decision ("Free to post",
  "You can edit later", "Your number stays hidden").
- Errors: what happened, why (so it doesn't recur), what to do; never blame; frame as service.

## Platform guides

**Apple HIG Writing** [read]: a verb on every button and link (`Send`, not `Let's do it!`);
`Learn more about X`, never `Click here` (screen readers announce links alone); consistent flow
words — begin / `Continue` / `Done`; avoid "we" (`Unable to load ads`); "your" sparingly and
consistently; use the device verb — **tap** on mobile web, **click** on desktop.

**Microsoft Style Guide** [read]: bigger ideas, fewer words; front-load; write like you speak,
use contractions; no end punctuation on UI text of three words or fewer; start with a verb and cut
"you can" / "there is"; replace `Invalid ID` with what a valid one looks like.
**For translation:** keep the small words (that, who, the), no idioms or slang, don't stack
modifiers, one word per concept, avoid ambiguous -ing/-ed words, link at most two clauses.
**Bias-free:** second person or roles, never "he/she" or slash forms; singular *they* if a
pronoun is unavoidable.

**Material** [snippet]: every word has a job; button labels 1–3 words, specific verbs; lead with the objective.

**Writing is Designing** (Metts & Welfle) [snippet]: words are design material — prototype and
test them with the screen, never paste them in after.

## Marketplace trust and safety copy

- The universal rules (OLX, Facebook Marketplace, dubizzle UAE, Leboncoin) [snippet]: meet in a
  busy public place, bring someone, inspect before paying, never pay a deposit/advance/transfer,
  pay face to face, keep the chat on the platform. dubizzle EG live already says these (in Egyptian
  Arabic) — reuse them verbatim.
- **"We will never ask you for…"** is a strong trust line because it is specific and falsifiable
  (OLX India: never asks for OTP, UPI PIN, card details) [snippet]. Only use it if dubizzle can
  truly promise it — confirm with the user.
- **Name the scam**, don't say "be careful": advance payment or "shipping fee" before meeting; a
  fake "secure payment" or courier link on WhatsApp; a buyer offering more than the asking price.
- **Moving off-platform is the main risk signal** (WhatsApp, asking for a number, an external link,
  a transfer mentioned).
- **Generic tips barely work; just-in-time warnings do.** People shown generic scam tips flagged
  more scams but also more genuine messages; passive banners get habituated; a short, specific,
  interrupting warning at the risky moment (a payment word or link in chat, first contact) works
  far better [snippet — research summaries]. → Design safety copy as **triggered**, not a
  permanent banner, and keep warning styling for real triggers (alarm fatigue).
- Negotiation wording: no reachable guidance; open question.

## Sources

[read] GOV.UK Design System error-message source · Apple HIG Writing (JSON feed) · Microsoft Style
Guide (top-10 tips, bias-free, global writing tips; GitHub) · content-designer/ux-writing-skill
(Podmajersky-derived) · UX-Writing/content-style-guide-in-arabic. [snippet] Podmajersky (O'Reilly,
reviews), Winters *Content Design*, Writing for GOV.UK, Yifrah *Microcopy*, Metts & Welfle,
Material communication codelab, OLX / Facebook / dubizzle UAE / Leboncoin safety pages, scam-tip
and phishing-warning studies (ScienceDirect S0304387823001025; Egelman et al.; PMC5345791).
