# Versioning

Three things carry a version here, and they move independently on purpose.
Coupling them would mean a patch to one forces a bump to all, and then nobody
bumps anything.

| version | lives in | changes when | who reads it |
|---|---|---|---|
| **skill version** | `SKILL.md` frontmatter | this skill's behaviour changes | humans, and scripts via `_version.py` |
| **registry schema** | `icons/registry.json` | the registry's shape changes | anything reading the registry |
| **sources schema** | `schema/sources.json` | the source config shape changes | `fetch.py` |

## Single source of truth

Scripts read the skill version from `SKILL.md` frontmatter through
`scripts/_version.py`. No script carries its own constant.

A hardcoded constant drifts the first time someone bumps the frontmatter and
forgets the script, and then a document claims it was built by a version that
never built it. That is worse than having no version at all, because it is
confidently wrong.

## The registry is the contract

A design system reads `registry.json` to know which icons exist and what they
are called. It pins to `schema_version`, never to this skill's version.

Every registry records which skill and version generated it, so a stale
registry is identifiable rather than mysterious.

Adding a field is a minor bump. Removing one, or changing what one means, is
major.

## Content hashes must stay stable

The hash is what makes "we already have this" answerable. If the hashing rules
change, every existing hash becomes meaningless and duplicates reappear.

So a change to `content_hash` is always a major bump, and it requires
re-running the audit across the project to regenerate every hash in one pass.
Never change the rules and let old and new hashes coexist.

## Concept decisions are append-only

`concepts.json` records what was chosen and what was rejected, with a reason.
Entries are amended, never deleted — a removed decision gets made again, and
differently, the next time someone asks the same question.

## Bumping

- **patch** — a fix that changes no output shape
- **minor** — a new section, a new check consumed, a new field in the manifest
- **major** — the accepted report schema changes, the ledger shape changes, or
  the section id set changes

Every bump gets a `CHANGELOG.md` entry naming the schemas it accepts. A bump
with no changelog entry is indistinguishable from a mistake.
