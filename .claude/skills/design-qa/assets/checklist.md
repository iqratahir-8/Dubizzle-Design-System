# Manual checklist

Rules catch mechanical failures. These need judgment, and skipping them produces a green report
on a design nobody would ship. Record each against a `data-node-id` (or css_path) in the same
finding shape the automated checks use, `check: "manual.<area>.<item>"`, so the gate reads one file.

## Per state

**Empty**
- [ ] Does it say what to do next, or only that there is nothing here? (`Post Your Ad`,
      `Browse ads` — imperative, second person)
- [ ] Is there an action, and is it the right one for the job (scan · filter · contact · post)?
- [ ] Distinguishable from an error and from a still-loading state?
- [ ] Illustration from `design-kit/illustrations/` — never stock or invented (`imagery-illustration`)

**Loading**
- [ ] Honest about what is loading? Skeleton matches the real layout so nothing jumps?
- [ ] Anything over ~2s has progress, not an indefinite spinner?

**Error**
- [ ] Recovery path, not just an apology? Names what failed in terms the user can act on?
- [ ] Anything the user typed is preserved (Post an Ad, chat draft, filters)?

**No permission / signed-out**
- [ ] Says how to get in (`Login`), rather than implying the feature is broken?
- [ ] Clearly different from empty?

**Flag off**
- [ ] Degrades cleanly, no hole where the widget was, no dangling reference to it?

## Per screen

- [ ] Density — dubizzle is a scanning product. If it looks airy, it is wrong (RULES.md)
- [ ] Hierarchy on an ad card: price → title → specs → meta. Never flattened
- [ ] One primary (red) action per view
- [ ] Copy in dubizzle voice — no `Get Started`, `Discover`, `Unlock`, `Seamless`
- [ ] Would a first-time user know where to start?
- [ ] At 360px is the primary action reachable without scrolling?
- [ ] Anything on screen that only makes sense to someone who built it?
- [ ] Real content from `design-kit/content/fixtures.json` — no invented listings or places
- [ ] Anything new (colour, gradient, motion, chart, illustration) logged in `docs/PROPOSALS.md`
      **and said out loud**

## Per flow

- [ ] Back from every screen without the browser button?
- [ ] Destructive action confirmed, and the confirmation names what will be destroyed?
- [ ] After completing the task, is it obvious what happened?
- [ ] Post an Ad: no step publishes, no step charges (capture ground rule)

## Cross-platform

- [ ] Where desktop and mobile differ, is it a deliberate adaptation (dropdown vs full page,
      side panel vs bottom sheet) or an oversight?
- [ ] Do the same words mean the same thing on both?

## Arabic (only when `ar` is in scope — parked by default)

- [ ] `rtl-arabic` skill run; digits decision (Western vs Arabic-Indic) recorded
- [ ] Directional icons mirrored, numbers and currency read correctly

## Recording

```json
{
  "check": "manual.empty.next_action",
  "severity": "warning",
  "screen": "web-mobile/favourites",
  "node": "7:412",
  "message": "empty state says 'No favourites yet' with no action",
  "section_hint": "state-screens"
}
```
