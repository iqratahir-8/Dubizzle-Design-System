/**
 * Finds, on each agency-portal page, the element behind every prototype trigger and returns its
 * stable node id (data-node-id from the annotated copy). Used by scripts/build-portal-flows.py,
 * which writes the annotated copies (*.annot.html) and deletes them afterwards.
 *   node scripts/resolve-portal-triggers.mjs hotspots.json pages.json out.json
 * Trigger sources: PORTAL_HOTSPOTS in scripts/lib/prototype.mjs (text / screen box / click-outside)
 * plus every <a data-proto-link> on the page.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
const [, , HOTSPOTS, PAGES, OUT] = process.argv;
const hs = JSON.parse(readFileSync(HOTSPOTS, 'utf8'));
const pages = JSON.parse(readFileSync(PAGES, 'utf8'));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const out = {};
for (const page of pages) {
  const rules = hs.map((h, i) => ({ ...h, i })).filter((h) => new RegExp(h.on).test(page));
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.goto(`file://${process.cwd()}/design-kit/templates/desktop/${page}.annot.html`, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 400));
  out[page] = await p.evaluate((rules) => {
    const nid = (el) => { const n = el && el.closest('[data-node-id]'); return n ? { node: n.dataset.nodeId, tag: n.tagName.toLowerCase(), w: Math.round(n.getBoundingClientRect().width), h: Math.round(n.getBoundingClientRect().height) } : null; };
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const res = rules.map((h) => {
      let r = { i: h.i, go: h.go, kind: h.text ? 'text' : h.box ? 'box' : 'outside', label: h.text || h.outside || null };
      if (h.text) {
        const els = [...document.querySelectorAll('button,a,[role=button],[role=tab],li,label,span,div,p')]
          .filter((e) => vis(e) && [...e.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim() === h.text || (vis(e) && e.children.length === 0 && e.textContent.trim() === h.text));
        const inBand = els.filter((e) => !h.band || (e.getBoundingClientRect().y >= h.band[0] && e.getBoundingClientRect().y <= h.band[1]));
        const el = inBand[0] || els[0];
        r.found = !!el; if (el) Object.assign(r, nid(el) || { node: null });
      } else if (h.box) {
        const [x1, y1, x2, y2] = h.box; const el = document.elementFromPoint((x1 + x2) / 2, (y1 + y2) / 2);
        r.found = !!el; if (el) Object.assign(r, nid(el) || { node: null });
      } else {
        // click-outside: use the page heading behind the dialog. A wrapper element is not safe — it can
        // contain the dialog, and a click on a control inside it would bubble up and also dismiss.
        const leaf = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim().startsWith(h.outside) && vis(e))[0];
        let dlg = leaf;
        while (dlg && dlg.parentElement) { const q = dlg.getBoundingClientRect(); if (q.width >= 280 && q.height >= 160 && q.width < 1300) break; dlg = dlg.parentElement; }
        const hd = [...document.querySelectorAll('h1,h2')].find((e) => vis(e) && leaf && !e.contains(leaf) && !(dlg && dlg.getBoundingClientRect().width < 900 && dlg.contains(e)) && e.getBoundingClientRect().x >= 80 && nid(e));
        r.found = !!leaf;
        if (hd) { Object.assign(r, nid(hd)); r.fallback = 'heading'; }
      }
      return r;
    });
    const anchors = {};
    document.querySelectorAll('a[data-proto-link]').forEach((a) => { const t = a.dataset.protoLink; if (!anchors[t] && vis(a)) anchors[t] = nid(a); });
    return { res, anchors };
  }, rules);
  await p.close();
}
writeFileSync(OUT, JSON.stringify(out, null, 1));
await b.close();
console.log('resolved', Object.keys(out).length, 'pages');
