#!/usr/bin/env node
/**
 * Captures logged-in dubizzle.com.eg screens (My Ads, Chats, Edit Profile, Settings,
 * packages) in desktop and mobile, from the signed-in capture window opened by
 * `npm run capture:login`. Every capture is redacted twice (see lib/redact.mjs) and is
 * refused outright if the account name or any script tag survives.
 *
 * Read-only by construction: the script only navigates, scrolls and reads. It never
 * clicks inside page content — no Post now, Remove, Republish, Save, Send or Pay — so it
 * cannot change the account. Opening a chat thread would mark it read, so threads are
 * not opened here.
 *
 *   npm run capture:account                     # all screens, both layouts
 *   npm run capture:account -- my-ads chat      # named screens
 *   npm run capture:account -- --layout=mobile
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { absolutize } from './lib/absolutize.mjs';
import { recordResponses, snapshotHtml } from './lib/snapshot.mjs';
import { buildGallery } from './build-screens-gallery.mjs';
import { ORIGIN, LAYOUTS, sleep, scrollThrough, settleFixedElements, captureAndDismissInterstitial, removePushPrompt } from './lib/render-helpers.mjs';
import { readAccountIdentity, redactPage, sanitizeHtml, leaks, visibleLeaks } from './lib/redact.mjs';
import { connectToSession, isSignedIn } from './capture-session.mjs';
import { fixturizeTables, fixturizeCards, scrubContactsPage, scrubContactsHtml, contactLeaks } from './lib/redact.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design-kit/reference/live');
const SCREENS = join(OUT, 'screens');

export const ACCOUNT_SCREENS = {
  'my-ads': '/en/myads',
  chat: '/en/chat',
  'edit-profile': '/en/editProfile/info',
  'settings-privacy': '/en/settings/privacy',
  'settings-notifications': '/en/settings/notifications',
  packages: '/en/payments/businesspackages/my-account',
  /* Favourites and Saved searches share one page (tab 0 / tab 1). Routes from the maple monorepo
     (favouritesRoute.ts: ^/myfavorites, savedSearchesRoute.ts: ^/savedsearches). Sign in with an account that has
     nothing saved to capture the empty states. */
  favourites: '/en/myfavorites',
  'saved-searches': '/en/savedsearches',

  /* Agency portal (/en/agencyPortal — camelCase; every lowercase spelling 404s).
     Reachable only with an agency account; the nav lists these eight sections. */
  'portal-dashboard': '/en/agencyPortal',
  'portal-ads': '/en/agencyPortal/ads',
  'portal-leads': '/en/agencyPortal/leads',
  'portal-vip': '/en/agencyPortal/vip',
  'portal-candidates': '/en/agencyPortal/jobsApplications',
  'portal-agents': '/en/agencyPortal/agents',
  'portal-insights': '/en/agencyPortal/insights/cars-market',
  'portal-credit': '/en/agencyPortal/creditInfo/all',

  /* Second-level portal screens, reachable only by clicking through — found by
     walking the route graph of the eight above (2026-09-21). The ad overview is one
     representative of /ads/extraDetails/<id>/overview; every Agency Ads row links
     to its own. Same for the candidate detail. */
  /* The ad details drawer: clicking any Agency Ads card opens it over the list and
     pushes /ads/extraDetails/<id>/<tab>. Five tabs, each its own URL. The ID is an ad
     that was active on 2026-09-21; if it expires the URL falls back to the list (that
     is what broke the first attempt) — check the saved screen shows the drawer. */
  'portal-ad-overview': '/en/agencyPortal/ads/extraDetails/207466446/overview?tabChange=true',
  'portal-ad-info': '/en/agencyPortal/ads/extraDetails/207466446/info',
  'portal-ad-promo': '/en/agencyPortal/ads/extraDetails/207466446/promotional%20tools',
  'portal-ad-agent': '/en/agencyPortal/ads/extraDetails/207466446/agent',
  'portal-ad-chats': '/en/agencyPortal/ads/extraDetails/207466446/chats',
  'portal-credit-self': '/en/agencyPortal/creditInfo/self',
  'portal-credit-agents': '/en/agencyPortal/creditInfo/agents',

  /* Leads filter tabs. They are <button>s that push a real URL, so each tab is its own
     capturable state (probed on live 2026-09-21). "Chats" leaves the portal for the
     consumer /en/chat, which is already captured as the chat template. */
  'portal-leads-phone': '/en/agencyPortal/leads?filter=leadType_eq_phone',
  'portal-leads-sms': '/en/agencyPortal/leads?filter=leadType_eq_sms',
  'portal-leads-whatsapp': '/en/agencyPortal/leads?filter=leadType_eq_whatsapp',
  'portal-candidate-detail': '/en/agencyPortal/jobsApplications/208428952',
};

/* Screens listing OTHER people — buyers who contacted the agency, job applicants,
   staff. Their table rows are overwritten with fixtures before anything is saved:
   a name is not a pattern, so detect-and-replace would leak whatever it missed.
   See fixturizeTables() in lib/redact.mjs. */
export const FIXTURE_SCREENS = new Set([
  'portal-dashboard',
  // each ad row says "Assigned to: <agent>" — a staff member's name (D-017)
  'portal-ads',
  'portal-leads',
  'portal-vip',
  'portal-candidates',
  'portal-agents',
  // an ad's own performance page can list the people who enquired about it
  'portal-ad-overview',
  'portal-ad-info',
  'portal-ad-promo',
  // names the assigned agent, and the chats tab lists buyers
  'portal-ad-agent',
  'portal-ad-chats',
  // per-agent credit allocation names staff
  'portal-credit-agents',
  // a job's applicants are named individuals with CVs
  'portal-candidate-detail',
  // filtered Leads views list the same people as Leads
  'portal-leads-phone',
  'portal-leads-sms',
  'portal-leads-whatsapp',
]);

/* The portal is client-rendered and slow to fill; the default settle leaves empty
   tables, the same problem property-agencies had. */
export const PORTAL_WAIT = 6000;

/* dubizzle Pro has no mobile layout — confirmed by the user, 2026-09-18. Rendering
   it at 390px produces a squeezed desktop page, not a mobile design, so capturing it
   would put a misleading "mobile portal" in the gallery. Skipped rather than saved. */
export const DESKTOP_ONLY = new Set(Object.keys(ACCOUNT_SCREENS).filter((k) => k.startsWith('portal-')));

const args = process.argv.slice(2);
const layoutArg = args.find((a) => a.startsWith('--layout='))?.split('=')[1];
const layouts = layoutArg ? [layoutArg] : Object.keys(LAYOUTS);
const names = args.filter((a) => !a.startsWith('--'));
const selected = names.length ? names : Object.keys(ACCOUNT_SCREENS);
const unknown = selected.filter((n) => !ACCOUNT_SCREENS[n]);
if (unknown.length) {
  console.error(`Unknown screen(s): ${unknown.join(', ')}. Known: ${Object.keys(ACCOUNT_SCREENS).join(', ')}`);
  process.exit(2);
}

mkdirSync(SCREENS, { recursive: true });
const browser = await connectToSession();

// Identity is read once from a desktop page, where the header shows the name.
const probe = await browser.newPage();
await probe.setViewport(LAYOUTS.desktop.viewport);
/* Third place this bites: a signed-in session keeps long-poll connections open, so
   networkidle2 never fires and this sign-in probe times out at 90s, aborting the whole
   run before a single screen is captured. Settle on DOM, then wait for quiet only as
   far as it comes. Same fix as readAccountIdentity() and the portal navigations. */
await probe.goto(`${ORIGIN}/en/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await probe.waitForNetworkIdle({ idleTime: 900, timeout: 20_000 }).catch(() => {});
await sleep(2500);
if (!(await isSignedIn(probe))) {
  console.error('The capture window is signed out. Sign in there, then run: npm run capture:login -- --check');
  await probe.close();
  await browser.disconnect();
  process.exit(1);
}
const identity = await readAccountIdentity(probe, ORIGIN);
await probe.close();
if (!identity?.fullName) {
  console.error('Could not read the account name to redact it — refusing to capture unredacted screens.');
  await browser.disconnect();
  process.exit(1);
}

const results = [];
for (const name of selected) {
  for (const layout of layouts) {
    if (layout !== 'desktop' && DESKTOP_ONLY.has(name)) {
      results.push({ base: `${name}.${layout}`, status: 'skipped', detail: 'dubizzle Pro has no mobile layout' });
      continue;
    }
    const { viewport, userAgent } = LAYOUTS[layout];
    const base = `${name}.${layout}`;
    const page = await browser.newPage();
    try {
      await page.setUserAgent(userAgent);
      await page.setViewport(viewport);
      const recorder = recordResponses(page);
      /* The agency portal holds long-poll connections open, so networkidle2 never
         fires and every page times out at 90s even though it rendered long before.
         Same fix as the signed-in state captures: settle on DOM, then wait for the
         network to go quiet only as far as it will. */
      const portal = name.startsWith('portal-');
      const response = await page.goto(ORIGIN + ACCOUNT_SCREENS[name], {
        waitUntil: portal ? 'domcontentloaded' : 'networkidle2',
        timeout: 90_000,
      });
      if (portal) await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20_000 }).catch(() => {});
      const status = response?.status() ?? 0;
      await sleep(2000);
      if (status !== 200 || /\/notfound\b/.test(page.url())) {
        results.push({ base, status: 'FAILED', detail: `HTTP ${status} at ${page.url().replace(ORIGIN, '')}` });
        continue;
      }
      if (layout === 'mobile') await captureAndDismissInterstitial(page, null);
      if (name.startsWith('portal-')) await sleep(PORTAL_WAIT);
      await scrollThrough(page);
      await page.waitForNetworkIdle({ idleTime: 800, timeout: 15_000 }).catch(() => {});

      await removePushPrompt(page);
      /* Third-party data goes first, before any redaction or serialization: the
         portal's Leads/Candidates/Agents tables list other people, and a name is
         not a pattern. Overwrite every data row with fixtures, then scrub phones
         and emails as a backstop. */
      let fixed = null;
      if (FIXTURE_SCREENS.has(name)) {
        fixed = await fixturizeTables(page);
        // Cards as well as tables: the Candidates screen has no <table> at all, and a
        // real applicant's name passed straight through the table pass (D-017).
        const c = await fixturizeCards(page);
        fixed = { ...fixed, cards: c.cards, cardLeaves: c.leaves, fields: c.fields };
        await scrubContactsPage(page);
      }
      const counts = await redactPage(page, identity);
      let html = sanitizeHtml(absolutize(await snapshotHtml(page, recorder, { inlineImages: false, restoreScroll: false }), ORIGIN), identity);
      if (FIXTURE_SCREENS.has(name)) {
        html = scrubContactsHtml(html);
        const contacts = contactLeaks(html);
        if (contacts.length) {
          results.push({ base, status: 'FAILED', detail: `refused to save — third-party contact details: ${contacts.join(', ')}` });
          continue;
        }
      }
      const leaked = leaks(html, identity);
      if (leaked.length) {
        results.push({ base, status: 'FAILED', detail: `refused to save — still contains: ${leaked.join(', ')}` });
        continue;
      }
      await settleFixedElements(page);
      await redactPage(page, identity);
      // settleFixedElements can re-render a component and restore what was scrubbed,
      // so third-party contacts are scrubbed again immediately before the screen check.
      if (FIXTURE_SCREENS.has(name)) await scrubContactsPage(page);
      const onScreen = await visibleLeaks(page, identity);
      if (onScreen.length) {
        results.push({ base, status: 'FAILED', detail: `refused — still visible on screen: ${onScreen.join(', ')}` });
        continue;
      }
      writeFileSync(join(OUT, `${base}.html`), html);
      await page.screenshot({ path: join(SCREENS, `${base}.png`), fullPage: true });

      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      results.push({
        base,
        status: 'saved',
        detail: `${height}px tall · redacted: ${counts.text} text, ${counts.chatRows} chat rows, ${counts.inputs} fields, ${counts.avatars} avatars${
          fixed ? ` · fixtures: ${fixed.cells} cells/${fixed.tables} table(s), ${fixed.cardLeaves} leaves/${fixed.cards} card(s), ${fixed.fields} labelled field(s)` : ''
        }`,
      });
    } catch (error) {
      results.push({ base, status: 'FAILED', detail: error.message.split('\n')[0] });
    } finally {
      await page.close();
    }
  }
}

await browser.disconnect();
buildGallery();
for (const r of results) console.log(`${r.status.padEnd(6)}  ${r.base.padEnd(32)} ${r.detail}`);
const failed = results.filter((r) => r.status === 'FAILED').length;
const skipped = results.filter((r) => r.status === 'skipped').length;
// Count the three outcomes separately: a tally that folds skips into "saved"
// overstates what a run produced, which is how a missing capture goes unnoticed.
console.log(
  `\n${results.length - failed - skipped} saved, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`,
);
process.exit(failed ? 1 : 0);
