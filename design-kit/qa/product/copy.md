# Canonical strings

`cpy.verbatim` fails when a screen shows one of these with different casing or punctuation
(`Post your ad` when the product says `Post Your Ad`). One string per bullet. The **shipped
product wins** over a PRD — record conflicts in `## PRD conflicts`.

## Canonical
- Post Your Ad
- Call
- Chats
- Chat
- WhatsApp
- Show phone number
- See location
- Save Search
- More Filters
- Clear All Filters
- Advanced Search
- Reset
- Apply
- Cancel
- Back to top
- Negotiable
- Newly listed
- Highlights
- Popular Searches
- Recent Searches
- Featured Businesses
- Explore More
- Notifications
- Favourites
- Account
- Sell
- Sell Now
- Post now
- Republish
- Promote Now
- Promote Ad
- Sell Similar Item
- Edit Now
- Learn more
- Get App
- Ok, I understand
- Your safety matters to us!
- No notifications yet!
- Nothing to show yet
- Insufficient credits
- Select another option
- Export Leads
- Request Export
- Invite agent
- Send invite

_Extracted 2026-10-01 from the 82 committed live templates (`design-kit/templates/{desktop,mobile}`): only
strings that appear in exactly one form across every page are listed, so the check never contradicts live.
English only — the checker compares Latin letters, so an Arabic bullet would match every Arabic string.
Arabic strings and the full voice audit: `.claude/skills/design-copy/references/dubizzle-voice.md`._

## Live inconsistencies — content questions, not enforced

Live shows these in two forms. Copy each surface verbatim; for a **new** surface use the left
column (the more frequent form) and raise the question with the user. Kept as a table so
`cpy.verbatim` does not enforce either form.

| More frequent | Also on live | Where |
|---|---|---|
| Login or Signup (51) | Login or Sign up (30) | header |
| Favourites (header) | Favorites (account menu) | header vs account menu |
| View More (most) | View more | rails, lists |
| View All | View all | rails |
| My Ads (header, menu) | My ads (portal) | header vs portal |
| Related ads | Related Ads | ad detail |
| Assign Agent | Assign agent | portal |
| Use Current Location | Use current location | location dropdown vs mobile page |

## PRD conflicts
_None recorded._
