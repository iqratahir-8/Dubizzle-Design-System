# Wrapped checkers

The repo already enforces a lot. `run.py` **calls** these and normalises their output into
`report.json`; it never re-implements them. If one of them changes its output format, fix the
parser in `run.py` (`wrap_*`), not the checker.

| repo command | maps to | when it runs | needs |
|---|---|---|---|
| `node scripts/check-design.mjs <authored files>` | `tok.lint`, `cpy.placeholder`, `rtl.physical` | authored screens in scope | node |
| `node scripts/check-a11y.mjs <files>` | `a11y.alt`, `a11y.label`, `a11y.heading` | any screen in scope | node + Chrome |
| `node scripts/check-rtl.mjs` | `rtl.physical` | only if `ar` in scope | node |
| `node scripts/check-prototype.mjs` | `prv.leak`, `prv.click` | portal pages in scope | node + Chrome |
| `node scripts/check-parity.mjs` | `cmp.parity` | `--components` | node + Storybook + kit servers |
| `node scripts/check-live.mjs` | `cmp.live` | `--components` | node + Chrome + `design-kit/reference/live` |

`check:a11y`'s hit-target line is deliberately **not** mapped: `render_checks.mjs` measures
targets itself against the platform floor so the number and the severity come from
`platforms.json`, not from a hard-coded 24.

## Mapping rules

- Output that names a file is attributed to the registry screen at that path. `check:a11y`
  prints basenames only, so `run.py` invokes it once per directory to avoid the
  `templates/desktop/x.html` vs `templates/mobile/x.html` collision.
- `check-design` prints `error` / `warn` lines under a file header. `error` → blocker,
  `warn` → warning, before the live cap. Messages containing `RTL` map to `rtl.physical`,
  `generic copy` to `cpy.placeholder`, everything else to `tok.lint`.
- A command that cannot run (missing `node_modules`, no Chrome, servers down) is reported in
  `checks_run` as `skipped` with the reason. It is never dropped, and a skipped check that was in
  scope stops the verdict being PASS.
- Exit code with unparseable output: one finding for the command with the last lines of output
  as evidence. Never swallow a non-zero exit.

## Setup

```bash
npm install                 # once; node_modules is gitignored
export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome   # cloud sandbox
# on a Mac the scripts default to /Applications/Google Chrome.app/…
```
