/**
 * Turns a set of frozen captures into a clickable prototype.
 *
 * A capture is a single frozen page: its links still point at live dubizzle, so
 * clicking the agency portal's sidebar in a template would leave the design system
 * for production. This rewrites those links to the sibling templates instead, so the
 * captured screens navigate to each other the way the product does — in the kit, and
 * inside Storybook's frame.
 *
 * Nothing about the pages themselves changes. Each capture already shows its own
 * sidebar item as active, because each was captured on its own route, so wiring the
 * links gives correct active states for free.
 *
 * Used by scripts/build-live-templates.mjs.
 */

const ORIGIN = 'https://www.dubizzle.com.eg';

/**
 * Agency portal route graph, most specific first. Built by walking every link in the
 * eight top-level captures (2026-09-21). Query strings are dropped before matching, so
 * pagination (?page=2) lands on the same screen rather than a dead end, and every
 * per-ad or per-job URL maps to the one representative capture of that screen.
 */
export const PORTAL_ROUTES = [
  [/^\/(en\/)?agencyPortal\/?$/, 'portal-dashboard'],
  /* The ad details drawer: one long panel over Agency Ads; its five tabs are anchors
     into it, each with its own URL (captured 2026-09-21). */
  [/^\/en\/agencyPortal\/ads\/extraDetails\/[^/]+\/overview\/?$/, 'portal-ad-overview'],
  [/^\/en\/agencyPortal\/ads\/extraDetails\/[^/]+\/info\/?$/, 'portal-ad-info'],
  [/^\/en\/agencyPortal\/ads\/extraDetails\/[^/]+\/promotional(%20| )tools\/?$/, 'portal-ad-promo'],
  [/^\/en\/agencyPortal\/ads\/extraDetails\/[^/]+\/agent\/?$/, 'portal-ad-agent'],
  [/^\/en\/agencyPortal\/ads\/extraDetails\/[^/]+\/chats\/?$/, 'portal-ad-chats'],
  [/^\/en\/agencyPortal\/ads\/?$/, 'portal-ads'],
  [/^\/en\/agencyPortal\/leads\/?$/, 'portal-leads'],
  [/^\/en\/agencyPortal\/vip\/?$/, 'portal-vip'],
  [/^\/en\/agencyPortal\/jobsApplications\/[^/]+\/?$/, 'portal-candidate-detail'],
  [/^\/en\/agencyPortal\/jobsApplications\/?$/, 'portal-candidates'],
  [/^\/en\/agencyPortal\/agents\/?$/, 'portal-agents'],
  [/^\/en\/agencyPortal\/insights(\/.*)?$/, 'portal-insights'],
  [/^\/en\/agencyPortal\/creditInfo\/self\/?$/, 'portal-credit-self'],
  [/^\/en\/agencyPortal\/creditInfo\/agents\/?$/, 'portal-credit-agents'],
  [/^\/en\/agencyPortal\/creditInfo(\/all)?\/?$/, 'portal-credit'],
];

/* The portal's sidebar drawer. Clicking the burger on live swaps ONE class on the
   <nav>: collapsed (80px icon rail) ↔ expanded (a 25rem panel with each page title
   beside its icon). Both sets of rules are already in the captured stylesheet, so the
   prototype toggles dubizzle's real CSS rather than imitating it (measured 2026-09-21).
   The trigger is found by the product's own aria-label, which survives a redeploy;
   the two class names are build hashes and are re-checked on every build. */
export const PORTAL_DRAWER = {
  trigger: 'header[aria-label="Burger menu"]',
  collapsed: '_4a96f724',
  expanded: '_36772a2f',
  /* Swapping the nav class alone widens the drawer but leaves every page title
     invisible, which is the bug the user reported. Nothing in the CSS reverses the
     collapsed-only classes under the expanded class: on live, React strips them from
     each element when the drawer opens. A frozen capture has lost React, so the runtime
     does it. The captured rules fade the text in over 1s — live's own motion. */
  /* Classes that exist only in the collapsed state, measured from the captured CSS.
     Two hide text (opacity:0; position:absolute) and two centre an icon in the 80px
     rail. The runtime strips all four on open and restores them on close. */
  collapsedOnly: [
    '_09ded1f5', // each page title       — hidden
    'c14480cc', // "dubizzle Pro" wordmark — hidden
    '_647a463c', // each nav row           — icon centred
    '_63d57cdb', // the burger row         — icon centred
  ],
};

/* Hotspots: controls that are <button>s rather than links, so rewriting hrefs cannot
   reach them. Each says: on these pages, a click on the control whose text is exactly
   this goes to that frame — the Figma prototype model, over real captures.
     on       which frames the rule applies to
     text     the control's own visible text, matched exactly
     band     optional [minY, maxY] in page px; "Chats" is both a Leads tab and a link in
              the site header, and only the tab should jump
     outside  instead of a control: any click outside the element containing this text
              (how an open dropdown closes)
   selector a control with no stable text: an aria-label, a placeholder, a role
   event    with selector: 'focus' or 'input' instead of a click (consumer header search)
   hover    like text, but fires on mouseenter after 350ms (the category mega menus)
   key      'Escape' — closes this frame back to `go`
   (the consumer site's rules live in scripts/lib/consumer-prototype.mjs)
   A rule whose target was never captured is dropped at build time, so the prototype
   never offers a jump that goes nowhere. Tab URLs were probed on live 2026-09-21. */
const LEADS = /^portal-leads(-phone|-sms|-whatsapp)?$/;
const LEADS_ANY = /^portal-leads/;
export const PORTAL_HOTSPOTS = [
  { on: LEADS_ANY, text: 'All', band: [120, 200], go: 'portal-leads' },
  { on: LEADS_ANY, text: 'Phone', band: [120, 200], go: 'portal-leads-phone' },
  { on: LEADS_ANY, text: 'SMS', band: [120, 200], go: 'portal-leads-sms' },
  { on: LEADS_ANY, text: 'WhatsApp', band: [120, 200], go: 'portal-leads-whatsapp' },
  // live sends this tab out of the portal to the consumer inbox
  { on: LEADS_ANY, text: 'Chats', band: [120, 200], go: 'chat' },
  // appears only while a filter is active; on live it returns to the unfiltered list
  { on: LEADS_ANY, text: 'Clear All Filters', go: 'portal-leads' },
  { on: LEADS, text: 'Date Range', go: 'portal-leads-daterange' },
  { on: /^portal-leads-daterange$/, text: 'Date Range', go: 'portal-leads' },
  { on: /^portal-leads-daterange$/, text: 'Apply', go: 'portal-leads' },
  { on: /^portal-leads-daterange$/, text: 'Reset', go: 'portal-leads' },
  { on: /^portal-leads-daterange$/, outside: 'Preset range', go: 'portal-leads' },
  // the ad details drawer closes on a click on the dimmed list behind it, as on live
  { on: /^portal-ad-(overview|info|promo|agent|chats)$/, outside: 'Promotional Tools', go: 'portal-ads' },

  /* Popups & modals (captured 2026-09-22, read-only). Each trigger opens its frame; the
     frame closes back on Cancel, a click outside it, or Escape — like live. Confirming
     buttons (Submit, Apply product, Purchase, Request Export, Send) go nowhere: the
     prototype never pretends an action happened that was never captured.
       box  a control with no text (⋯, ⋮, the credits pill), as page px [x1, y1, x2, y2] */
  { on: /^portal-ads$/, text: 'More Filters', go: 'portal-ads-more-filters' },
  { on: /^portal-ads-more-filters$/, text: 'Reset', go: 'portal-ads' },
  { on: /^portal-ads-more-filters$/, outside: 'Agent Code', go: 'portal-ads' },
  { on: /^portal-ads$/, text: 'Request to add Brand/Model', go: 'portal-ads-request-brand' },
  { on: /^portal-ads-request-brand$/, text: 'Cancel', go: 'portal-ads' },
  { on: /^portal-ads-request-brand$/, outside: 'Add New Car Brand/Model', go: 'portal-ads' },
  { on: /^portal-ads$/, box: [1144, 90, 1416, 138], go: 'portal-ads-credits' },
  { on: /^portal-ads-credits$/, box: [1144, 90, 1416, 138], go: 'portal-ads' },
  { on: /^portal-ads-credits$/, outside: 'Used by Owner', go: 'portal-ads' },
  { on: /^portal-ads$/, box: [1343, 490, 1399, 546], go: 'portal-ads-actions' },
  { on: /^portal-ads-actions$/, outside: 'Mark as sold', go: 'portal-ads' },
  { on: /^portal-ad-agent$/, text: 'Assign Agent', go: 'portal-ad-assign-agent' },
  { on: /^portal-ad-assign-agent$/, text: 'Cancel', go: 'portal-ad-agent' },
  { on: /^portal-ad-assign-agent$/, outside: 'New Responsible Agent', go: 'portal-ad-agent' },
  { on: /^portal-agents$/, text: 'Invite agent', go: 'portal-agents-invite' },
  { on: /^portal-agents-invite$/, text: 'Cancel', go: 'portal-agents' },
  { on: /^portal-agents-invite$/, outside: 'Send invitation to an agent to join you.', go: 'portal-agents' },
  { on: /^portal-agents$/, text: 'Sort by', go: 'portal-agents-sort' },
  { on: /^portal-agents-sort$/, text: 'Sort by', go: 'portal-agents' },
  { on: /^portal-agents-sort$/, outside: 'Sort By Total Ads', go: 'portal-agents' },
  { on: /^portal-agents$/, box: [1360, 432, 1396, 468], go: 'portal-agents-actions' },
  { on: /^portal-agents-actions$/, outside: 'Update Credits', go: 'portal-agents' },
  { on: LEADS, text: 'Export Leads', go: 'portal-leads-export' },
  { on: /^portal-leads-export$/, text: 'Cancel', go: 'portal-leads' },
  { on: /^portal-leads-export$/, outside: 'Export Details', go: 'portal-leads' },
  { on: /^portal-vip$/, text: 'Purchase', go: 'portal-vip-purchase' },
  { on: /^portal-vip-purchase$/, outside: 'Purchase Lead', go: 'portal-vip' },
];

export const PROTOTYPES = {
  'agency-portal': {
    member: (name) => name.startsWith('portal-'),
    routes: PORTAL_ROUTES,
    drawer: PORTAL_DRAWER,
    hotspots: PORTAL_HOTSPOTS,
  },
};

/** The hotspots that apply to one page and lead somewhere real. */
export function hotspotsFor(proto, page, isAvailable) {
  return (proto.hotspots || [])
    .filter((h) => h.on.test(page) && isAvailable(h.go))
    .map(({ text, band, outside, box, selector, event, hover, key, go }) => {
      const h = { go };
      for (const [k, v] of Object.entries({ text, band, outside, box, selector, event, hover, key })) if (v !== undefined) h[k] = v;
      return h;
    });
}

export function prototypeFor(name) {
  for (const [id, p] of Object.entries(PROTOTYPES)) if (p.member(name)) return { id, ...p };
  return null;
}

function pathOf(href) {
  let h = href;
  if (h.startsWith(ORIGIN)) h = h.slice(ORIGIN.length);
  else if (/^https?:\/\//i.test(h)) return null; // another site entirely
  if (!h.startsWith('/')) return null; // fragment, mailto:, relative asset
  return h.split('#')[0].split('?')[0];
}

/**
 * Rewrites every <a href> in a prototype member.
 *   portal route with a built target → the sibling template (stays in the prototype)
 *   any other dubizzle link           → neutralised, so the prototype cannot escape to
 *                                        production; the original path is kept on the
 *                                        element so a click can say where it would go
 * Asset <link href>s are untouched — only anchors navigate.
 */
export function wirePrototype(html, proto, isAvailable) {
  let wired = 0;
  let neutralised = 0;
  const out = html.replace(/<a\b([^>]*?)\shref="([^"]*)"([^>]*)>/gi, (whole, pre, href, post) => {
    const path = pathOf(href);
    if (path === null) return whole;
    const hit = proto.routes.find(([re]) => re.test(path));
    const attrs = `${pre}${post}`.replace(/\s(target|rel)="[^"]*"/gi, '');
    if (hit && isAvailable(hit[1])) {
      wired++;
      return `<a${attrs} href="${hit[1]}.html" data-proto-link="${hit[1]}">`;
    }
    neutralised++;
    return `<a${attrs} href="#" data-proto-offsite="${path.replace(/"/g, '&quot;')}">`;
  });
  return { html: out, wired, neutralised };
}

/**
 * The prototype's only behaviour beyond links. Two jobs:
 *   - dismiss the portal's "Ok, I understand" notice, which a frozen page cannot do
 *   - say so when a link leads outside the prototype, instead of silently doing nothing
 * Kept tiny and dependency-free; the captures have their own scripts stripped.
 */
export function prototypeRuntime(proto, hotspots = []) {
  const drawer = JSON.stringify(proto.drawer || null);
  return `<script>
(function () {
  var DRAWER = ${drawer};
  var HOTSPOTS = ${JSON.stringify(hotspots)};

  /* The control a click landed on, if its own text is exactly t: walk up a few levels
     from the target so a click on an icon inside a tab still counts as the tab. */
  function controlWithText(node, t) {
    for (var i = 0; node && i < 5; node = node.parentElement, i++) {
      if (node.nodeType !== 1) continue;
      if ((node.textContent || '').trim() === t) return node;
      /* A button whose label is split across spans ("Sort by" + "Newly listed"): the
         click lands on the button, and one of its leaf spans carries the exact text. */
      if (node.matches('button, [role="button"], a, [role="tab"]')) {
        var leaves = node.querySelectorAll('*');
        for (var j = 0; j < leaves.length; j++) if (!leaves[j].children.length && (leaves[j].textContent || '').trim() === t) return node;
      }
    }
    return null;
  }
  function inBand(el, band) {
    if (!band) return true;
    var y = el.getBoundingClientRect().top + window.scrollY;
    return y >= band[0] && y <= band[1];
  }
  function panelOf(t) {
    // by text node: the drawer's tab text shares its element with an icon
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), tn, hit = null;
    while ((tn = w.nextNode())) if (tn.nodeValue.trim() === t) { hit = tn.parentElement; break; }
    /* The panel is the nearest positioned ancestor narrower than the page: the ad
       drawer sits in a full-width fixed backdrop, and "outside the backdrop" is nowhere. */
    for (var n = hit; n && n !== document.body; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if ((cs.position === 'absolute' || cs.position === 'fixed') && n.getBoundingClientRect().width < document.documentElement.clientWidth * 0.9) return n;
    }
    /* A frozen capture can lose the positioning (fixed layers are settled when frozen),
       so fall back to the widest ancestor that is still narrower than the page. */
    var best = null;
    for (var m = hit; m && m !== document.body; m = m.parentElement) {
      if (m.getBoundingClientRect().width < document.documentElement.clientWidth * 0.9) best = m;
    }
    if (best) return best;
    return null;
  }
  function hotspot(e) {
    for (var i = 0; i < HOTSPOTS.length; i++) {
      var h = HOTSPOTS[i];
      if (h.outside) {
        /* "Click outside closes the dropdown" must not swallow clicks that mean
           something else. It fired on the burger and navigated away before the drawer
           could open (caught by check:prototype). Other controls keep their own jobs:
           the sidebar, links, and anything another hotspot claims. */
        var t = e.target;
        if (t.closest && (t.closest('nav') || t.closest('a[data-proto-link],[data-proto-offsite]'))) continue;
        var claimed = false;
        for (var j = 0; j < HOTSPOTS.length; j++) {
          if (!HOTSPOTS[j].outside && controlWithText(t, HOTSPOTS[j].text)) { claimed = true; break; }
        }
        for (var q = 0; q < HOTSPOTS.length && !claimed; q++) {
          var bx = HOTSPOTS[q].box;
          if (bx) { var px = e.clientX + window.scrollX, py = e.clientY + window.scrollY; if (px >= bx[0] && px <= bx[2] && py >= bx[1] && py <= bx[3]) claimed = true; }
          if (HOTSPOTS[q].selector && t.closest && t.closest(HOTSPOTS[q].selector)) claimed = true;
        }
        if (claimed) continue;
        var panel = panelOf(h.outside);
        if (panel && !panel.contains(t)) return h.go;
        continue;
      }
      if (h.box) {
        var x = e.clientX + window.scrollX, y = e.clientY + window.scrollY;
        if (x >= h.box[0] && x <= h.box[2] && y >= h.box[1] && y <= h.box[3]) return h.go;
        continue;
      }
      if (h.selector) {
        // a control named by selector (an aria-label, a placeholder, a role) — click only
        if ((h.event || 'click') === 'click' && e.target.closest && e.target.closest(h.selector)) return h.go;
        continue;
      }
      if (h.hover || h.key) continue;
      var c = controlWithText(e.target, h.text);
      if (c && inBand(c, h.band)) return h.go;
    }
    return null;
  }
  /* Consumer-site triggers that are not clicks (added 2026-10-06):
       hover   the header category strip opens a mega menu on mouseenter, like live
       event   focus on the search field opens the suggestions; typing in the mobile
               search page shows suggestions
       key     Escape closes an overlay back to the page it opened from */
  var hoverTimer = null;
  document.addEventListener('mouseover', function (e) {
    for (var i = 0; i < HOTSPOTS.length; i++) {
      var h = HOTSPOTS[i];
      if (!h.hover) continue;
      var c = controlWithText(e.target, h.hover);
      if (c && inBand(c, h.band)) {
        clearTimeout(hoverTimer);
        var go = h.go;
        hoverTimer = setTimeout(function () { if (c.matches(':hover')) location.href = go + '.html'; }, 350);
        return;
      }
    }
  }, true);
  document.addEventListener('mouseout', function () { clearTimeout(hoverTimer); }, true);
  HOTSPOTS.forEach(function (h) {
    if (!h.selector || !h.event || h.event === 'click') return;
    [].slice.call(document.querySelectorAll(h.selector)).forEach(function (el) {
      el.addEventListener(h.event, function () { location.href = h.go + '.html'; });
    });
  });
  var KEY = 'proto-drawer:' + ${JSON.stringify(proto.id)};

  function note(text) {
    var n = document.getElementById('proto-note');
    if (!n) {
      n = document.createElement('div');
      n.id = 'proto-note';
      n.setAttribute('role', 'status');
      n.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
        'background:#23262a;color:#fff;font:14px/1.4 ProximaNova,system-ui,sans-serif;padding:10px 16px;' +
        'border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.22);opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);' +
        'max-width:90vw;pointer-events:none';
      document.body.appendChild(n);
    }
    n.textContent = text;
    n.style.opacity = '1';
    clearTimeout(n._t);
    n._t = setTimeout(function () { n.style.opacity = '0'; }, 2200);
  }

  /* Drawer. The state is kept for the session so that opening the drawer and then
     picking a page does not snap it shut on arrival, which would read as a bug in a
     prototype. Storage can throw (private mode); the drawer still works without it. */
  var nav = null, owned = [], pinned = false;
  /* Reveal or hide. Each node is cached with the classes it carried at load: once a
     class is removed the node can no longer be found by it. */
  function reveal(on) {
    for (var i = 0; i < owned.length; i++) {
      for (var k = 0; k < owned[i].cls.length; k++) owned[i].el.classList.toggle(owned[i].cls[k], !on);
    }
  }
  function setDrawer(open) {
    if (!nav) return;
    pinned = open;
    // Closing while the pointer is still over the rail leaves it hover-expanded, so the
    // titles must stay visible until the pointer actually leaves.
    reveal(open || nav.matches(':hover'));
    nav.classList.toggle(DRAWER.expanded, open);
    nav.classList.toggle(DRAWER.collapsed, !open);
    var t = nav.querySelector(DRAWER.trigger);
    if (t) t.setAttribute('aria-expanded', String(open));
    try { sessionStorage.setItem(KEY, open ? '1' : '0'); } catch (e) {}
  }
  function isOpen() { return pinned; }
  if (DRAWER) {
    var trig = document.querySelector(DRAWER.trigger);
    nav = trig && trig.closest('nav');
    if (nav) {
      [].slice.call(nav.querySelectorAll('*')).forEach(function (el) {
        var cls = DRAWER.collapsedOnly.filter(function (c) { return el.classList.contains(c); });
        if (cls.length) owned.push({ el: el, cls: cls });
      });
      /* The collapsed rail also expands on hover in live CSS
         (.cd0bc53c:not(expanded):hover { width: 25rem }). Show the titles for the hover
         too, or the rail widens into an empty panel. */
      nav.addEventListener('mouseenter', function () { if (!pinned) reveal(true); });
      nav.addEventListener('mouseleave', function () { if (!pinned) reveal(false); });
      trig.setAttribute('role', 'button');
      trig.setAttribute('tabindex', '0');
      trig.style.cursor = 'pointer';
      var saved = null;
      try { saved = sessionStorage.getItem(KEY); } catch (e) {}
      setDrawer(saved === '1');
      trig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawer(!isOpen()); }
      });
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (isOpen()) { setDrawer(false); return; }
    for (var k = 0; k < HOTSPOTS.length; k++) if (HOTSPOTS[k].key === 'Escape') { location.href = HOTSPOTS[k].go + '.html'; return; }
    // a popup frame closes back to the page it opened from, like live
    for (var i = 0; i < HOTSPOTS.length; i++) if (HOTSPOTS[i].outside) { location.href = HOTSPOTS[i].go + '.html'; return; }
  });

  document.addEventListener('click', function (e) {
    var tgt = e.target;
    // The drawer's own control goes first: nothing else should be able to claim it.
    if (DRAWER && nav && tgt.closest && tgt.closest(DRAWER.trigger)) { e.preventDefault(); setDrawer(!isOpen()); return; }
    var go = hotspot(e);
    if (go) { e.preventDefault(); e.stopPropagation(); location.href = go + '.html'; return; }
    // Click outside an open drawer closes it, like any overlay panel.
    if (nav && isOpen() && tgt.closest && !tgt.closest('nav')) setDrawer(false);

    var off = tgt.closest && tgt.closest('[data-proto-offsite]');
    if (off) {
      e.preventDefault();
      note('Not part of this prototype: ' + off.getAttribute('data-proto-offsite'));
      return;
    }
    var b = tgt.closest && tgt.closest('button, [role="button"], a');
    if (b && /^\\s*ok, i understand\\s*$/i.test(b.textContent || '')) {
      e.preventDefault();
      var box = b;
      for (var i = 0; i < 12 && box.parentElement; i++) {
        box = box.parentElement;
        var cs = getComputedStyle(box);
        if (cs.position === 'fixed' || cs.position === 'absolute' || box.getAttribute('role') === 'dialog') break;
      }
      box.style.display = 'none';
    }
  }, true);
})();
</script>`;
}

/** Kept for any caller that wants the runtime without a drawer. */
export const PROTOTYPE_RUNTIME = prototypeRuntime({ id: 'default' });
