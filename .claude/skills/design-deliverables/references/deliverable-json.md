# deliverable.json — the intake

`design-kit/deliverables/<feature>/deliverable.json`, committed. Fill it from the PRD and the QA
report; ask the user only about what you couldn't fill.

```json
{
  "feature": "favourites-revamp",
  "title": "Favourites revamp",
  "version": 2,
  "audience": "engineer",
  "platforms": ["web-desktop", "web-mobile"],
  "locales": ["en"],
  "pages": ["favourites"],
  "classification": "internal",
  "summary": {
    "problem": "Saved ads and saved searches are hard to tell apart and there is no empty state.",
    "scope": "Favourites on desktop and mobile web: saved ads, saved searches, empty and error states.",
    "changed": "v2 adds the empty state and fixes the clipped spec row at 390px."
  },
  "signoff": { "who": ["designer", "product owner"], "meaning": "design is final for build; copy still open" },
  "sections": { "exclude": { "performance": "no budget declared" } },
  "rules": [
    { "id": "R1", "text": "Un-hearting a saved ad removes it after confirmation.",
      "test": "Click the heart; the dialog names the ad; confirming removes exactly that row." }
  ],
  "motion": [], "gestures": [], "lottie": [], "performance": null,
  "acceptance": ["The empty state offers 'Browse ads'."],
  "edge_cases": ["Saved ad deleted by its seller: show 'This ad is no longer available' with a remove action."],
  "open_questions": [ { "q": "Does un-hearting need undo?", "owner": "product owner", "blocks": "R1" } ],
  "changelog": [
    { "version": 1, "date": "2026-09-29", "notes": "First build." },
    { "version": 2, "date": "2026-10-02", "notes": "Added empty state; spec row no longer clips at 390px." }
  ]
}
```

Notes: `pages` are registry ids; `platforms` narrows which of their platforms are included. The build
refuses without a changelog entry for `version`. `rules[].test` and `open_questions[].owner` are
required by the section validators — the build marks their absence in red, not silently. `motion`
entries: `{name, duration, easing, trigger, reduced_motion}` and only with measured values.
`gestures`: `{name, node, threshold, below, conflict}`.
