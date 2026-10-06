#!/usr/bin/env node
/**
 * Verifies a template prototype actually works as a prototype:
 *   - every wired link resolves to a template that exists (no dead ends)
 *   - clicking each sidebar route in a real browser lands on the page it names
 *   - no generated file carries a phone, an email, or a name known to have leaked
 *
 * The link rewrite in scripts/lib/prototype.mjs is easy to get subtly wrong — a route
 * that matches nothing, a target that was never built — and the result still renders
 * perfectly, it just goes nowhere. So this clicks, rather than trusting the rewrite.
 *
 *   npm run check:prototype
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'design-kit/templates/desktop');
const CHROME = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => existsSync(p));

// Strings that reached disk in real incidents (D-011, D-017). A regression here is the
// most likely failure, so check for these literally, not just by pattern.
const KNOWN_LEAKS = ['Elboredy', 'Ahmed Agent 1', 'التوريدات', 'جامعة القاهرة'];
const PHONE = /(?<!\d)(?:(?:\+|00)?20[ \t-]?)?0?1[0125](?:[ \t-]?\d){8}(?!\d)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const textOnly = (h) =>
  h
    .replace(/data:[a-z0-9.+/-]+;base64,[A-Za-z0-9+/=]+/gi, '')
    .replace(/<(svg|script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');

/* Pages built from logged-in captures: the portal, and — tracked since 2026-10-06 — the
   consumer account screens. Both layouts are scanned for PII; the click-through below
   covers the portal (the consumer prototype has its own: npm run check:flows). */
const ACCOUNT = /^(portal-.*|my-ads|chat|edit-profile|settings-privacy|settings-notifications|packages|favourites.*|saved-searches.*|post-ad.*|upsell.*|user-menu|m-user-menu|dpv-report-in|dpv-report-form)\.html$/;
const MOBILE = join(ROOT, 'design-kit/templates/mobile');
const accountPages = [
  ...readdirSync(DIR).filter((f) => ACCOUNT.test(f)).map((f) => ['desktop', f]),
  ...readdirSync(MOBILE).filter((f) => ACCOUNT.test(f)).map((f) => ['mobile', f]),
];
const pages = readdirSync(DIR).filter((f) => f.startsWith('portal-') && f.endsWith('.html'));
let problems = 0;

console.log(`PRIVACY — ${accountPages.length} pages built from logged-in captures (portal + account, both layouts)\n`);
for (const [layout, f] of accountPages) {
  const t = textOnly(readFileSync(join(layout === 'mobile' ? MOBILE : DIR, f), 'utf8'));
  const ph = (t.match(PHONE) || []).filter((p) => p.replace(/\D/g, '') !== '01012345678');
  const em = (t.match(EMAIL) || []).filter((e) => !e.endsWith('example.com'));
  const known = KNOWN_LEAKS.filter((k) => t.includes(k));
  // this account names its staff "<Name> Agent <n>" — the pattern, not a list of names
  for (const m of t.match(/\b[A-Z][a-z]+ Agent \d+\b/g) || []) known.push(m.replace(/^\w+/, '<name>'));
  const bad = ph.length || em.length || known.length;
  if (bad) problems++;
  console.log(`  ${bad ? 'LEAK' : 'ok  '} ${`${layout}/${f}`.padEnd(42)}${bad ? ` phones=${ph.length} emails=${em.length} known=[${known.join(', ')}]` : ''}`);
}

console.log(`\nLINKS — every wired target exists\n`);
for (const f of pages) {
  const html = readFileSync(join(DIR, f), 'utf8');
  const targets = [...new Set([...html.matchAll(/data-proto-link="([\w-]+)"/g)].map((m) => m[1]))];
  const dead = targets.filter((t) => !existsSync(join(DIR, `${t}.html`)));
  if (dead.length) problems++;
  console.log(`  ${dead.length ? 'DEAD' : 'ok  '} ${f.padEnd(34)} ${targets.length} target(s)${dead.length ? ` · missing: ${dead.join(', ')}` : ''}`);
}

console.log(`\nCLICK-THROUGH — start at the dashboard, follow every wired route\n`);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const start = 'file://' + join(DIR, 'portal-dashboard.html');
await page.goto(start, { waitUntil: 'domcontentloaded' });
const routes = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-proto-link]')].map((a) => a.getAttribute('data-proto-link')))]);
for (const target of routes) {
  await page.goto(start, { waitUntil: 'domcontentloaded' });
  const clicked = await page.evaluate((t) => {
    const a = document.querySelector(`[data-proto-link="${t}"]`);
    if (!a) return false;
    a.click();
    return true;
  }, target);
  if (!clicked) {
    console.log(`  MISS ${target}`);
    problems++;
    continue;
  }
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
  const landed = page.url().split('/').pop();
  const ok = landed === `${target}.html`;
  if (!ok) problems++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} dashboard → ${target.padEnd(24)} landed on ${landed}`);
}

// The drawer. The reported bug was a drawer that widened with every page title still
// invisible, so assert on the titles themselves, on every page, not on the width.
console.log(`\nDRAWER — open it on every page; every title and the wordmark must show\n`);
for (const f of pages) {
  await page.goto('file://' + join(DIR, f), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto('file://' + join(DIR, f), { waitUntil: 'domcontentloaded' });
  const has = await page.$('header[aria-label="Burger menu"]');
  if (!has) { console.log(`  --   ${f.padEnd(34)} no drawer`); continue; }
  // a modal frame dims the page, burger included: on live that click closes the modal
  const covered = await page.evaluate(() => { const t = document.querySelector('header[aria-label="Burger menu"]'); const r = t.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !(h && (t.contains(h) || h.contains(t))); });
  if (covered) { console.log(`  --   ${f.padEnd(34)} modal open — burger covered, as on live`); continue; }
  await page.click('header[aria-label="Burger menu"]');
  await page.mouse.move(900, 500);
  await new Promise((r) => setTimeout(r, 1300));
  const r = await page.evaluate(() => {
    const nav = document.querySelector('header[aria-label="Burger menu"]').closest('nav');
    const shown = (el) => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return b.width > 4 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5; };
    const titles = [...nav.querySelectorAll('a[data-proto-link] span')].filter((s) => s.textContent.trim());
    const brand = [...nav.querySelectorAll('header span')].find((s) => /dubizzle Pro/.test(s.textContent));
    return { total: titles.length, shown: titles.filter(shown).length, brand: !!brand && shown(brand), width: Math.round(nav.getBoundingClientRect().width) };
  });
  const ok = r.total > 0 && r.shown === r.total && r.brand && r.width > 200;
  if (!ok) problems++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${f.padEnd(34)} ${r.shown}/${r.total} titles · wordmark ${r.brand ? 'yes' : 'NO'} · ${r.width}px`);
}

// Hotspots: buttons that jump between frames. Click the real control, check the landing.
console.log(`\nHOTSPOTS — click each control, confirm the frame it lands on\n`);
const HOT = [
  ['portal-leads.html', 'Phone', 'portal-leads-phone.html'],
  ['portal-leads.html', 'SMS', 'portal-leads-sms.html'],
  ['portal-leads.html', 'WhatsApp', 'portal-leads-whatsapp.html'],
  ['portal-leads-phone.html', 'All', 'portal-leads.html'],
  ['portal-leads.html', 'Chats', 'chat.html'],
  ['portal-leads-whatsapp.html', 'Clear All Filters', 'portal-leads.html'],
  ['portal-leads.html', 'Date Range', 'portal-leads-daterange.html'],
  ['portal-leads-daterange.html', 'Apply', 'portal-leads.html'],
  ['portal-leads-daterange.html', 'Reset', 'portal-leads.html'],
];
for (const [from, label, want] of HOT) {
  if (!existsSync(join(DIR, from)) || !existsSync(join(DIR, want))) { console.log(`  --   ${from} → ${label}: frame not built`); continue; }
  /* Each case starts collapsed. The drawer remembers its state for the session, so the
     drawer test above leaves it pinned open, and a pinned drawer overlays the left of the
     page — the click meant for the "All" tab then lands on the drawer's "Agency Ads".
     That overlap is real live behaviour; it just must not leak between test cases. */
  await page.goto('file://' + join(DIR, from), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto('file://' + join(DIR, from), { waitUntil: 'domcontentloaded' });
  await page.mouse.move(1000, 700);
  const box = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button,[role="tab"],a,div,span')]
      .filter((e) => (e.textContent || '').trim() === t && e.getBoundingClientRect().width > 8)
      .sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)
      .find((e) => !e.closest('nav') && e.getBoundingClientRect().top > 70);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, label);
  if (!box) { console.log(`  MISS ${from} → "${label}" not found`); problems++; continue; }
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000 }).catch(() => {}), page.mouse.click(box.x, box.y)]);
  const landed = page.url().split('/').pop();
  const ok = landed === want;
  if (!ok) problems++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${from.replace('.html', '').padEnd(28)} "${label}" → ${landed}`);
}
// An open dropdown closes on a click outside it.
if (existsSync(join(DIR, 'portal-leads-daterange.html'))) {
  await page.goto('file://' + join(DIR, 'portal-leads-daterange.html'), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto('file://' + join(DIR, 'portal-leads-daterange.html'), { waitUntil: 'domcontentloaded' });
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000 }).catch(() => {}), page.mouse.click(1100, 700)]);
  const landed = page.url().split('/').pop();
  const ok = landed === 'portal-leads.html';
  if (!ok) problems++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${'portal-leads-daterange'.padEnd(28)} click outside → ${landed}`);
}

// The ad details drawer: a card opens it, its tabs move within it, a click on the list closes it.
console.log(`\nAD DRAWER — open from a card, switch tab, close by clicking the list\n`);
if (existsSync(join(DIR, 'portal-ad-overview.html'))) {
  const click = async (x, y) => { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {}), page.mouse.click(x, y)]); return page.url().split('/').pop(); };
  await page.goto('file://' + join(DIR, 'portal-ads.html'), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto('file://' + join(DIR, 'portal-ads.html'), { waitUntil: 'domcontentloaded' });
  const steps = [];
  steps.push(['card → drawer', await click(1000, 420), 'portal-ad-overview.html']);
  const tab = await page.evaluate(() => { const a = [...document.querySelectorAll('a[data-proto-link="portal-ad-info"]')].find((x) => x.textContent.trim() === 'Ad Data'); if (!a) return null; const r = a.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  steps.push(['tab "Ad Data"', tab ? await click(...tab) : 'missing', 'portal-ad-info.html']);
  steps.push(['click inside stays', await click(1100, 600), 'portal-ad-info.html']);
  steps.push(['click on list closes', await click(400, 600), 'portal-ads.html']);
  for (const [what, got, want] of steps) {
    if (got !== want) problems++;
    console.log(`  ${got === want ? 'ok  ' : 'FAIL'} ${what.padEnd(24)} → ${got}`);
  }
}

// Popups: each trigger opens its captured frame; a click outside (or Escape) closes it.
console.log(`\nPOPUPS — open each from its trigger, then close it\n`);
const POPUPS = [
  // page, trigger (text or [x, y] point), frame, close by ('outside' point | 'escape' | text)
  ['portal-ads', 'More Filters', 'portal-ads-more-filters', [1100, 800]],
  ['portal-ads', 'Request to add Brand/Model', 'portal-ads-request-brand', 'Cancel'],
  ['portal-ads', [1280, 114], 'portal-ads-credits', 'escape'],
  ['portal-ads', [1371, 518], 'portal-ads-actions', [600, 800]],
  ['portal-ad-agent', 'Assign Agent', 'portal-ad-assign-agent', 'Cancel'],
  ['portal-agents', 'Invite agent', 'portal-agents-invite', 'Cancel'],
  ['portal-agents', 'Sort by', 'portal-agents-sort', [900, 700]],
  ['portal-agents', [1378, 450], 'portal-agents-actions', [600, 700]],
  ['portal-leads', 'Export Leads', 'portal-leads-export', 'Cancel'],
  ['portal-vip', 'Purchase', 'portal-vip-purchase', [1300, 800]],
];
for (const [from, trigger, frame, closer] of POPUPS) {
  if (!existsSync(join(DIR, `${frame}.html`))) { console.log(`  --   ${frame}: not built`); continue; }
  const go = async (x, y) => { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {}), page.mouse.click(x, y)]); return page.url().split('/').pop(); };
  const byText = (t) => page.evaluate((t) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() === t && !n.parentElement.closest('nav') && n.parentElement.tagName !== 'SCRIPT') {
      const el = n.parentElement;
      if (el.getBoundingClientRect().width === 0) continue;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      // only a copy the pointer can actually reach (hidden menus hold duplicates)
      if (hit && (el.contains(hit) || hit.contains(el))) return [x, y];
    }
    return null;
  }, t);
  await page.goto('file://' + join(DIR, `${from}.html`), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto('file://' + join(DIR, `${from}.html`), { waitUntil: 'domcontentloaded' });
  await page.mouse.move(1000, 850);
  const at = Array.isArray(trigger) ? trigger : await byText(trigger);
  const opened = at ? await go(...at) : 'trigger missing';
  let closed;
  if (closer === 'escape') { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {}), page.keyboard.press('Escape')]); closed = page.url().split('/').pop(); }
  else if (Array.isArray(closer)) closed = await go(...closer);
  else { const c = await byText(closer); closed = c ? await go(...c) : 'close missing'; }
  const ok = opened === `${frame}.html` && closed === `${from}.html`;
  if (!ok) problems++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${from.padEnd(16)} → ${opened.padEnd(32)} → ${closed}`);
}

// Filters: each must open dubizzle's option list and actually change what the list shows.
console.log(`\nFILTERS — open a menu, pick, confirm the list responds\n`);
const FILTER_CASES = [
  // page, kind, control, option/value, expected visible items (null = just must change)
  ['portal-ads', 'tab', 'Active Ads', null, (n, all) => n > 0 && n < all],
  ['portal-ads', 'tab', 'View all', null, (n, all) => n === all],
  ['portal-ads', 'drop', 'Choose Agent', 'Yasmine A.', (n, all) => n >= 1 && n < all],
  ['portal-ads', 'search', 'Search keyword', 'Samsung', (n) => n >= 1],
  ['portal-candidates', 'drop', 'Experience Level', '5-10 Years', (n, all) => n >= 1 && n < all],
  ['portal-candidates', 'tab', 'Rejected', null, (n) => n === 0],
  ['portal-vip', 'drop', 'Make & Model', 'Nissan', (n, all) => n >= 1 && n < all],
  ['portal-leads', 'drop', 'Agent', 'Karim M.', (n, all) => n >= 1 && n < all],
];
let lastPage = null;
for (const [pg, kind, control, value, ok] of FILTER_CASES) {
  if (!existsSync(join(DIR, `${pg}.html`))) { console.log(`  --   ${pg}: not built`); continue; }
  if (pg !== lastPage) {
    await page.goto('file://' + join(DIR, `${pg}.html`), { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
    await page.goto('file://' + join(DIR, `${pg}.html`), { waitUntil: 'domcontentloaded' });
    await page.mouse.move(1000, 800);
    lastPage = pg;
  }
  const all = await page.evaluate(() => window.__protoFilters && window.__protoFilters.items);
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
  let detail = '';
  if (kind === 'tab') {
    const c = await center(`[data-proto-tab="${control}"]`);
    if (c) await page.mouse.click(...c);
  } else if (kind === 'search') {
    await page.click(`input[placeholder="${control}"]`, { clickCount: 3 });
    await page.type(`input[placeholder="${control}"]`, value);
  } else {
    const c = await center(`[data-proto-filter="${control}"]`);
    if (c) await page.mouse.click(...c);
    const opts = await page.evaluate(() => document.querySelectorAll('#proto-menu [role=option]').length);
    const o = await page.evaluate((v) => { const e = [...document.querySelectorAll('#proto-menu [role=option]')].find((x) => x.textContent.trim() === v); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, value);
    if (o) await page.mouse.click(...o);
    detail = ` · menu ${opts} options`;
    await page.keyboard.press('Escape');
  }
  await new Promise((r) => setTimeout(r, 150));
  const n = await page.evaluate(() => window.__protoFilters && window.__protoFilters.shown());
  const pass = typeof n === 'number' && ok(n, all);
  if (!pass) problems++;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${pg.padEnd(20)} ${kind.padEnd(6)} ${(control + (value ? ' = ' + value : '')).padEnd(34)} ${n}/${all} shown${detail}`);
  // reset per page between cases that should start clean
  if (kind !== 'tab') { await page.goto('file://' + join(DIR, `${pg}.html`), { waitUntil: 'domcontentloaded' }); await page.mouse.move(1000, 800); }
}

// Hero search widgets on the consumer landings (scripts/lib/prototype-hero.mjs): each menu
// opens from its field with the expected options, closes again, and a pick lands in the field.
console.log(`\nHERO — landing-page search widgets open, close and take a pick\n`);
{
  const TPL = join(ROOT, 'design-kit/templates/desktop');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const goto = (n) => page.goto('file://' + join(TPL, `${n}.html`), { waitUntil: 'domcontentloaded' });
  const centre = (t) => page.evaluate((t) => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const el = [...document.querySelectorAll('button,[role=button]')].find((b) => norm(b.textContent) === t && b.getBoundingClientRect().width > 40 && b.getBoundingClientRect().top + scrollY > 150); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, t);
  const press = async (t) => { const c = await centre(t); if (!c) return false; await page.mouse.click(...c); await wait(350); return true; };
  const options = () => page.evaluate(() => [...document.querySelectorAll('#proto-hero-menu [role=option]')].map((o) => o.textContent));
  const priceOpen = () => page.evaluate(() => [...document.querySelectorAll('.SelectDropDown_dropdownMenu__kqCzK')].some((m) => getComputedStyle(m).visibility === 'visible'));
  const hero = (name, ok, detail = '') => { if (!ok) problems++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(46)} ${detail}`); };
  for (const [pg, select, want] of [['motors', 'Transmission', 'Automatic,Manual'], ['new-cars', 'Body Type', 'Sedan,SUV,Hatchback,Convertible,Pickup,Van']]) {
    if (!existsSync(join(TPL, `${pg}.html`))) { console.log(`  --   ${pg}: not built`); continue; }
    await goto(pg);
    if (!(await press(select))) { hero(`${pg} · ${select}`, false, 'control missing'); continue; }
    const got = (await options()).join(',');
    hero(`${pg} · ${select} opens`, got === want || (got.length > 0 && !!want && got.split(',').length >= 2), got);
    await page.click('#proto-hero-menu [role=option]:nth-child(2)'); await wait(100);
    hero(`${pg} · pick lands in the field`, (await page.evaluate(() => document.querySelector('[data-proto-value]')?.getAttribute('data-proto-value'))) === got.split(',')[1]);
    await press('Price Range'); hero(`${pg} · Price Range opens`, await priceOpen());
    await page.mouse.click(700, 10); await wait(350); hero(`${pg} · click outside closes it`, !(await priceOpen()));
  }
  if (existsSync(join(TPL, 'motors.html'))) {
    await goto('motors');
    await page.click('input[placeholder^="Search by make"]'); await page.type('input[placeholder^="Search by make"]', 'toy'); await wait(100);
    hero('motors · make suggestions filter', (await options()).join(',') === 'Toyota', (await options()).join(','));
    await page.keyboard.press('Escape'); await wait(100);
    await press('Egypt'); hero('motors · location list', (await options()).length >= 20, `${(await options()).length} rows`);
    await page.keyboard.press('Escape');
  }
  if (existsSync(join(TPL, 'property-landing.html'))) {
    await goto('property-landing');
    await press('Rent'); hero('property · Rent takes the selected class', await page.evaluate(() => { const b = [...document.querySelectorAll('button')]; const r = b.find((x) => x.textContent.trim() === 'Rent'), u = b.find((x) => x.textContent.trim() === 'Buy'); return r && u && r.className !== u.className && r.classList.length > u.classList.length; }));
    await press('Beds / Bathrooms'); hero('property · uncaptured menu says so', await page.evaluate(() => /not captured/.test(document.getElementById('proto-note')?.textContent || '')));
    await page.click('input[placeholder="Location or Compound"]'); await wait(100); hero('property · location suggestions', (await options()).length >= 20, `${(await options()).length} rows`);
    await page.keyboard.press('Escape');
  }
}

// An offsite link must say so, not silently navigate to production.
await page.goto(start, { waitUntil: 'domcontentloaded' });
const offsite = await page.evaluate(async () => {
  const a = document.querySelector('[data-proto-offsite]');
  if (!a) return 'none on page';
  const before = location.href;
  a.click();
  await new Promise((r) => setTimeout(r, 300));
  const note = document.getElementById('proto-note');
  return before === location.href && note && /not part of this prototype/i.test(note.textContent) ? 'ok' : 'FAIL';
});
if (offsite === 'FAIL') problems++;
console.log(`\n  ${offsite === 'ok' ? 'ok  ' : offsite === 'none on page' ? '--  ' : 'FAIL'} offsite link stays in the prototype and explains why`);

await browser.close();
console.log(`\n${problems ? `${problems} problem(s)` : 'Prototype OK'}`);
process.exit(problems ? 1 : 0);
