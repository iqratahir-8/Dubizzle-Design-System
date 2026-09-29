#!/usr/bin/env node
/**
 * Render-dependent design-QA checks, in headless Chrome (puppeteer-core, already a repo dep).
 *
 *   node render_checks.mjs <jobs.json> <out.json>
 *
 * jobs.json = { chrome, targetMin:{platform:n}, targetAim:{platform:n}, longest:"…", jobs:[
 *   { id, screen, platform, file, width, marker, origin, checks:["brk","a11y.target","mot","ovf"] } ] }
 *
 * Checks: brk.render, a11y.target, mot.reduced, ovf.long, ovf.longest_real, ovf.big_number.
 * Everything is measured on the page as loaded from file:// — no network, no login.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [jobsPath, outPath] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(jobsPath, 'utf8'));
const findings = [];
const ran = {}; // check -> cases run
const bump = (c) => (ran[c] = (ran[c] || 0) + 1);

const LIVE_SEL = (cfg.liveRegions || []).join(',');
const LONG = 'W'.repeat(200);
const BIG = '999,999,999';

/** page-side helpers, installed once per page */
const HELPERS = `
window.__qa = {
  live(el) {
    if (window.__liveAll) return !el.closest('[data-authored]');   // live capture + a small authored block
    return !!(window.__liveSel && el.closest(window.__liveSel));
  },
  path(el) {
    const bits = [];
    for (let n = el; n && n.nodeType === 1 && bits.length < 4; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; bits.unshift(s); break; }
      const c = (typeof n.className === 'string' ? n.className : '').trim().split(/\\s+/).filter(Boolean)[0];
      if (c) s += '.' + c;
      bits.unshift(s);
    }
    return bits.join(' > ');
  },
  node(el) { const n = el.closest('[data-node-id]'); return n ? n.getAttribute('data-node-id') : null; },
  visible(el) {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0;
  },
  overflowX() { return document.documentElement.scrollWidth - document.documentElement.clientWidth; },
};`;

function add(f) { findings.push(f); }

const browser = await puppeteer.launch({
  executablePath: cfg.chrome, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});

for (const job of cfg.jobs) {
  const page = await browser.newPage();
  const base = { screen: job.screen, case: job.id, origin: job.origin };
  try {
    await page.setViewport({ width: job.width, height: 900, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(job.file).href, { waitUntil: 'load', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(HELPERS);
    await page.evaluate((s, all) => { window.__liveSel = s; window.__liveAll = all; }, LIVE_SEL, !!job.liveAll);
    if (job.marker) {
      // one file holding several states: show only the [data-state=marker] block
      await page.evaluate((m) => {
        document.querySelectorAll('[data-state]').forEach((e) => { if (e.getAttribute('data-state') !== m) e.hidden = true; });
      }, job.marker);
    }
    const want = new Set(job.checks);

    if (want.has('brk')) {
      bump('brk.render');
      const over = await page.evaluate(() => window.__qa.overflowX());
      if (over > 1) {
        const culprit = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth; let worst = null;
          document.querySelectorAll('body *').forEach((e) => {
            if (!window.__qa.visible(e)) return;
            const r = e.getBoundingClientRect();
            if (r.right > vw + 1 && (!worst || r.right > worst.right)) worst = { right: r.right, e };
          });
          return worst ? { path: window.__qa.path(worst.e), node: window.__qa.node(worst.e), live: window.__qa.live(worst.e) } : null;
        });
        add({ ...base, live_region: !!culprit?.live, check: 'brk.render', node: culprit?.node ?? null, css_path: culprit?.path ?? null,
          message: `horizontal overflow of ${Math.round(over)}px at ${job.width}px wide`,
          expected: 0, actual: Math.round(over) });
      }
    }

    if (want.has('brk')) {
      // text that is cut off by an overflow:hidden ancestor on the page as designed (no injection).
      // Horizontal scrollers (overflow:auto|scroll) and carousels are intentional and skipped.
      bump('ovf.clipped');
      const clipped = await page.evaluate(() => {
        const out = [];
        const leaves = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.textContent.trim() &&
          !/^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(e.tagName) && window.__qa.visible(e));
        for (const e of leaves) {
          const r = e.getBoundingClientRect();
          if (r.width < 8) continue;
          for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
              if (/slide|carousel|swiper|slick|scroller/i.test(a.className && a.className.baseVal === undefined ? a.className : '')) break;
              const ar = a.getBoundingClientRect();
              const cut = Math.max(0, r.right - ar.right, ar.left - r.left);
              const ell = getComputedStyle(e).textOverflow === 'ellipsis' || cs.textOverflow === 'ellipsis';
              if (cut > 1 && !ell) {
                out.push({ path: window.__qa.path(e), node: window.__qa.node(e), text: e.textContent.trim().slice(0, 24),
                  pct: Math.round((cut / r.width) * 100), live: window.__qa.live(e) });
              }
              break;
            }
          }
        }
        return out;
      });
      const hard = clipped.filter((c) => c.pct >= 30);
      for (const c of (hard.length ? hard : clipped).slice(0, 6)) {
        add({ ...base, live_region: c.live, check: 'ovf.clipped', node: c.node, css_path: c.path, severity: c.pct >= 30 ? undefined : 'warning',
          message: `“${c.text}” is ${c.pct}% cut off by an overflow:hidden ancestor at ${job.width}px, with no ellipsis`,
          expected: 'fully visible or truncated with ellipsis', actual: `${c.pct}% clipped` });
      }
      if (clipped.length > 6) add({ ...base, check: 'ovf.clipped', severity: 'note', message: `… and ${clipped.length - 6} more clipped text nodes at ${job.width}px` });
    }

    if (want.has('a11y.target')) {
      bump('a11y.target');
      const min = cfg.targetMin[job.platform] ?? 24, aim = cfg.targetAim[job.platform] ?? min;
      const res = await page.evaluate((min, aim) => {
        const small = [], under = [];
        const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link],[tabindex]:not([tabindex="-1"])';
        document.querySelectorAll(sel).forEach((e) => {
          if (!window.__qa.visible(e)) return;
          const cs = getComputedStyle(e);
          // WCAG 2.5.8 exemption: a link inline within a sentence is not a target
          if (e.tagName === 'A' && cs.display === 'inline' && e.closest('p,li,span,td,dd,label')) return;
          const r = e.getBoundingClientRect();
          if (r.width < min || r.height < min) small.push({ live: window.__qa.live(e), w: Math.round(r.width), h: Math.round(r.height), path: window.__qa.path(e), node: window.__qa.node(e), text: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) });
          else if (aim > min && (r.width < aim || r.height < aim)) under.push(1);
        });
        return { small, aimCount: under.length };
      }, min, aim);
      for (const s of res.small.slice(0, 8)) {
        add({ ...base, live_region: s.live, check: 'a11y.target', node: s.node, css_path: s.path,
          message: `${s.w}×${s.h}px target${s.text ? ` “${s.text}”` : ''} is under the ${min}px minimum for ${job.platform}`,
          expected: min, actual: `${s.w}×${s.h}` });
      }
      if (res.small.length > 8) add({ ...base, check: 'a11y.target', severity: 'note', message: `… and ${res.small.length - 8} more targets under ${min}px` });
      if (res.aimCount) add({ ...base, check: 'a11y.target', severity: 'note', message: `${res.aimCount} target(s) between ${min}px and the ${cfg.targetAim[job.platform]}px aim for ${job.platform}` });
    }

    if (want.has('mot')) {
      bump('mot.reduced');
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.reload({ waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(HELPERS);
      await page.evaluate((s, all) => { window.__liveSel = s; window.__liveAll = all; }, LIVE_SEL, !!job.liveAll);
      const anim = await page.evaluate(() => document.getAnimations().filter((a) => {
        const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        return a.playState === 'running' && t && t.duration > 0;
      }).map((a) => ({ name: a.animationName || a.transitionProperty || 'animation', el: a.effect && a.effect.target ? window.__qa.path(a.effect.target) : null,
        node: a.effect && a.effect.target ? window.__qa.node(a.effect.target) : null, live: a.effect && a.effect.target ? window.__qa.live(a.effect.target) : false, dur: Math.round(a.effect.getComputedTiming().duration) })));
      for (const a of anim.slice(0, 6)) {
        add({ ...base, live_region: a.live, check: 'mot.reduced', node: a.node, css_path: a.el,
          message: `“${a.name}” (${a.dur}ms) still runs under prefers-reduced-motion: reduce`, expected: 'stopped', actual: 'running' });
      }
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    }

    if (want.has('ovf')) {
      // Which nodes carry user-generated text? Authors mark them data-ugc. If none are marked, fall back to
      // "leaf text inside an article/card whose class says title/name/location/…" — and say so in the report.
      // A 200-character string in a "Featured" badge is not a real content extreme, so static labels are skipped.
      const tests = [
        ['ovf.long', LONG, 'ugc'],
        ['ovf.longest_real', cfg.longest, 'ugc'],
        ['ovf.big_number', BIG, 'number'],
      ];
      let usedHeuristic = false;
      for (const [id, str, mode] of tests) {
        if (!str) continue;
        bump(id);
        const res = await page.evaluate(({ str, mode, limit }) => {
          const before = window.__qa.overflowX();
          const vw = document.documentElement.clientWidth;
          const NUM = /(EGP|\d{1,3}(?:,\d{3})+)/;
          const UGC_CLASS = /(title|name|location|address|desc|seller|subtitle|snippet)/i;
          const okLeaf = (e) => e.children.length === 0 && e.textContent.trim() &&
            !/^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(e.tagName) && window.__qa.visible(e) && !window.__qa.live(e);
          let leaves, heuristic = false;
          if (mode === 'ugc') {
            leaves = [...document.querySelectorAll('[data-ugc]')].filter((e) => window.__qa.visible(e) && !window.__qa.live(e));
            if (!leaves.length) {
              heuristic = true;
              leaves = [...document.querySelectorAll('article *, [class*="card"] *')].filter((e) => okLeaf(e) &&
                UGC_CLASS.test(typeof e.className === 'string' ? e.className : ''));
            }
          } else {
            leaves = [...document.querySelectorAll('[data-number], article *, [class*="card"] *')].filter((e) => okLeaf(e) &&
              e.textContent.trim().length <= 24 && NUM.test(e.textContent));
          }
          leaves = leaves.slice(0, limit);
          const bad = [];
          for (const e of leaves) {
            const old = e.textContent;
            e.textContent = mode === 'number' ? old.replace(/\d[\d,]*/, str) : str;
            const after = window.__qa.overflowX();
            const r = e.getBoundingClientRect();
            const clipped = e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' &&
              getComputedStyle(e).textOverflow !== 'ellipsis';
            if (after > before + 1 || r.right > vw + 1 || clipped) {
              bad.push({ path: window.__qa.path(e), node: window.__qa.node(e), old: old.trim().slice(0, 30),
                over: Math.round(Math.max(after - before, r.right - vw, 0)) });
            }
            e.textContent = old;
          }
          return { tested: leaves.length, bad, heuristic };
        }, { str, mode, limit: 40 });
        usedHeuristic = usedHeuristic || res.heuristic;
        for (const b of res.bad.slice(0, 6)) {
          const what = id === 'ovf.big_number' ? 'the number 999,999,999' : id === 'ovf.long' ? 'a 200-character string' : 'the longest real title';
          add({ ...base, check: id, node: b.node, css_path: b.path, severity: res.heuristic ? 'warning' : undefined,
            message: `${res.heuristic ? '(heuristic match) ' : ''}${what} replacing “${b.old}” overflows${b.over ? ` by ${b.over}px` : ' (clipped, no ellipsis)'}`,
            expected: 'contained or truncated with ellipsis', actual: b.over ? `+${b.over}px` : 'clipped' });
        }
        if (res.bad.length > 6) add({ ...base, check: id, severity: 'note', message: `… and ${res.bad.length - 6} more nodes (${res.tested} tested)` });
        if (!res.tested) add({ ...base, check: id, severity: 'note', message: 'no nodes matched to inject into — mark user-generated text with data-ugc (and numbers with data-number)' });
      }
      if (usedHeuristic) add({ ...base, check: 'ovf.long', severity: 'note', message: 'no [data-ugc] nodes declared — used the card-content class heuristic; mark user text with data-ugc to make this exact' });
    }
  } catch (e) {
    add({ ...base, check: 'render.error', severity: 'warning', message: `could not render: ${String(e.message).slice(0, 140)}` });
  } finally {
    await page.close();
  }
}
await browser.close();
writeFileSync(outPath, JSON.stringify({ findings, ran }, null, 2));
