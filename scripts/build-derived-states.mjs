#!/usr/bin/env node
/**
 * Builds the states production never showed us by editing a live template: everything (header, title,
 * tabs, footer) stays exactly as captured and only the list block is replaced.
 *
 *   design-kit/templates/<layout>/saved-searches.html  → saved-searches-empty.html
 *   (favourites-empty was derived too until 2026-10-06; it is a real capture now)
 *
 * The replacement is marked data-authored so design-qa knows which part is ours. Copy and structure
 * come from the maple monorepo (favoriteAds.tsx: one bold Text.Large line, no image, no button); the
 * text size is a stand-in (Text.Large was not measured). Needs the two live templates, which are
 * account templates and stay local.
 *
 *   node scripts/build-derived-states.mjs
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/* favourites-empty is no longer derived: a real capture of an account with no favourites
   exists since 2026-10-06 (`favourites-empty` in live-templates.json) and showed the same
   "No favorites yet." line. The saved-searches empty state is still derived — the account
   captured as "empty" still held three saved searches. */
const STATES = [
  { from: 'saved-searches', to: 'saved-searches-empty', text: 'No saved searches yet.', card: 'text:Search keyword' },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
for (const layout of ['desktop', 'mobile']) {
  for (const s of STATES) {
    const src = join(ROOT, 'design-kit/templates', layout, `${s.from}.html`);
    if (!existsSync(src)) { console.log(`skip ${layout}/${s.from} (no live template on this machine)`); continue; }
    const page = await browser.newPage();
    await page.setViewport({ width: layout === 'desktop' ? 1440 : 390, height: 900 });
    await page.goto(pathToFileURL(src).href, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 500));
    const ok = await page.evaluate((s) => {
      const tabs = [...document.querySelectorAll('a,button')].filter((e) => /^(favourites|saved searches)$/i.test(e.textContent.trim()));
      if (tabs.length < 2) return 'tabs not found';
      let card = s.card === 'article' ? document.querySelector('article')
        : [...document.querySelectorAll('div,li,section')].filter((e) => e.textContent.includes('Search keyword')).pop();
      if (!card) return 'list not found';
      // climb to the top-most ancestor that still holds no tab, i.e. the whole list block
      let block = card;
      while (block.parentElement && !tabs.some((t) => block.parentElement.contains(t))) block = block.parentElement;
      const empty = document.createElement('div');
      empty.setAttribute('data-authored', '');
      empty.setAttribute('data-state', 'empty');
      empty.innerHTML = `<style data-authored>.dd-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 0;text-align:center;font-size:1.8rem;font-weight:700;line-height:2.4rem}.dd-empty p{margin:0}</style><div class="dd-empty"><p>${s.text}</p></div>`;
      block.replaceWith(document.createComment('authored:start'), empty, document.createComment('authored:end'));
      document.querySelectorAll('title').forEach((t) => (t.textContent = t.textContent));
      const note = document.createComment(` DERIVED from ${s.from}.html by scripts/build-derived-states.mjs — only the [data-authored] block is new. Copy from the maple monorepo, not verified on live. `);
      document.head.prepend(note);
      return 'ok';
    }, s);
    if (ok !== 'ok') { console.log(`FAILED ${layout}/${s.to}: ${ok}`); await page.close(); continue; }
    const html = '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
    writeFileSync(join(ROOT, 'design-kit/templates', layout, `${s.to}.html`), html);
    console.log(`built ${layout}/${s.to}.html`);
    await page.close();
  }
}
await browser.close();
