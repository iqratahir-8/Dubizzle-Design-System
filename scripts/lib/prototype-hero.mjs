/**
 * Working hero search widgets for the consumer landing pages (Motors, New Cars, Electric
 * Cars, Property) in the prototype.
 *
 * A frozen capture keeps the hero's fields but not their menus: live renders them with
 * React only when opened. This puts the menus back, in the browser, over the captured
 * page — the same approach as the agency portal's filters (prototype-filters.mjs):
 *
 *   Price Range / Year     the real menu is in the captured DOM, hidden → toggled, nothing
 *                          invented
 *   Transmission / Body /  option lists read from the captured mobile filter sheet
 *   Fuel                   (m-filters, the same vocabulary as the hero), drawn in the
 *                          menu chrome measured on the Price Range menu of this very page
 *   Make or model          suggestions from the 73 brands on the captured New Cars page
 *   Location (Egypt)       the governorates measured on the header location dropdown
 *   Property Buy / Rent    the segmented control moves its selected class; Agencies and
 *                          Search are hotspots (consumer-prototype.mjs)
 *
 * Provenance, so nobody mistakes a stand-in for a measurement:
 *   MEASURED  menu chrome (white, radius 4px, shadow 0 3px 6px rgba(0,0,0,.16), 16px
 *             padding; Price Range menu, motors.desktop), field type (16px/19.2px
 *             proxima-nova), option vocabularies above
 *   MEASURED  Price Range / Year open by live's own class (SelectDropDown_active, .24s fade)
 *   AUTHORED  option row height (40px) and hover tint (--gray-01): react-select renders
 *             these on live and no open state was captured. Logged in docs/PROPOSALS.md.
 *   NOT BUILT the property hero's Beds / Bathrooms, Area and Price menus, and New Cars'
 *             Fuel Economy — their option lists exist nowhere in the captures. They say
 *             so when clicked. `npm run extract:hero-filters` on the Mac reads them off
 *             live into design-kit/content/hero-filters.json, and this runtime uses that
 *             file (options AND measured menu style) over everything above when present.
 *
 * Desktop only for now: the mobile Motors hero is a tab strip whose Make / Model / City /
 * Price panels were captured empty (they load on tap).
 *
 * Used by scripts/wire-prototype.mjs; checked by npm run check:prototype (HERO section).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/* Which pages carry a hero widget set, and which menus each select opens.
   Keys are the select's resting label on live. `options` is the vocabulary source:
   an array (measured, see above) or null (not captured → says so). */
const OPTIONS = {
  transmission: ['Automatic', 'Manual'], // m-filters.mobile, "Transmission Type"
  body: ['Sedan', 'SUV', 'Hatchback', 'Convertible', 'Pickup', 'Van'], // m-filters.mobile, "Body Type"
  fuel: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Natural Gas'], // m-filters.mobile, "Fuel Type"
};
export const HERO_SPEC = {
  motors: { selects: { Transmission: OPTIONS.transmission }, toggles: ['Price Range', 'Year'], make: true, location: true },
  'new-cars': { selects: { Transmission: OPTIONS.transmission, 'Body Type': OPTIONS.body, 'Fuel Economy': null }, toggles: ['Price Range'], make: true, location: false },
  'electric-cars': { selects: {}, toggles: ['Price Range'], make: true, location: true },
  'property-landing': {
    selects: { 'Beds / Bathrooms': null, 'Area (m²)': null, 'Price (EGP)': null },
    toggles: [],
    make: false,
    location: false,
    segment: ['Buy', 'Rent'], // "Agencies" is a hotspot → property-agencies
    locationInput: 'Location or Compound',
  },
};

let brands = null;
/** The brands on the captured New Cars page (slug → label), read from the built template. */
function brandList() {
  if (brands) return brands;
  const file = join(ROOT, 'design-kit/templates/desktop/new-cars.html');
  brands = [];
  if (!existsSync(file)) return brands;
  const html = readFileSync(file, 'utf8');
  const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*data-proto-path="\/en\/motors\/new-cars\/([^/"]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) {
    const slug = m[1];
    if (slug === 'compare' || slug === 'all-new-cars' || seen.has(slug)) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || m[2].match(/alt="([^"]+)"/)?.[1] || '';
    if (text && text.length < 30) { seen.add(slug); brands.push(text); }
  }
  return brands;
}

function governorates() {
  try {
    const f = JSON.parse(readFileSync(join(ROOT, 'design-kit/content/fixtures.json'), 'utf8'));
    return { governorates: f.locations.governorates || [], compounds: f.locations.compounds || [] };
  } catch { return { governorates: [], compounds: [] }; }
}

/** The hero config one page needs, or null. `harvest` = design-kit/content/hero-filters.json if present. */
export function heroFor(page, harvest) {
  const spec = HERO_SPEC[page];
  if (!spec) return null;
  const read = (harvest && harvest.pages && harvest.pages[page]) || {};
  const selects = {};
  for (const [label, options] of Object.entries(spec.selects)) {
    const h = read[label];
    selects[label] = h && h.options
      ? { options: h.options, style: h.style || null, source: 'live (hero-filters.json)' }
      : { options, style: null, source: options ? 'captured mobile filter sheet' : null };
  }
  const loc = governorates();
  return {
    page,
    selects,
    toggles: spec.toggles,
    make: spec.make ? brandList() : null,
    location: spec.location ? loc.governorates : null,
    locationInput: spec.locationInput ? { placeholder: spec.locationInput, options: [...loc.governorates, ...loc.compounds] } : null,
    segment: spec.segment || null,
  };
}

/** The browser half. Self-contained; the captures have their own scripts stripped. */
export function heroRuntime(cfg) {
  if (!cfg) return '';
  return `<script>
(function () {
  var CFG = ${JSON.stringify(cfg)};
  /* Menu chrome measured on the Price Range menu (motors.desktop, 2026-10-06); the row
     geometry is authored (see the header of prototype-hero.mjs). */
  var MENU = 'position:absolute;z-index:9;background:#fff;border-radius:4px;box-shadow:0 3px 6px rgba(0,0,0,.16);padding:8px 0;max-height:320px;overflow:auto;box-sizing:border-box;' +
    'font:16px/19.2px proxima-nova,helvetica,"GE SS Two",sans-serif;color:#23262a;';
  var ROW = 'display:block;width:100%;text-align:start;background:none;border:0;padding:10px 16px;font:inherit;color:inherit;cursor:pointer;line-height:20px;';
  var open = null;
  function norm(s) { return (s || '').replace(/\\s+/g, ' ').trim(); }
  function close() { if (open) { open.menu.remove(); open.field.setAttribute('aria-expanded', 'false'); open = null; } }
  function place(menu, field) {
    var r = field.getBoundingClientRect();
    menu.style.left = (r.left + window.scrollX) + 'px';
    menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
    menu.style.minWidth = r.width + 'px';
  }
  function note(text) {
    var n = document.getElementById('proto-note');
    if (!n) {
      n = document.createElement('div'); n.id = 'proto-note'; n.setAttribute('role', 'status');
      n.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#23262a;color:#fff;font:14px/1.4 ProximaNova,system-ui,sans-serif;padding:10px 16px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.22);opacity:0;transition:opacity .15s;max-width:90vw;pointer-events:none';
      document.body.appendChild(n);
    }
    n.textContent = text; n.style.opacity = '1'; clearTimeout(n._t); n._t = setTimeout(function () { n.style.opacity = '0'; }, 2600);
  }
  /* A list menu under a field. onPick(label) gets the chosen option. */
  function listMenu(field, options, style, onPick, filter) {
    close();
    var menu = document.createElement('div');
    menu.id = 'proto-hero-menu'; menu.setAttribute('role', 'listbox');
    menu.style.cssText = MENU;
    if (style && style.panel) {
      if (style.panel.borderRadius) menu.style.borderRadius = style.panel.borderRadius;
      if (style.panel.boxShadow) menu.style.boxShadow = style.panel.boxShadow;
      if (style.panel.backgroundColor) menu.style.background = style.panel.backgroundColor;
    }
    var shown = options.filter(function (o) { return !filter || o.toLowerCase().indexOf(filter.toLowerCase()) >= 0; }).slice(0, 60);
    // a captured field may hold a value already ("Egypt"); then the full list is the useful answer
    if (!shown.length && filter) shown = options.slice(0, 60);
    if (!shown.length) { var e = document.createElement('div'); e.style.cssText = 'padding:10px 16px;color:#7b7f85'; e.textContent = 'No matches'; menu.appendChild(e); }
    shown.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.style.cssText = ROW; b.textContent = o;
      if (style && style.row) { if (style.row.height) b.style.minHeight = style.row.height + 'px'; if (style.row.fontSize) b.style.fontSize = style.row.fontSize; if (style.row.fontWeight) b.style.fontWeight = style.row.fontWeight; }
      b.addEventListener('mouseenter', function () { b.style.background = '#f5f5f5'; });
      b.addEventListener('mouseleave', function () { b.style.background = 'none'; });
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onPick(o); close(); });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    place(menu, field);
    field.setAttribute('aria-expanded', 'true');
    open = { menu: menu, field: field };
  }
  /* The field whose own leaf text is exactly t (the select's resting label). */
  function fieldWithLabel(t) {
    var leaves = [].slice.call(document.querySelectorAll('button, [role="button"]')).filter(function (b) { return norm(b.textContent) === t && b.getBoundingClientRect().width > 40; });
    return leaves[0] || null;
  }
  function setLabel(field, text) {
    // react-select keeps the placeholder in its own div; the custom selects in a content div
    var slot = null;
    ['.select__placeholder', '.select__single-value', '.select_selectContent__3y3q8 > div', '.SelectDropDown_text__F8SV_', 'span', 'div'].some(function (sel) { slot = field.querySelector(sel); return !!slot; });
    if (slot) { slot.textContent = text; slot.style.color = '#23262a'; } else field.textContent = text;
    field.setAttribute('data-proto-value', text);
  }

  /* ---- selects: Transmission, Body Type, … ---- */
  Object.keys(CFG.selects).forEach(function (label) {
    var s = CFG.selects[label];
    var field = fieldWithLabel(label);
    if (!field) return;
    field.setAttribute('aria-haspopup', 'listbox'); field.setAttribute('aria-expanded', 'false'); field.style.cursor = 'pointer';
    field.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (open && open.field === field) { close(); return; }
      if (!s.options) { note(label + ': menu not captured yet — run npm run extract:hero-filters on the Mac to read it off live'); return; }
      listMenu(field, s.options, s.style, function (o) { setLabel(field, o); });
    }, true);
  });

  /* ---- toggles: Price Range, Year — the captured menu, hidden by CSS ---- */
  CFG.toggles.forEach(function (label) {
    var trig = fieldWithLabel(label);
    if (!trig) return;
    var wrap = trig.closest('.SelectDropDown_dropdown__36w7u') || trig.parentElement;
    var menu = wrap && wrap.querySelector('.SelectDropDown_dropdownMenu__kqCzK');
    if (!menu) return;
    trig.setAttribute('aria-expanded', 'false'); trig.style.cursor = 'pointer';
    /* live opens this menu by adding SelectDropDown_active__22oJX (captured CSS: opacity 1,
       visibility visible, with a .24s transition) — so the prototype toggles that very class. */
    function show(on) {
      menu.classList.toggle('SelectDropDown_active__22oJX', on);
      trig.setAttribute('aria-expanded', on ? 'true' : 'false'); menu.setAttribute('data-proto-open', on ? '1' : '0');
    }
    trig.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); show(menu.getAttribute('data-proto-open') !== '1'); }, true);
    document.addEventListener('click', function (e) { if (menu.getAttribute('data-proto-open') === '1' && !wrap.contains(e.target)) show(false); }, true);
    menu.addEventListener('click', function (e) { e.stopPropagation(); }, true);
  });

  /* ---- make or model: suggestions from the New Cars brand list ---- */
  if (CFG.make && CFG.make.length) {
    var mk = document.querySelector('input[placeholder^="Search by make"], input[placeholder^="Search by Car Make"]');
    if (mk) {
      var field = mk.closest('.input_inputOuter__106FQ') || mk;
      var showMake = function () { listMenu(field, CFG.make, null, function (o) { mk.value = o; mk.dispatchEvent(new Event('input', { bubbles: true })); }, mk.value); };
      mk.addEventListener('focus', function () { mk.select(); showMake(); }); mk.addEventListener('input', showMake);
      mk.addEventListener('click', function (e) { e.stopPropagation(); showMake(); }, true);
    }
  }
  /* ---- location: the governorates measured on the header dropdown ---- */
  if (CFG.location && CFG.location.length) {
    var loc = document.querySelector('.locationDrilldown_triggerBtn__2k1Mm');
    if (loc) {
      loc.style.cursor = 'pointer';
      loc.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (open && open.field === loc) { close(); return; }
        listMenu(loc, ['Egypt'].concat(CFG.location), null, function (o) { setLabel(loc, o); });
      }, true);
    }
  }
  if (CFG.locationInput) {
    var li = document.querySelector('input[placeholder="' + CFG.locationInput.placeholder + '"]');
    if (li) {
      var lf = li.parentElement;
      var showLoc = function () { listMenu(lf, CFG.locationInput.options, null, function (o) { li.value = o; }, li.value); };
      li.addEventListener('focus', function () { li.select(); showLoc(); }); li.addEventListener('input', showLoc);
      li.addEventListener('click', function (e) { e.stopPropagation(); showLoc(); }, true);
    }
  }
  /* ---- segmented control (Buy / Rent): the selected class moves ---- */
  if (CFG.segment) {
    var segs = CFG.segment.map(fieldWithLabel).filter(Boolean);
    if (segs.length === CFG.segment.length) {
      var all = segs.map(function (b) { return [].slice.call(b.classList); });
      var onlyActive = all[0].filter(function (c) { return all.slice(1).every(function (l) { return l.indexOf(c) < 0; }); });
      segs.forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          segs.forEach(function (x) { onlyActive.forEach(function (c) { x.classList.toggle(c, x === b); }); x.setAttribute('aria-pressed', String(x === b)); });
        }, true);
      });
    }
  }
  document.addEventListener('click', function (e) { if (open && !open.menu.contains(e.target) && !open.field.contains(e.target)) close(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { close(); e.stopPropagation(); } }, true);
  window.__protoHero = { open: function () { return open; }, cfg: CFG };
})();
</script>`;
}
