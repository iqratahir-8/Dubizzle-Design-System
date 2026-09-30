#!/usr/bin/env node
/**
 * Makes the portal prototype pages self-contained: every image/icon/font the pages pull from
 * dubizzle.com.eg is downloaded once, stored content-hashed in design-kit/templates/_live/assets/,
 * and the page is rewritten to point at it. Third-party preconnect/dns-prefetch hints are dropped.
 *
 * The exact bytes live on production, so this needs a machine that can reach dubizzle.com.eg
 * (the cloud sandbox cannot). After the first run the url -> file map is committed in
 * design-kit/templates/remote-assets.json, so later runs (and any rebuild) work offline.
 *
 *   node scripts/localize-remote-assets.mjs                 # portal-*.html, fetch what is missing
 *   node scripts/localize-remote-assets.mjs --offline       # only use remote-assets.json
 *   node scripts/localize-remote-assets.mjs --dry-run       # list what would be fetched
 *   node scripts/localize-remote-assets.mjs --glob 'desktop/home*.html'
 *   node scripts/localize-remote-assets.mjs --base http://127.0.0.1:8123   # test mirror for the hosts
 *
 * Re-run it after `npm run build:templates` (the build writes the remote URLs back).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TPL = join(ROOT, 'design-kit/templates');
const ASSETS = join(TPL, '_live/assets');
const MANIFEST = join(TPL, 'remote-assets.json');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const OFFLINE = flag('--offline'), DRY = flag('--dry-run'), BASE = opt('--base', null);
const GLOB = opt('--glob', 'desktop/portal-*.html');
const HOSTS = /^https:\/\/(www\.dubizzle\.com\.eg|images\.dubizzle\.com\.eg)\//;
const TYPES = { '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.json': 'application/json', '.woff2': 'font/woff2' };

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const re = new RegExp(String.raw`https://(?:www|images)\.dubizzle\.com\.eg/[^\s"'()<>,\\]+`, 'g');
const [dir, pat] = GLOB.split('/');
const rx = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
const files = readdirSync(join(TPL, dir)).filter((f) => rx.test(f)).map((f) => join(TPL, dir, f));

const urls = new Set();
for (const f of files) for (const u of readFileSync(f, 'utf8').match(re) || []) if (HOSTS.test(u)) urls.add(u);
const todo = [...urls].filter((u) => !manifest[u]);
console.log(`${files.length} pages · ${urls.size} remote urls · ${todo.length} not yet local`);
if (DRY) { todo.forEach((u) => console.log('  ' + u)); process.exit(0); }

mkdirSync(ASSETS, { recursive: true });
let failed = [];
if (!OFFLINE) {
  for (const u of todo) {
    try {
      const res = await fetch(BASE ? u.replace(/^https:\/\/[^/]+/, BASE) : u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      let ext = extname(new URL(u).pathname).toLowerCase();
      if (!TYPES[ext]) ext = '.bin';
      const name = createHash('sha1').update(buf).digest('hex').slice(0, 8) + ext;
      writeFileSync(join(ASSETS, name), buf);
      manifest[u] = name;
    } catch (e) { failed.push(u + '  (' + e.message + ')'); }
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, Object.keys(manifest).sort(), 2) + '\n');
}

let rewritten = 0, left = 0;
for (const f of files) {
  let t = readFileSync(f, 'utf8'); const before = t;
  t = t.replace(re, (u) => (manifest[u] ? `../_live/assets/${manifest[u]}` : u));
  t = t.replace(/<link\b[^>]*\brel=["'](?:preconnect|dns-prefetch)["'][^>]*>\s*/gi, '');
  if (t !== before) { writeFileSync(f, t); rewritten++; }
  left += (t.match(re) || []).filter((u) => HOSTS.test(u)).length;
}
console.log(`rewrote ${rewritten} pages · ${left} remote references left${failed.length ? ' · ' + failed.length + ' downloads failed' : ''}`);
failed.slice(0, 15).forEach((x) => console.log('  ! ' + x));
process.exit(left || failed.length ? 1 : 0);
