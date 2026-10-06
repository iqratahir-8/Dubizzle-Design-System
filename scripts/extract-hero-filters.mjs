#!/usr/bin/env node
/**
 * Reads the consumer landing pages' hero dropdowns off live — the options each offers
 * and the computed style of its open menu — into design-kit/content/hero-filters.json.
 * The prototype's hero runtime (scripts/lib/prototype-hero.mjs) prefers this file over
 * its captured-vocabulary fallbacks, so once it exists every hero menu is dubizzle's own
 * list in dubizzle's own menu style, including the ones no capture holds today
 * (property Beds / Bathrooms, Area, Price; New Cars' Fuel Economy).
 *
 * Read-only on public pages: opens a dropdown, reads it, closes it. Never searches,
 * never picks. Runs in the capture Chrome (npm run capture:login opens it; signing in
 * is NOT required for these pages). The sandbox cannot reach dubizzle.com.eg — run it
 * on the Mac, then `npm run wire:prototype` and commit the json.
 *
 *   npm run extract:hero-filters
 */
import { writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectToSession, ORIGIN } from './capture-session.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design-kit/content/hero-filters.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// page → url + the hero dropdowns on it (their resting label on live)
const PAGES = {
  motors: { url: '/en/motors/', dropdowns: ['Transmission'] },
  'new-cars': { url: '/en/motors/new-cars/', dropdowns: ['Transmission', 'Body Type', 'Fuel Economy'] },
  'property-landing': { url: '/en/realestate/', dropdowns: ['Beds / Bathrooms', 'Area (m²)', 'Price (EGP)'] },
};
const PHONE = /(?<!\d)(?:(?:\+|00)?20[ \t-]?)?0?1[0125](?:[ \t-]?\d){8}(?!\d)/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const browser = await connectToSession();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const out = { source: ORIGIN, extracted: new Date().toISOString().slice(0, 10), pages: {} };

try {
  for (const [name, { url, dropdowns }] of Object.entries(PAGES)) {
    await page.goto(ORIGIN + url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);
    out.pages[name] = {};
    for (const label of dropdowns) {
      const target = await page.evaluate((label) => {
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const el = [...document.querySelectorAll('button, [role="button"]')].find((b) => norm(b.textContent) === label && b.getBoundingClientRect().width > 40);
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        el.setAttribute('data-harvest-box', '1');
        window.__before = new Set(document.querySelectorAll('body *'));
        const b = el.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }, label);
      let res;
      if (!target) res = { error: 'not found' };
      else {
        await page.mouse.click(target.x, target.y); // real pointer input: these open on mousedown
        await sleep(1500);
        res = await page.evaluate(() => {
          const box = document.querySelector('[data-harvest-box]');
          box.removeAttribute('data-harvest-box');
          const fresh = [...document.querySelectorAll('body *')].filter((e) => !window.__before.has(e) && e.getBoundingClientRect().height > 0);
          const fb = box.getBoundingClientRect();
          // the menu is the new element hanging off the field, overlapping it horizontally
          const near = (e) => { const r = e.getBoundingClientRect(); return r.height > 30 && r.top >= fb.bottom - 12 && r.top <= fb.bottom + 60 && r.left < fb.right + 20 && r.right > fb.left - 20 && r.width < 900; };
          const top = fresh.filter((e) => !fresh.includes(e.parentElement) && near(e));
          const panel = top.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
          if (!panel) return { error: 'nothing opened' };
          const leaves = [...panel.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim());
          const options = [...new Set(leaves.map((e) => e.textContent.trim()))].slice(0, 80);
          const row = leaves.find((e) => e.textContent.trim() === options[options.length > 1 ? 1 : 0]);
          let rowBox = row;
          for (let i = 0; i < 4 && rowBox && rowBox.getBoundingClientRect().height < 32; i++) rowBox = rowBox.parentElement;
          const pick = (el, keys) => { const cs = getComputedStyle(el); return Object.fromEntries(keys.map((k) => [k, cs[k]])); };
          const pb = panel.getBoundingClientRect();
          const inputs = [...panel.querySelectorAll('input')].map((i) => i.type + (i.placeholder ? ':' + i.placeholder : ''));
          return {
            options, inputs,
            style: {
              panel: { ...pick(panel, ['backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'boxShadow', 'paddingTop', 'paddingLeft', 'maxHeight']), width: Math.round(pb.width), height: Math.round(pb.height), offsetY: Math.round(pb.top - fb.bottom), fieldWidth: Math.round(fb.width) },
              row: row ? { ...pick(rowBox, ['paddingTop', 'paddingLeft', 'backgroundColor']), height: Math.round(rowBox.getBoundingClientRect().height), ...pick(row, ['fontSize', 'fontWeight', 'color', 'lineHeight']) } : null,
            },
          };
        }).catch((e) => ({ error: e.message }));
        await page.keyboard.press('Escape').catch(() => {});
        await sleep(400);
        await page.mouse.click(5, 5); // click outside, in case Escape is ignored
        await sleep(400);
      }
      if (res.options) {
        const bad = res.options.filter((o) => PHONE.test(o) || EMAIL.test(o));
        if (bad.length) { res.options = res.options.filter((o) => !bad.includes(o)); res.dropped = bad.length; }
      }
      out.pages[name][label] = res;
      console.log(`  ${name} · ${label}: ${res.error || `${res.options.length} options — ${res.options.slice(0, 6).join(' | ')}`}`);
    }
  }
} finally {
  await page.close();
  await browser.disconnect();
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`\nwrote ${OUT} — now: npm run wire:prototype, check the menus, commit the json`);
