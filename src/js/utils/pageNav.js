import lang from '../lang.js';

export const APP_PAGE  = 'site:PageApplications';
export const APP_BLOCK = 'site:BlockApplicationsTabs';

/** @typedef {{ l: string, page: string, doc?: { tab: string, section?: string }, apps?: { aspect: string, item?: string } }} SiteRoute */

let _go = () => {};

/** @param {(hash: string) => void} routerGo */
export function initPageNav (routerGo) {
  _go = routerGo;
}

/** @param {string} hash */
export function nav (hash) {
  _go(hash);
}

/**
 * #/{lang}/p/{page}[/doc/{tab}[/section]]][/apps/{aspect}[/item]]]
 * @param {string} [hash]
 * @returns {SiteRoute | null}
 */
export function parseRoute (hash = location.hash) {
  const parts = hash.slice(1).split('/').filter(Boolean);
  if (parts.length < 3 || parts[1] !== 'p') return null;

  const route = {
    l:    parts[0],
    page: decodeURIComponent(parts[2]),
  };
  const tail = parts.slice(3).map(decodeURIComponent);
  if (tail[0] === 'doc') {
    route.doc = { tab: tail[1], section: tail[2] };
  } else if (tail[0] === 'apps') {
    route.apps = { aspect: tail[1], item: tail[2] };
  }
  return route;
}

/**
 * @param {string} l
 * @param {string} page
 * @param {{ doc?: { tab: string, section?: string }, apps?: { aspect: string, item?: string } }} [sub]
 */
export function buildRoute (l, page, sub) {
  let hash = `#/${l}/p/${encodeURIComponent(page)}`;
  if (sub?.doc) {
    hash += `/doc/${encodeURIComponent(sub.doc.tab)}`;
    if (sub.doc.section) hash += `/${encodeURIComponent(sub.doc.section)}`;
  } else if (sub?.apps) {
    hash += `/apps/${encodeURIComponent(sub.apps.aspect)}`;
    if (sub.apps.item) hash += `/${encodeURIComponent(sub.apps.item)}`;
  }
  return hash;
}

/** @param {SiteRoute | null} route */
export function isAppDetail (route) {
  return route?.page === APP_PAGE && !!route.apps?.item;
}

/** @param {string} sectionId */
export function scrollToSection (sectionId) {
  if (!sectionId) return;
  const el = document.getElementById(decodeURIComponent(sectionId));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** @param {string} fileUrl */
export function mdTabKey (fileUrl) {
  const name = fileUrl?.split('/').pop() ?? '';
  return name.replace(/\.md$/i, '');
}

/** Rewrite #anchor TOC links under a doc tab. */
export function rewriteTocLinks (root, docTab) {
  if (!root || !lang.current || !lang.page || !docTab) return;
  const base = buildRoute(lang.current, lang.page, { doc: { tab: docTab } });
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#/')) return;
    const slug = href.slice(1);
    if (!slug) return;
    a.setAttribute('href', `${base}/${encodeURIComponent(slug)}`);
  });
}

/** Clicks on #slug TOC links inside .markdown */
export function initTocLinks () {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.markdown a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#/')) return;
    e.preventDefault();
    if (!lang.current) return;
    const route = parseRoute();
    const host  = a.closest('block-doc-tabs');
    const tab   = route?.doc?.tab ?? host?.dataset?.activeDocTab;
    if (!tab || !route) return;
    nav(buildRoute(lang.current, route.page, {
      doc: { tab, section: decodeURIComponent(href.slice(1)) },
    }));
  });
}
