#!/usr/bin/env node
/**
 * Turns live captures into page templates that render exactly like production.
 *
 * Hand-built templates only approximated the live site, so feature work kept starting with
 * template fixes. A frozen capture (scripts/lib/snapshot.mjs) already renders within ~1% of
 * the live screenshot — this makes it a usable template:
 *   - every <style> block → a shared, content-hashed CSS file (pages share most CSS)
 *   - every embedded image/font → a shared, content-hashed asset file
 * so each template is a small, editable HTML file.
 *
 *   design-kit/reference/live/<capture>.<layout>.html            (gitignored capture)
 *   → design-kit/templates/<layout>/<template>.html
 *     design-kit/templates/_live-css/<hash>.css
 *     design-kit/templates/_live/assets/<hash>.<ext>
 *
 * Mapping: design-kit/templates/live-templates.json. Templates without a capture keep their
 * hand-built version (scripts/build-templates.mjs runs first). Rebuilds templates/index.html.
 *
 *   npm run build:templates
 *   node scripts/build-live-templates.mjs --only favourites-empty,saved-searches-empty
 *       builds just those templates from their captures and skips the prune, for a machine
 *       that holds some captures but not all (a full build there would delete the shared
 *       CSS of every page whose capture is missing — PROGRESS item 57).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prototypeFor, wirePrototype, prototypeRuntime, hotspotsFor } from './lib/prototype.mjs';
import { filtersFor, filtersRuntime } from './lib/prototype-filters.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = join(ROOT, 'design-kit/reference/live');
const TEMPLATES = join(ROOT, 'design-kit/templates');
const SHARED = join(TEMPLATES, '_live');
// CSS sits at the same depth as desktop/ and mobile/ so one relative path — ../_live/assets/ —
// works from both. It has to: a url() inside a CSS custom property set in a style attribute
// resolves against the stylesheet that uses the var(), not the HTML file.
const CSS_DIR = join(TEMPLATES, '_live-css');
const ASSET_DIR = join(SHARED, 'assets');
const LAYOUTS = ['desktop', 'mobile'];
const ONLY = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) || process.argv[process.argv.indexOf('--only') + 1] || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const only = process.argv.includes('--only') || process.argv.some((a) => a.startsWith('--only=')) ? new Set(ONLY) : null;

const { templates } = JSON.parse(readFileSync(join(TEMPLATES, 'live-templates.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'design-kit/reference/capture-manifest.json'), 'utf8'));
const urls = Object.assign({}, ...Object.values(manifest.tiers));
const PORTAL_FILTERS_FILE = join(ROOT, 'design-kit/content/portal-filters.json');
const PORTAL_FILTERS = existsSync(PORTAL_FILTERS_FILE) ? JSON.parse(readFileSync(PORTAL_FILTERS_FILE, 'utf8')) : null;

mkdirSync(CSS_DIR, { recursive: true });
mkdirSync(ASSET_DIR, { recursive: true });

const EXT = {
  'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
  'image/svg+xml': 'svg', 'image/avif': 'avif', 'font/woff2': 'woff2', 'application/font-woff2': 'woff2',
  'font/woff': 'woff', 'application/font-woff': 'woff', 'font/ttf': 'ttf', 'font/otf': 'otf',
};
const hash = (data) => createHash('sha1').update(data).digest('hex').slice(0, 16);
const DATA_URI = /data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/gi;

/** Writes each embedded data: URI once, returning `${prefix}<hash>.<ext>` in its place. */
function extractAssets(text, prefix) {
  return text.replace(DATA_URI, (whole, mime, b64) => {
    const ext = EXT[mime.toLowerCase()];
    if (!ext || b64.length < 400) return whole; // tiny icons stay inline
    const bytes = Buffer.from(b64, 'base64');
    const file = `${hash(bytes)}.${ext}`;
    const path = join(ASSET_DIR, file);
    if (!existsSync(path)) writeFileSync(path, bytes);
    return `${prefix}${file}`;
  });
}

function buildTemplate(name, entry, layout) {
  const source = join(LIVE, `${entry.capture}.${layout}.html`);
  if (!existsSync(source)) return null;
  let html = readFileSync(source, 'utf8');

  // <style> blocks → shared CSS files, in order, keeping media attributes.
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (whole, attrs, css) => {
    if (!css.trim()) return '';
    const media = attrs.match(/media="([^"]*)"/)?.[1];
    const body = extractAssets(css, '../_live/assets/');
    const file = `${hash(body)}.css`;
    const path = join(CSS_DIR, file);
    if (!existsSync(path)) writeFileSync(path, body);
    return `<link rel="stylesheet" href="../_live-css/${file}"${media ? ` media="${media}"` : ''}>`;
  });
  html = extractAssets(html, '../_live/assets/');

  const captured = statSync(source).mtime.toISOString().slice(0, 10);
  const origin = `https://www.dubizzle.com.eg${urls[entry.capture] ?? ''}`;
  const stamp = `<meta name="live-template" content="${entry.capture}.${layout} · captured ${captured} from ${origin}">`;
  html = html.replace(/<head([^>]*)>/i, (m) => `${m}\n<!-- LIVE TEMPLATE — generated by scripts/build-live-templates.mjs from a frozen capture of ${origin} (${captured}).
     Renders like production. Edit freely for feature work; re-run the build to refresh from a new capture (it overwrites this file). -->\n${stamp}`);

  /* Prototype members get their links wired to sibling templates, so the captured
     screens navigate to each other (see scripts/lib/prototype.mjs). Availability is
     decided from config + source captures, not from files already written, so the
     result does not depend on the order templates happen to be built in. */
  let proto = null;
  const group = prototypeFor(name);
  if (group) {
    const isAvailable = (target) =>
      Boolean(templates[target]) && existsSync(join(LIVE, `${templates[target].capture}.${layout}.html`));
    const r = wirePrototype(html, group, isAvailable);
    const hot = hotspotsFor(group, name, isAvailable);
    /* Working filters: dubizzle's own option lists, read off live into
       design-kit/content/portal-filters.json (npm run extract:portal-filters). */
    const filters = filtersFor(name, PORTAL_FILTERS);
    html = r.html.replace(/<\/body>/i, `${prototypeRuntime(group, hot)}\n${filtersRuntime(filters)}\n</body>`);
    /* The drawer's class names are build hashes. If a re-capture comes from a newer
       dubizzle release they will have changed, and the toggle would silently stop
       working — so check the capture still carries both, and say so if it does not. */
    let drawerOk = null;
    if (group.drawer) {
      drawerOk =
        html.includes(group.drawer.collapsed) &&
        group.drawer.collapsedOnly.every((c) => html.includes(c)) &&
        html.includes('aria-label="Burger menu"');
      const cssHasExpanded = [...html.matchAll(/_live-css\/([\w.]+\.css)/g)].some((m) =>
        readFileSync(join(CSS_DIR, m[1]), 'utf8').includes(`.${group.drawer.expanded}`),
      );
      drawerOk = drawerOk && cssHasExpanded;
    }
    proto = { id: group.id, wired: r.wired, neutralised: r.neutralised, drawerOk, hotspots: hot.length, filters: filters ? Object.keys(filters.dropdowns).length : 0 };
  }

  const out = join(TEMPLATES, layout, `${name}.html`);
  writeFileSync(out, html);
  return { name, layout, bytes: Buffer.byteLength(html), captured, proto };
}

const built = [];
for (const [name, entry] of Object.entries(templates)) {
  if (only && !only.has(name)) continue;
  for (const layout of LAYOUTS) {
    const r = buildTemplate(name, entry, layout);
    if (r) built.push(r);
  }
}
for (const b of built.filter((b) => b.proto)) {
  const d = b.proto.drawerOk === null ? '' : b.proto.drawerOk ? ' · drawer ok' : ' · DRAWER CLASSES NOT FOUND — re-measure (a new release changed the hashes)';
  console.log(`proto ${b.layout}/${b.name}.html  ${b.proto.wired} links wired, ${b.proto.neutralised} neutralised, ${b.proto.hotspots} hotspot(s), ${b.proto.filters} filter(s)${d}`);
}

// ── Prune shared files no template references any more (old captures) ─────────
if (only) console.log(`--only: ${built.length} template(s) built, prune skipped`);
else {
  const referenced = new Set();
  for (const layout of LAYOUTS) {
    for (const f of readdirSync(join(TEMPLATES, layout)).filter((f) => f.endsWith('.html'))) {
      const text = readFileSync(join(TEMPLATES, layout, f), 'utf8');
      for (const m of text.matchAll(/_live-css\/([\w.]+\.css)/g)) {
        referenced.add(`css/${m[1]}`);
        for (const a of readFileSync(join(CSS_DIR, m[1]), 'utf8').matchAll(/_live\/assets\/([\w.]+)/g)) referenced.add(`asset/${a[1]}`);
      }
      for (const a of text.matchAll(/_live\/assets\/([\w.]+)/g)) referenced.add(`asset/${a[1]}`);
    }
  }
  let removed = 0;
  for (const f of readdirSync(CSS_DIR)) if (!referenced.has(`css/${f}`)) (unlinkSync(join(CSS_DIR, f)), removed++);
  for (const f of readdirSync(ASSET_DIR)) if (!referenced.has(`asset/${f}`)) (unlinkSync(join(ASSET_DIR, f)), removed++);
  if (removed) console.log(`pruned ${removed} unreferenced shared file(s)`);
}

// ── Index ─────────────────────────────────────────────────────────────────────
const handBuilt = new Set();
for (const layout of LAYOUTS) {
  for (const f of readdirSync(join(TEMPLATES, layout)).filter((f) => f.endsWith('.html'))) {
    const name = f.replace(/\.html$/, '');
    const text = readFileSync(join(TEMPLATES, layout, f), 'utf8').slice(0, 600);
    if (!text.includes('LIVE TEMPLATE')) handBuilt.add(name);
  }
}
const liveNames = Object.keys(templates).filter((name) => LAYOUTS.some((l) => existsSync(join(TEMPLATES, l, `${name}.html`))));
let report = {};
try {
  report = Object.fromEntries(JSON.parse(readFileSync(join(TEMPLATES, '_live/fidelity.json'), 'utf8')).map((r) => [r.base, r]));
} catch {
  /* no fidelity run yet */
}

const link = (name, layout) =>
  existsSync(join(TEMPLATES, layout, `${name}.html`))
    ? `<a class="btn btn--secondary btn--sm" href="${layout}/${name}.html">${layout}</a>${
        report[`${name}.${layout}`] ? ` <span class="fid">${report[`${name}.${layout}`].diff}% off</span>` : ''
      }`
    : `<span class="muted">no ${layout}</span>`;

const rowsLive = liveNames
  .map((name) => `<tr><td><strong>${templates[name].label}</strong><br><code>${name}.html</code></td><td>${link(name, 'desktop')}</td><td>${link(name, 'mobile')}</td><td><span class="pill pill--success">Live capture</span></td></tr>`)
  .join('\n');
const rowsHand = [...handBuilt]
  .filter((n) => !liveNames.includes(n))
  .sort()
  .map((name) => `<tr><td><strong>${name}</strong><br><code>${name}.html</code></td><td>${link(name, 'desktop')}</td><td>${link(name, 'mobile')}</td><td><span class="pill pill--regular">Hand-built — no capture yet</span></td></tr>`)
  .join('\n');

writeFileSync(
  join(TEMPLATES, 'index.html'),
  `<!doctype html>
<!-- GENERATED by scripts/build-live-templates.mjs -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page templates — dubizzle Egypt</title>
<link rel="stylesheet" href="../tokens/tokens.css"><link rel="stylesheet" href="../patterns/patterns.css">
<style>
  body { background: var(--surface-subtle); }
  .wrap { max-width: 110rem; margin-inline: auto; padding: var(--space-6); }
  .lede { color: var(--text-secondary); max-width: 80rem; margin: var(--space-2) 0 var(--space-6); }
  table { width: 100%; border-collapse: collapse; background: var(--surface-card); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-8); }
  th, td { text-align: left; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-default); vertical-align: middle; }
  th { font-size: var(--text-xs); text-transform: uppercase; color: var(--text-tertiary); }
  .fid, .muted { font-size: var(--text-xs); color: var(--text-tertiary); }
</style></head>
<body><div class="wrap">
  <h1 class="page-head__title">Page templates</h1>
  <p class="lede">
    <strong>Live capture</strong> templates are frozen copies of real dubizzle.com.eg pages — they render like
    production (the % is the pixel difference from the live screenshot). Copy one and build your feature on it,
    using the design-system components for anything new. <strong>Hand-built</strong> templates have no capture yet
    and only approximate the live site. The templates are also a <a href="../flows/index.html">clickable prototype</a>: every link
    leads to the template it would open on live, desktop and mobile, with the flows stored per section.
  </p>
  <table><thead><tr><th>Page</th><th>Desktop</th><th>Mobile</th><th>Source</th></tr></thead><tbody>
${rowsLive}
${rowsHand}
  </tbody></table>
  <p class="lede"><a href="../index.html">← Design system</a> · <a href="../flows/index.html">Prototype flows</a> · <a href="../reference/live/gallery.html">Live screens</a></p>
</div></body></html>
`,
);

const kb = (n) => `${Math.round(n / 1024)} KB`;
for (const b of built) console.log(`live  ${`${b.layout}/${b.name}.html`.padEnd(40)} ${kb(b.bytes)}`);
const cssFiles = readdirSync(CSS_DIR);
const assets = readdirSync(ASSET_DIR);
const size = (dir, files) => files.reduce((n, f) => n + statSync(join(dir, f)).size, 0);
console.log(`\n${built.length} live templates · ${cssFiles.length} shared CSS files (${kb(size(CSS_DIR, cssFiles))}) · ${assets.length} assets (${kb(size(ASSET_DIR, assets))})`);
