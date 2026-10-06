/**
 * The consumer site (dubizzle.com.eg, desktop + mobile web) as a clickable prototype.
 *
 * The agency portal got this treatment first (scripts/lib/prototype.mjs). The consumer
 * templates — home, the verticals, listings, ad details, the account screens — were
 * built from captures too, but their links still pointed at production, so the screens
 * never led to each other. This module says, for every link path a capture can carry,
 * which sibling template it lands on, and lists the button-driven states (dropdowns,
 * dialogs, sheets) as hotspots in the portal's format.
 *
 * Two rules keep it honest:
 *   - A route maps to the ONE representative capture of that screen type (every car
 *     listing is the cars list, every goods category is the mobiles list, every car ad
 *     is the Mercedes DPV). Such a jump is marked `representative`, and the flows say so.
 *   - A hotspot only exists where the state was captured ON that page. "Report this ad"
 *     opens the report dialog from the car DPV, because that is where it was captured;
 *     on the property DPV it does nothing rather than pretend.
 *
 * Used by scripts/wire-prototype.mjs (wiring) and scripts/build-flows.mjs (the flows).
 */

export const ORIGIN = 'https://www.dubizzle.com.eg';

/* Pages grouped the way the product is organised. Every template outside the portal
   belongs to exactly one section; the section is the unit the flows are stored by. */
export const SECTIONS = {
  home: {
    label: 'Home & header',
    entry: 'home',
    pages: [
      'home', 'menu-vehicles', 'menu-vehicles-car-care', 'menu-properties', 'menu-mobiles', 'menu-jobs',
      'menu-furniture', 'menu-electronics', 'menu-more-categories', 'location-dropdown', 'search-suggestions',
      'login-dialog', 'login', 'm-search-overlay', 'm-search-suggestions', 'm-location-page', 'not-found',
    ],
  },
  motors: {
    label: 'Motors',
    entry: 'motors',
    pages: [
      'motors', 'vehicles-listing', 'new-cars', 'new-cars-brand', 'new-cars-model', 'car-comparison',
      'car-comparison-result', 'electric-cars', 'car-finance', 'car-finance-bank',
    ],
  },
  property: {
    label: 'Property',
    entry: 'property-landing',
    pages: ['property-landing', 'properties', 'property-agencies', 'property-area', 'property-compound', 'agency-page'],
  },
  listings: {
    label: 'Search & listings',
    entry: 'search',
    pages: [
      'search', 'search-cars-model', 'search-motorcycles', 'search-trucks', 'search-property', 'search-property-rent',
      'search-property-commercial', 'search-property-vacation', 'search-property-land', 'search-mobiles',
      'sort-menu', 'save-search', 'm-filters',
    ],
  },
  'ad-detail': {
    label: 'Ad detail',
    entry: 'ad-detail',
    pages: [
      'ad-detail', 'ad-detail-property', 'ad-detail-property-rent', 'ad-detail-mobile-phone', 'dpv-phone', 'dpv-report',
      'dpv-report-in', 'dpv-report-form', 'dpv-details-expanded', 'dpv-gallery', 'seller-page',
    ],
  },
  account: {
    label: 'Account (signed in)',
    entry: 'my-ads',
    pages: [
      'my-ads', 'chat', 'edit-profile', 'settings-privacy', 'settings-notifications', 'favourites', 'favourites-empty', 'saved-searches', 'saved-searches-empty',
      'packages', 'user-menu', 'm-user-menu', 'payment',
    ],
  },
  'post-ad': {
    label: 'Post an ad & upselling',
    entry: 'post-ad-category',
    pages: ['post-ad-category', 'post-ad-subcategory', 'post-ad', 'post-ad-filled', 'upsell-select', 'upsell'],
  },
  'agency-portal': {
    label: 'Agency portal (dubizzle Pro)',
    entry: 'portal-dashboard',
    pages: [], // every portal-* template; wired by scripts/lib/prototype.mjs, desktop only
    portal: true,
  },
};

export function sectionOf(page) {
  if (page.startsWith('portal-')) return 'agency-portal';
  for (const [id, s] of Object.entries(SECTIONS)) if (s.pages.includes(page)) return id;
  return null;
}

const PROPERTY_PAGE = /^(propert|realestate|agency-page|search-property|ad-detail-property)/;
const MOBILES_PAGE = /^(search-mobiles|ad-detail-mobile-phone)$/;

/* Which ad-detail capture a listing link stands for. The slug tells the vertical most of
   the time; otherwise the page the link sits on does (a property listing links to
   property ads). Arabic slugs are percent-encoded and carry no words — page context. */
function adTarget(path, page) {
  const slug = decodeURIComponent(path).toLowerCase();
  const rent = /for-rent|-rent-|للايجار|للإيجار/.test(slug);
  const property = /apartment|villa|penthouse|duplex|chalet|studio|office|shop|land|compound|sqm|-m2-|bedroom|floor|townhouse|twin|شقة|فيلا|شاليه|محل|ارض|أرض/.test(slug);
  const phone = /iphone|samsung|galaxy|phone|oppo|xiaomi|redmi|realme|huawei|honor|infinix|tecno|nokia|ipad|tablet|ايفون|آيفون|سامسونج|موبايل/.test(slug);
  if (property) return rent ? 'ad-detail-property-rent' : 'ad-detail-property';
  if (phone) return 'ad-detail-mobile-phone';
  if (PROPERTY_PAGE.test(page)) return /rent/.test(page) ? 'ad-detail-property-rent' : 'ad-detail-property';
  if (MOBILES_PAGE.test(page)) return 'ad-detail-mobile-phone';
  return 'ad-detail';
}

const GOODS = 'jobs|fashion-beauty|electronics-home-appliances|home-furniture-decor|kids-babies|pets|business-industrial-agriculture|books-sports-hobbies|services';

/**
 * Resolves a live path to the template it lands on, with the representative note where
 * the capture stands in for a family of pages. `null` means: not part of the prototype.
 *   path    pathname only (no origin, query or hash)
 *   ctx     { layout: 'desktop'|'mobile', page: the template the link sits on }
 */
export function resolveRoute(path, ctx) {
  const { layout, page } = ctx;
  const rep = (target, note) => ({ target, representative: note });
  const hit = (target) => ({ target });
  const p = path.replace(/\/+$/, '/').replace(/^\/en\/?$/, '/en/');

  if (/^\/(en\/)?$/.test(p)) return hit('home');
  if (/^\/en\/motors\/?$/.test(p)) return hit('motors');
  if (/^\/en\/motors\/new-cars\/(all-new-cars\/)?$/.test(p)) return hit('new-cars');
  if (/^\/en\/motors\/new-cars\/compare\/$/.test(p)) return hit('car-comparison');
  if (/^\/en\/motors\/new-cars\/compare\/[^/]+\/$/.test(p)) return rep('car-comparison-result', 'every comparison result shows the captured MG 6 vs Corolla result');
  if (/^\/en\/motors\/new-cars\/[^/]+\/$/.test(p)) return rep('new-cars-brand', 'every brand page shows the captured Toyota page');
  if (/^\/en\/motors\/new-cars\/[^/]+\/[^/]+\/$/.test(p)) return rep('new-cars-model', 'every model page shows the captured Corolla page');
  if (/^\/en\/motors\/electric-cars\/$/.test(p)) return hit('electric-cars');
  if (/^\/en\/motors\/car-finance\/$/.test(p)) return hit('car-finance');
  if (/^\/en\/motors\/car-finance\/[^/]+\/$/.test(p)) return rep('car-finance-bank', 'every bank page shows the captured EG Bank page');

  if (/^\/en\/realestate\/$/.test(p)) return hit('property-landing');
  if (/^\/en\/realestate\/agencies\/$/.test(p)) return hit('property-agencies');

  if (/^\/en\/vehicles\/$/.test(p)) return hit('vehicles-listing');
  if (/^\/en\/vehicles\/cars-for-sale\/$/.test(p)) return hit('search');
  if (/^\/en\/vehicles\/cars-for-sale\/[^/]+\/$/.test(p)) return rep('search', 'a brand or city car listing shows the captured cars list');
  if (/^\/en\/vehicles\/cars-for-sale\/[^/]+\/[^/]+\/$/.test(p)) return rep('search-cars-model', 'a brand + model listing shows the captured Mercedes C180 list');
  if (/^\/en\/vehicles\/cars-for-sale\/.+/.test(p)) return rep('search', 'a filtered car listing shows the captured cars list');
  if (/^\/en\/vehicles\/motorcycles-accessories\//.test(p)) return rep('search-motorcycles', 'motorcycle listings show the captured motorcycles list');
  if (/^\/en\/vehicles\/trucks-buses-other-vehicles\//.test(p)) return rep('search-trucks', 'truck & bus listings show the captured list');
  if (/^\/en\/vehicles\/.+/.test(p)) return rep('search', 'other vehicle listings show the captured cars list (same list-card anatomy)');

  if (/^\/en\/properties\/$/.test(p)) return hit('properties');
  if (/^\/en\/properties\/.*vacation-homes/.test(p)) return rep('search-property-vacation', 'vacation-home listings show the captured list');
  if (/^\/en\/properties\/.*commercial-/.test(p)) return rep('search-property-commercial', 'commercial listings show the captured list');
  if (/^\/en\/properties\/.*buildings-lands-other/.test(p)) return rep('search-property-land', 'land & building listings show the captured list');
  if (/^\/en\/properties\/[^/]*-for-rent\//.test(p)) return rep('search-property-rent', 'rent listings show the captured apartments-for-rent list');
  if (/^\/en\/properties\/[^/]*-for-sale\//.test(p)) return rep('search-property', 'sale listings show the captured apartments-for-sale list');
  if (/^\/en\/properties\/[^/]*-compound\/$/.test(p)) return rep('property-compound', 'every compound page shows the captured Mivida page');
  if (/^\/en\/properties\/[^/]+\/$/.test(p)) return rep('property-area', 'every area page shows the captured New Cairo page');
  if (/^\/en\/properties\/.+/.test(p)) return rep('search-property', 'other property listings show the captured apartments list');

  if (/^\/en\/mobile-phones-tablets-accessories-numbers\//.test(p)) return rep('search-mobiles', 'mobiles & tablets listings show the captured mobile phones list');
  if (new RegExp(`^/en/(${GOODS})/`).test(p)) return rep('search-mobiles', 'goods categories share the grid-card listing; the captured mobile phones list stands for them');

  if (/^\/en\/ad\/.*-ID\d+\.html$/.test(p)) {
    const t = adTarget(p, page);
    return rep(t, `every ad in this vertical opens the captured ${t.replace('ad-detail', 'ad detail').replace(/-/g, ' ')}`);
  }
  if (/^\/en\/companies\/[^/]+\/?$/.test(p)) {
    return PROPERTY_PAGE.test(page)
      ? rep('agency-page', 'every agency profile shows the captured Gate Real Estate page')
      : rep('seller-page', 'every seller profile shows the captured Smart Car page');
  }

  if (/^\/(en\/)?post\/?$/.test(p)) return hit('post-ad-category');
  if (/^\/en\/(myads|ads)\/?$/.test(p)) return hit('my-ads');
  if (/^\/en\/chat/.test(p)) return hit('chat');
  if (/^\/en\/myfavorites\/?$/.test(p)) return hit('favourites');
  if (/^\/en\/account\/?$/.test(p)) return hit(layout === 'mobile' ? 'm-user-menu' : 'edit-profile');
  if (/^\/en\/this-page-does-not-exist-404\/?$/.test(p)) return hit('not-found');
  if (/^\/en\/agencyPortal/.test(p)) return layout === 'desktop' ? hit('portal-dashboard') : null;
  return null;
}

/* ── Hotspots ───────────────────────────────────────────────────────────────────────
   Same vocabulary as PORTAL_HOTSPOTS (text / band / outside / box) plus selector,
   event, hover and key (see prototype.mjs). Every target below was captured on the
   page the rule is placed on (scripts/lib/states.mjs records the trigger). */
const HOME_D = /^(home|menu-[\w-]+|location-dropdown|search-suggestions)$/;
const MENU = /^menu-[\w-]+$/;
const STRIP_BAND = [140, 200]; // the header category strip, page px, desktop

const MENUS = [
  ['Vehicles', 'menu-vehicles'],
  ['Properties', 'menu-properties'],
  ['Mobiles & Tablets', 'menu-mobiles'],
  ['Jobs', 'menu-jobs'],
  ['Home & Office Furniture - Decor', 'menu-furniture'],
  ['Electronics & Appliances', 'menu-electronics'],
  ['More Categories', 'menu-more-categories'],
];

export const CONSUMER_HOTSPOTS = {
  desktop: [
    // header: the category strip opens its mega menu on hover, like live
    // (not from under an open dropdown: there the strip sits beneath the panel, as on live)
    ...MENUS.map(([label, go]) => ({ on: /^(home|menu-[\w-]+)$/, hover: label, band: STRIP_BAND, go })),
    { on: /^menu-vehicles$/, hover: 'Car Care', band: [190, 620], go: 'menu-vehicles-car-care' },
    { on: MENU, key: 'Escape', go: 'home' },
    // header: search field and location
    { on: /^(home|menu-[\w-]+|location-dropdown)$/, selector: 'input[placeholder^="Find Cars"]', event: 'focus', go: 'search-suggestions' },
    { on: /^(home|menu-[\w-]+|search-suggestions)$/, text: 'Egypt', band: [80, 130], go: 'location-dropdown' },
    { on: /^location-dropdown$/, outside: 'Use current location', go: 'home' },
    { on: /^location-dropdown$/, key: 'Escape', go: 'home' },
    { on: /^search-suggestions$/, key: 'Escape', go: 'home' },
    // login dialog (captured on home)
    { on: HOME_D, text: 'Login or Signup', go: 'login-dialog' },
    { on: /^login-dialog$/, selector: 'button[aria-label="Close button"]', go: 'home' },
    { on: /^login-dialog$/, outside: 'Login with Google', go: 'home' },
    { on: /^login-dialog$/, key: 'Escape', go: 'home' },
    // hero search buttons (the header's own Search button sits above the band)
    { on: /^(motors|new-cars|electric-cars)$/, text: 'Search', band: [300, 760], go: 'search' },
    { on: /^property-landing$/, text: 'Search', band: [420, 620], go: 'search-property' },
    { on: /^property-landing$/, text: 'Agencies', band: [300, 420], go: 'property-agencies' },
    // listing: sort menu and save search (captured on the cars list)
    { on: /^search$/, text: 'Sort by:', go: 'sort-menu' },
    { on: /^sort-menu$/, selector: '[role="option"]', go: 'search' },
    { on: /^sort-menu$/, outside: 'Most relevant', go: 'search' },
    { on: /^sort-menu$/, key: 'Escape', go: 'search' },
    { on: /^search$/, text: 'Save Search', go: 'save-search' },
    { on: /^save-search$/, selector: 'button[aria-label="Close button"]', go: 'search' },
    { on: /^save-search$/, outside: 'Login with Google', go: 'search' },
    { on: /^save-search$/, key: 'Escape', go: 'search' },
    // ad detail (captured on the car DPV)
    { on: /^ad-detail$/, text: 'Show phone number', go: 'dpv-phone' },
    { on: /^ad-detail$/, text: 'Report this ad', go: 'dpv-report' },
    { on: /^ad-detail$/, text: 'View +5 more', go: 'dpv-details-expanded' },
    { on: /^ad-detail$/, selector: '[aria-label="Gallery"], img[aria-label="Cover photo"]', go: 'dpv-gallery' },
    { on: /^dpv-(phone|report)$/, selector: 'button[aria-label="Close button"]', go: 'ad-detail' },
    { on: /^dpv-(phone|report)$/, outside: 'Login with Google', go: 'ad-detail' },
    { on: /^dpv-(phone|report|report-in|report-form|gallery)$/, key: 'Escape', go: 'ad-detail' },
    { on: /^dpv-details-expanded$/, text: 'View Less', go: 'ad-detail' },
    { on: /^dpv-gallery$/, text: 'Back to Ad Details', go: 'ad-detail' },
  ],
  mobile: [
    // home: search page, location page, login (all captured on home)
    { on: /^home$/, text: 'Search for great finds', go: 'm-search-overlay' },
    { on: /^home$/, text: 'Egypt', band: [200, 240], go: 'm-location-page' },
    // no Login trigger on mobile home: its "Login or Sign up" button sits in a hidden account
    // sheet in the capture; live reaches it through Account, captured signed in only (m-user-menu)
    { on: /^m-search-overlay$/, selector: 'input[placeholder^="Start searching"]', event: 'input', go: 'm-search-suggestions' },
    { on: /^m-search-(overlay|suggestions)$/, box: [0, 0, 48, 56], go: 'home' }, // the back arrow
    { on: /^m-search-(overlay|suggestions)$/, key: 'Escape', go: 'home' },
    { on: /^m-location-page$/, box: [0, 0, 48, 56], go: 'home' }, // the close ×
    { on: /^m-location-page$/, key: 'Escape', go: 'home' },
    { on: /^login$/, selector: 'button[aria-label="Close button"]', go: 'home' },
    { on: /^login$/, key: 'Escape', go: 'home' },
    // bottom nav buttons (links are wired as links; these two are <button>s)
    { on: /^(home|search[\w-]*|motors|property-landing|properties|vehicles-listing)$/, text: 'Account', go: 'm-user-menu' },
    { on: /^(home|search[\w-]*|motors|property-landing|properties|vehicles-listing)$/, text: 'Sell', go: 'post-ad-category' },
    // listing: the filter sheet (captured on the cars list)
    { on: /^search$/, selector: 'img[alt="Filters Icon"]', go: 'm-filters' },
    { on: /^m-filters$/, box: [0, 0, 48, 56], go: 'search' }, // the back arrow
    { on: /^m-filters$/, text: 'See +13K Results', go: 'search' },
    { on: /^m-filters$/, key: 'Escape', go: 'search' },
    // ad detail (captured on the car DPV)
    { on: /^ad-detail$/, text: 'Report this ad', go: 'dpv-report' },
    { on: /^ad-detail$/, text: 'View +5 more', go: 'dpv-details-expanded' },
    { on: /^ad-detail$/, selector: 'button[aria-label="Back button"]', go: 'search' },
    { on: /^dpv-report$/, selector: 'button[aria-label="Close button"]', go: 'ad-detail' },
    // no click-outside rule on mobile: a tap beside the sheet reaches the page behind it in
    // the frozen capture, and live's behaviour there was not captured — × and Escape close it
    { on: /^dpv-(report|report-in|report-form)$/, key: 'Escape', go: 'ad-detail' },
    { on: /^dpv-details-expanded$/, text: 'View Less', go: 'ad-detail' },
  ],
};

/** The consumer hotspots that apply to one page and lead to a built target. */
export function consumerHotspotsFor(layout, page, isAvailable) {
  return (CONSUMER_HOTSPOTS[layout] || [])
    .filter((h) => h.on.test(page) && isAvailable(h.go))
    .map(({ on, ...rest }) => rest);
}

function pathOf(href) {
  let h = href.replace(/&amp;/g, '&');
  if (h.startsWith(ORIGIN)) h = h.slice(ORIGIN.length);
  else if (/^https?:\/\//i.test(h)) return null; // another site entirely
  if (!h.startsWith('/')) return null; // fragment, mailto:, relative asset
  return h.split('#')[0].split('?')[0];
}

const ANCHOR = /<a\b([^>]*?)\shref="([^"]*)"([^>]*)>/gi;

/**
 * Undoes a previous wiring so the pass can run again on its own output: every wired or
 * neutralised anchor keeps the live path it came from (`data-proto-path` /
 * `data-proto-offsite`), and the runtime sits between two markers.
 */
export function unwire(html) {
  let out = html.replace(/\n?<!-- proto-runtime:consumer -->[\s\S]*?<!-- \/proto-runtime:consumer -->\n?/g, '\n');
  out = out.replace(ANCHOR, (whole, pre, href, post) => {
    const attrs = `${pre}${post}`;
    const m = attrs.match(/\sdata-proto-(?:path|offsite)="([^"]*)"/);
    if (!m) return whole;
    const kept = m[1].replace(/&quot;/g, '"');
    const live = /^https?:\/\//i.test(kept) ? kept : `${ORIGIN}${kept}`;
    const clean = attrs.replace(/\sdata-proto-(?:link|path|offsite|representative)="[^"]*"/g, '');
    return `<a${clean} href="${live}">`;
  });
  return out;
}

/**
 * Rewrites every <a href> of a consumer template:
 *   dubizzle path with a built target → the sibling template, keeping the live path
 *   any other dubizzle / external link → neutralised (`#`, with the path kept so the
 *                                        runtime can say where it would have gone)
 * Returns the wired HTML plus a ledger of what went where, for the flows.
 */
export function wireConsumer(html, ctx, isAvailable) {
  const links = new Map(); // target → { count, texts:Set, representative }
  let wired = 0;
  let neutralised = 0;
  const out = html.replace(ANCHOR, (whole, pre, href, post) => {
    const path = pathOf(href);
    if (path === null) {
      if (/^https?:\/\//i.test(href)) {
        neutralised++;
        const attrs = `${pre}${post}`.replace(/\s(target|rel)="[^"]*"/gi, '');
        return `<a${attrs} href="#" data-proto-offsite="${href.replace(/"/g, '&quot;')}">`;
      }
      return whole;
    }
    const attrs = `${pre}${post}`.replace(/\s(target|rel)="[^"]*"/gi, '');
    const r = resolveRoute(path, ctx);
    if (r && isAvailable(r.target)) {
      wired++;
      const entry = links.get(r.target) || { count: 0, representative: r.representative || null };
      entry.count++;
      links.set(r.target, entry);
      const repAttr = r.representative ? ` data-proto-representative="${r.representative.replace(/"/g, '&quot;')}"` : '';
      return `<a${attrs} href="${r.target}.html" data-proto-link="${r.target}" data-proto-path="${path.replace(/"/g, '&quot;')}"${repAttr}>`;
    }
    neutralised++;
    return `<a${attrs} href="#" data-proto-offsite="${path.replace(/"/g, '&quot;')}">`;
  });
  // the visible words on each wired link, for the flows ("what did the user click")
  for (const m of out.matchAll(/<a\b[^>]*data-proto-link="([\w-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const entry = links.get(m[1]);
    if (!entry) continue;
    entry.texts ||= new Set();
    const alt = m[2].match(/\b(?:alt|aria-label)="([^"]+)"/)?.[1];
    const text = m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || alt || '';
    if (text && entry.texts.size < 4) entry.texts.add(text.slice(0, 48));
  }
  return { html: out, wired, neutralised, links };
}
