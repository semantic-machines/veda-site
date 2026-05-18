/**
 * Site configuration singleton.
 *
 * Loads site:VedaSite once at startup, injects CSS design tokens,
 * builds the navigation tree and a slug → page-URI lookup map.
 */

import { Model } from 'veda-client';
import { parseMLString } from './utils/mlValue.js';

// URI of the root site object — change here when deploying a different site.
export const SITE_URI = 'site:VedaSite';

let _config   = null;
let _promise  = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBiLingual (model, prop) {
  const result = { ru: '', en: '' };
  for (const v of model[prop] ?? []) {
    const { text, lang } = parseMLString(String(v));
    if (lang === 'RU')      result.ru = result.ru || text;
    else if (lang === 'EN') result.en = result.en || text;
    else { result.ru = result.ru || text; result.en = result.en || text; }
  }
  return result;
}

async function loadMenuItems (refs) {
  const items = await Promise.all(
    refs.map(async (ref) => {
      const item = new Model(ref.id);
      await item.load();

      let slug    = null;
      let pageUri = null;
      const pageRef = item['site:targetPage']?.[0];
      if (pageRef) {
        const page = new Model(pageRef.id);
        await page.load();
        slug    = page['site:slug']?.[0] ?? null;
        pageUri = page.id;
      }

      const subRefs = item['site:hasMenuItem'] ?? [];
      const children = subRefs.length ? await loadMenuItems(subRefs) : [];

      return {
        id:       item.id,
        labelBi:  getBiLingual(item, 'rdfs:label'),
        order:    item['v-s:order']?.[0] ?? 0,
        hidden:   !!item['v-s:deleted']?.[0],
        slug,
        pageUri,
        children,
      };
    })
  );

  return items
    .filter((i) => !i.hidden)
    .sort((a, b) => a.order - b.order);
}

function collectSlugs (items, map) {
  for (const item of items) {
    if (item.slug && item.pageUri) map[item.slug] = item.pageUri;
    if (item.children.length) collectSlugs(item.children, map);
  }
}

function injectTokens (site) {
  const TOKENS = [
    ['colorPrimary',      '--color-primary'],
    ['colorPrimaryHover', '--color-primary-hover'],
    ['colorPrimaryLight', '--color-primary-light'],
    ['colorText',         '--color-text'],
    ['colorTextMuted',    '--color-text-muted'],
    ['colorBg',           '--color-bg'],
    ['colorBgAlt',        '--color-bg-alt'],
    ['fontSans',          '--font-sans'],
  ];

  const vars = TOKENS
    .map(([prop, css]) => {
      const val = site[`site:${prop}`]?.[0];
      return val ? `  ${css}: ${val};` : null;
    })
    .filter(Boolean)
    .join('\n');

  if (vars) {
    const el = document.createElement('style');
    el.id = 'site-tokens';
    el.textContent = `:root {\n${vars}\n}`;
    document.head.prepend(el);
  }

  const customCss = site['site:customCss']?.[0];
  if (customCss) {
    const el = document.createElement('style');
    el.id = 'site-custom-css';
    el.textContent = customCss;
    document.head.appendChild(el);
  }
}

// ── Loader ───────────────────────────────────────────────────────────────────

async function loadConfig () {
  const site = new Model(SITE_URI);
  await site.load();

  injectTokens(site);

  const menus = await Promise.all(
    (site['site:hasNavMenu'] ?? []).map(async (ref) => {
      const menu = new Model(ref.id);
      await menu.load();
      const items = await loadMenuItems(menu['site:hasMenuItem'] ?? []);
      return {
        id:       menu.id,
        position: menu['site:navPosition']?.[0] ?? 'main',
        items,
      };
    })
  );

  const slugToUri = {};
  for (const menu of menus) collectSlugs(menu.items, slugToUri);

  // Also register all pages listed directly on the site object (non-nav pages
  // like privacy, download, about must still be reachable by slug).
  await Promise.all(
    (site['site:hasPage'] ?? []).map(async (ref) => {
      if (slugToUri[ref.id]) return;
      const page = new Model(ref.id);
      await page.load();
      const slug = page['site:slug']?.[0];
      if (slug && !slugToUri[slug]) slugToUri[slug] = page.id;
    })
  );

  return {
    defaultLang: site['site:defaultLang']?.[0] ?? 'ru',
    logoUrl:     site['v-s:hasImage']?.[0]?.id ? `/files/${site['v-s:hasImage'][0].id}` : null,
    menus,
    mainMenu:   menus.find((m) => m.position === 'main')   ?? { items: [] },
    footerMenu: menus.find((m) => m.position === 'footer') ?? { items: [] },
    slugToUri,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load (or return cached) site configuration.
 * Safe to call concurrently — only one network request is made.
 */
export async function getSiteConfig () {
  if (_config)   return _config;
  if (_promise)  return _promise;

  _promise = loadConfig().then((cfg) => { _config = cfg; return cfg; });
  return _promise;
}

/** Resolve a URL slug to a page URI. Returns null if not found. */
export function getPageUri (slug) {
  return _config?.slugToUri[slug] ?? null;
}

/** Expose cached config synchronously (null until first getSiteConfig() resolves). */
export function getCachedConfig () {
  return _config;
}
