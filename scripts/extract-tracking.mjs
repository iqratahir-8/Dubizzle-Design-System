#!/usr/bin/env node
/**
 * Reads which analytics events a live dubizzle site actually sends, read-only, public pages only.
 *
 * Opens each page in a throwaway Chrome profile, scrolls it, and records:
 *   - every GA4 hit (…/g/collect, GET or batched POST): event name `en` and parameter keys
 *     (`ep.*` string, `epn.*` number), plus the measurement id `tid`;
 *   - every GTM container id seen (gtm.js?id=GTM-…);
 *   - the window.dataLayer entries' event names and keys.
 * It never signs in, never clicks anything, and never stores client/user/session ids
 * (`cid`, `uid`, `sid`, `_p`, …) or parameter values — only names, counts and one short example
 * per parameter with digits masked, so a phone number in a search term cannot be kept.
 *
 * Output: design-kit/analytics/live/<TENANT>.json, and with --write it marks the matching catalog
 * events `observed_live.<TENANT>` and fills tenants.json ga4.measurement_id / gtm_container when
 * they are still null (never overwrites a recorded value).
 *
 *   npm run extract:tracking -- --tenant=EG                      # home + the EG capture manifest's public pages
 *   npm run extract:tracking -- --tenant=KW --paths=/en/,/en/vehicles/cars-for-sale/
 *   npm run extract:tracking -- --tenant=EG --write
 *
 * Needs network access to the tenant origin and a Chrome (CHROME_PATH, the Mac default, or
 * Playwright's Chromium).
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { LAYOUTS, sleep, scrollThrough } from './lib/render-helpers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const A = join(ROOT, 'design-kit/analytics');
const tenantsFile = join(A, 'tenants.json');
const catalogFile = join(A, 'event-catalog.json');
const tenants = JSON.parse(readFileSync(tenantsFile, 'utf8'));
const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const code = String(args.tenant || '').toUpperCase();
const t = tenants.tenants[code];
if (!t) {
  console.error(`--tenant must be one of ${Object.keys(tenants.tenants).join(', ')}`);
  process.exit(2);
}
const layouts = args.layout ? [args.layout] : Object.keys(LAYOUTS);

/** Pages: --paths, or for EG the public pages of the capture manifest, else just /en/. */
function pages() {
  if (args.paths) return String(args.paths).split(',').map((p) => new URL(p, t.origin).href);
  if (code === 'EG') {
    const m = JSON.parse(readFileSync(join(ROOT, 'design-kit/reference/capture-manifest.json'), 'utf8'));
    const pub = Object.assign({}, m.tiers['1'] || {}, m.tiers['2'] || {});
    const urls = Object.values(pub).map((u) => (typeof u === 'string' ? u : u?.url)).filter(Boolean);
    if (urls.length) return [...new Set(urls.map((u) => new URL(u, t.origin).href))].slice(0, 12);
  }
  return [new URL('/en/', t.origin).href];
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(pw)) {
    const d = readdirSync(pw).filter((x) => /^chromium-\d+/.test(x)).sort().pop();
    if (d) return join(pw, d, 'chrome-linux/chrome');
  }
  throw new Error('no Chrome found — set CHROME_PATH');
}

const DROP = new Set(['cid', 'uid', 'sid', '_p', '_s', 'sct', 'seg', 'dl', 'dr', 'dt', 'ul', 'sr', '_et', 'tfd', 'gcs', 'gcd', 'dma', 'npa', 'frm', 'pscdl', '_fv', '_ss', '_nsi', '_eu', 'gtm', 'v', '_dbg', 'are', 'richsstsse', 'uaa', 'uab', 'uafvl', 'uam', 'uamb', 'uap', 'uapv', 'uaw', 'ecid']);
/** Collected by GA4 itself (automatic + enhanced measurement): reported, never proposed for the catalog. */
const AUTO = new Set(['page_view', 'scroll', 'user_engagement', 'session_start', 'first_visit', 'click', 'file_download', 'form_start', 'form_submit', 'view_search_results', 'video_start', 'video_progress', 'video_complete']);
const mask = (v) => String(v).slice(0, 40).replace(/\d/g, '#');

const seen = { events: {}, measurement_ids: new Set(), gtm_containers: new Set(), datalayer_events: {} };
function addHit(qs) {
  const p = new URLSearchParams(qs);
  const en = p.get('en');
  if (p.get('tid')) seen.measurement_ids.add(p.get('tid'));
  if (!en) return;
  const e = (seen.events[en] ||= { count: 0, params: {} });
  e.count += 1;
  for (const [k, v] of p) {
    const m = k.match(/^(ep|epn)\.(.+)$/);
    if (!m || DROP.has(k)) continue;
    e.params[m[2]] ||= { type: m[1] === 'epn' ? 'number' : 'string', example: mask(v) };
  }
}

const profile = mkdtempSync(join(tmpdir(), 'dz-track-'));
const browser = await puppeteer.launch({ executablePath: chromePath(), userDataDir: profile, headless: 'new', args: ['--no-first-run'] });
try {
  for (const layout of layouts) {
    for (const url of pages()) {
      const page = await browser.newPage();
      await page.setViewport(LAYOUTS[layout].viewport || { width: 1280, height: 900 });
      if (LAYOUTS[layout].userAgent) await page.setUserAgent(LAYOUTS[layout].userAgent);
      page.on('request', (r) => {
        const u = r.url();
        if (/\/g\/collect/.test(u)) {
          const qs = u.split('?')[1] || '';
          const body = r.postData();
          if (body) {
            for (const line of body.split('\n')) if (line.trim()) addHit(`${qs}&${line}`);
          } else {
            addHit(qs);
          }
        }
        const g = u.match(/gtm\.js\?id=(GTM-[A-Z0-9]+)/);
        if (g) seen.gtm_containers.add(g[1]);
      });
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await scrollThrough(page);
        await sleep(3000);
        const dl = await page.evaluate(() => (window.dataLayer || []).map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? { event: x.event || null, keys: Object.keys(x) } : null)).filter(Boolean));
        for (const d of dl) {
          if (!d.event || /^gtm\./.test(d.event)) continue;
          const e = (seen.datalayer_events[d.event] ||= { count: 0, keys: [] });
          e.count += 1;
          e.keys = [...new Set([...e.keys, ...d.keys.filter((k) => k !== 'event')])];
        }
        console.log(`${layout.padEnd(8)} ${url}`);
      } catch (err) {
        console.warn(`${layout.padEnd(8)} ${url}  FAILED: ${err.message}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  rmSync(profile, { recursive: true, force: true });
}

const out = {
  tenant: code, origin: t.origin, extracted_at: new Date().toISOString(), pages: pages(), layouts,
  note: 'Page loads and scrolling only — events that need a click, a login or a form are not observed here.',
  measurement_ids: [...seen.measurement_ids], gtm_containers: [...seen.gtm_containers],
  ga4_events: seen.events, datalayer_events: seen.datalayer_events,
};
mkdirSync(join(A, 'live'), { recursive: true });
writeFileSync(join(A, 'live', `${code}.json`), JSON.stringify(out, null, 2) + '\n');

const names = new Set([...Object.keys(seen.events), ...Object.keys(seen.datalayer_events)]);
const inCat = catalog.events.filter((e) => names.has(e.name)).map((e) => e.name);
const notInCat = [...names].filter((n) => !AUTO.has(n) && !catalog.events.some((e) => e.name === n));
console.log(`\n${code}: ${names.size} event names observed; in catalog: ${inCat.join(', ') || 'none'}`);
if (notInCat.length) console.log(`live but not in the catalog (add through event-taxonomy, keep live names): ${notInCat.join(', ')}`);
console.log(`GA4 measurement ids: ${out.measurement_ids.join(', ') || 'none seen'} · GTM: ${out.gtm_containers.join(', ') || 'none seen'}`);

if (args.write) {
  const day = out.extracted_at.slice(0, 10);
  for (const e of catalog.events) if (names.has(e.name)) (e.observed_live ||= {})[code] = day;
  writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
  const ga = tenants.tenants[code].ga4;
  if (!ga.measurement_id && out.measurement_ids.length === 1) ga.measurement_id = out.measurement_ids[0];
  if (!ga.gtm_container && out.gtm_containers.length === 1) ga.gtm_container = out.gtm_containers[0];
  writeFileSync(tenantsFile, JSON.stringify(tenants, null, 2) + '\n');
  console.log(`--write: marked ${inCat.length} catalog event(s) observed on ${code}; tenants.json ids filled only where empty and unambiguous.`);
}
