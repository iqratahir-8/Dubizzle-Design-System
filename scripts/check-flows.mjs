#!/usr/bin/env node
/**
 * Walks every stored flow in a real browser and fails on any transition that does not
 * land where the flow says — desktop at 1440, mobile at 390 with touch.
 *
 * A wired link can resolve to a page that exists and still go nowhere (a runtime that
 * swallows the click, a hotspot whose text is no longer on the page after a
 * re-capture). So this clicks, hovers, focuses, types and presses Escape for real, per
 * design-kit/flows/<section>.json, and compares the file the browser ends up on.
 *
 *   npm run check:flows                 every section
 *   npm run check:flows -- listings     one section
 *   CHROME_PATH=… to point at a browser; defaults to Playwright's Chromium or Chrome.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'design-kit');
const FLOWS = join(KIT, 'flows');
const CHROME =
  process.env.CHROME_PATH ||
  ['/opt/pw-browsers/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => existsSync(p));
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const files = readdirSync(FLOWS).filter((f) => f.endsWith('.json') && (!only.length || only.includes(f.replace(/\.json$/, ''))));
if (!files.length) {
  console.error('no flows found — run npm run build:flows first');
  process.exit(2);
}

/* No network at all: the templates still reference a few remote assets (fonts, ad
   pixels), a sandbox without network would wait on them, and the check needs nothing
   from live. Belt and braces — DNS mapped to nowhere, and every non-local request aborted. */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--host-resolver-rules=MAP * ~NOTFOUND', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
const VERBOSE = process.argv.includes('--verbose');
/* One tab per platform: toggling a tab between desktop and mobile emulation reloads it
   and races the next navigation. */
const tabs = {};
for (const platform of ['web-desktop', 'web-mobile']) {
  const p = await browser.newPage();
  await p.setRequestInterception(true);
  p.on('request', (r) => (r.url().startsWith('file://') || r.url().startsWith('data:') ? r.continue() : r.abort()));
  tabs[platform] = p;
}
let page = tabs['web-desktop'];
const VIEW = {
  'web-desktop': { width: 1440, height: 900 },
  'web-mobile': { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
let problems = 0;
let checked = 0;
let skipped = 0;
const clickedOnce = new Set();
const htmlCache = new Map();
const htmlOf = (file) => { if (!htmlCache.has(file)) htmlCache.set(file, readFileSync(join(KIT, file), 'utf8')); return htmlCache.get(file); };

const landed = () => decodeURIComponent(page.url().split('/').pop().split('?')[0]);
const settle = () => page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {});
const open = async (file, platform) => {
  page = tabs[platform];
  await page.setViewport(VIEW[platform]);
  await page.goto('file://' + join(KIT, file), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.mouse.move(VIEW[platform].width - 10, VIEW[platform].height - 10);
};
/* The centre of the control whose own text is exactly t, scrolled into view — only a copy
   the pointer can reach, within the page band if the rule has one. */
const centreOfText = (t, band) =>
  page.evaluate(
    (t, band) => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const el = n.parentElement;
        // the text node, or its element when the label is split ("Sort by" + ": ")
        if ((n.nodeValue.trim() !== t && el.textContent.trim() !== t) || el.tagName === 'SCRIPT') continue;
        const r0 = el.getBoundingClientRect();
        if (r0.width === 0) continue;
        if (band) { const y = r0.top + scrollY; if (y < band[0] || y > band[1]) continue; }
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        if (hit && (el.contains(hit) || hit.contains(el))) return [x, y];
      }
      return null;
    },
    t,
    band || null,
  );
const centreOfSelector = (sel) =>
  page.evaluate((sel) => {
    // only a copy the pointer can reach (a hidden sticky header holds duplicates)
    for (const el of document.querySelectorAll(sel)) {
      if (el.getBoundingClientRect().width === 0) continue;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (hit && (el.contains(hit) || hit.contains(el))) return [x, y];
    }
    return null;
  }, sel);

for (const f of files) {
  const flow = JSON.parse(readFileSync(join(FLOWS, f), 'utf8'));
  console.log(`\n${flow.label.toUpperCase()} — ${flow.transitions.length} transitions\n`);
  let ok = 0;
  for (const t of flow.transitions) {
    const from = flow.screens[t.from];
    const to = flow.screens[t.to] || flow.exits[t.to];
    if (!from || !to) { skipped++; continue; }
    const want = to.file.split('/').pop();
    let how = '';
    let outcome;
    /* A wired link is checked statically (the anchor is there and its file exists); one
       real click per page proves the runtime lets links through. Clicking all ~1,400
       would take most of an hour for the same answer. */
    if (t.kind === 'link' && clickedOnce.has(from.file)) {
      how = `link → ${to.page}`;
      outcome = htmlOf(from.file).includes(`data-proto-link="${to.page}"`) && existsSync(join(KIT, to.file)) ? want : 'link missing';
      checked++;
      if (outcome === want) ok++;
      else { problems++; console.log(`  FAIL ${from.platform === 'web-mobile' ? 'm ' : 'd '}${t.from.padEnd(26)} ${how.padEnd(44)} → ${outcome}`); }
      continue;
    }
    if (VERBOSE) console.log(`  … ${t.from} → ${t.to} (${t.kind})`);
    await open(from.file, from.platform);
    try {
      if (t.kind === 'link') {
        const target = to.page;
        clickedOnce.add(from.file);
        const clicked = await page.evaluate((target) => {
          const a = document.querySelector(`a[data-proto-link="${target}"]`);
          if (!a) return false;
          a.click();
          return true;
        }, target);
        how = `link → ${target}`;
        if (!clicked) outcome = 'link missing';
        else { await settle(); outcome = landed(); }
      } else if (t.trigger.text) {
        how = `click “${t.trigger.text}”`;
        const c = await centreOfText(t.trigger.text, t.trigger.band);
        if (!c) outcome = 'control not found';
        else { await Promise.all([settle(), page.mouse.click(...c)]); outcome = landed(); }
      } else if (t.trigger.hover) {
        how = `hover “${t.trigger.hover}”`;
        const c = await centreOfText(t.trigger.hover, t.trigger.band);
        if (!c) outcome = 'control not found';
        else { await page.mouse.move(...c); await settle(); outcome = landed(); }
      } else if (t.trigger.selector) {
        const ev = t.trigger.event || 'click';
        how = `${ev} ${t.trigger.selector}`;
        const c = await centreOfSelector(t.trigger.selector);
        if (!c) outcome = 'control not found';
        else if (ev === 'click') { await Promise.all([settle(), page.mouse.click(...c)]); outcome = landed(); }
        else if (ev === 'focus') { await page.mouse.click(...c); await settle(); outcome = landed(); }
        else if (ev === 'input') { await page.mouse.click(...c); await Promise.all([settle(), page.keyboard.type('t')]); outcome = landed(); }
      } else if (t.trigger.box) {
        const b = t.trigger.box;
        how = `tap box ${b.join(',')}`;
        await Promise.all([settle(), page.mouse.click((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)]);
        outcome = landed();
      } else if (t.trigger.key) {
        how = `press ${t.trigger.key}`;
        await Promise.all([settle(), page.keyboard.press(t.trigger.key)]);
        outcome = landed();
      } else if (t.trigger.outside) {
        how = `click outside “${t.trigger.outside}”`;
        // a point in the page's top-left corner, below the header, is outside any centred panel
        const v = VIEW[from.platform];
        const c = await centreOfText(t.trigger.outside);
        const point = c ? [8, Math.min(v.height - 8, Math.max(c[1] + 300, 160))] : [8, 400];
        await Promise.all([settle(), page.mouse.click(...point)]);
        outcome = landed();
      } else {
        skipped++;
        continue;
      }
    } catch (e) {
      outcome = `error: ${e.message.split('\n')[0]}`;
    }
    checked++;
    const pass = outcome === want;
    if (pass) ok++;
    else {
      problems++;
      console.log(`  FAIL ${from.platform === 'web-mobile' ? 'm ' : 'd '}${t.from.padEnd(26)} ${how.padEnd(44)} → ${outcome} (wanted ${want})`);
    }
  }
  console.log(`  ${ok}/${flow.transitions.length} ok`);
}

await browser.close();
console.log(`\n${checked} transitions checked, ${skipped} skipped (screen not built here) · ${problems ? `${problems} FAILED` : 'all flows OK'}`);
process.exit(problems ? 1 : 0);
