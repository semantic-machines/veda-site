import { Router } from 'veda-client';
import lang from './lang.js';

function getOutlet () {
  return document.querySelector('site-app main')
    ?? document.querySelector('#outlet');
}

function setLang (l, page) {
  lang.current = l;
  lang.page = page;
  document.documentElement.lang = l;
}

function setSiteChrome (visible) {
  const app = document.querySelector('site-app');
  if (app) app.classList.toggle('cms-mode', !visible);
}

async function mountComponent (tag, setupFn) {
  const outlet = getOutlet();
  if (!outlet) return;
  const el = document.createElement(tag);
  if (setupFn) setupFn(el);
  outlet.replaceChildren(el);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function initRoutes () {
  const router = new Router();

  // ── Universal page route ────────────────────────────────────────────────────
  router.add('#/:l/p/:slug', async (l, slug) => {
    setSiteChrome(true);
    setLang(l, slug);
    const module = await import('./components/PageRenderer.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountComponent(module.default.tag, (el) => el.setAttribute('data-slug', slug));
  });

  // ── Tabs block: #/ru/b/:blockId  (list view) ───────────────────────────────
  router.add('#/:l/b/:blockId', async (l, blockId) => {
    setSiteChrome(true);
    setLang(l, 'tabs');
    const module = await import('./blocks/BlockTabs.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountComponent(module.default.tag, (el) => {
      el.setAttribute('data-block-id', decodeURIComponent(blockId));
    });
  });

  // ── Tabs block deep-link: #/ru/b/:blockId/:itemId  (detail view) ───────────
  router.add('#/:l/b/:blockId/:itemId', async (l, blockId, itemId) => {
    setSiteChrome(true);
    setLang(l, 'tabs');
    const module = await import('./blocks/BlockTabs.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountComponent(module.default.tag, (el) => {
      el.setAttribute('data-block-id',     decodeURIComponent(blockId));
      el.setAttribute('data-initial-item', decodeURIComponent(itemId));
    });
  });

  // ── CMS ─────────────────────────────────────────────────────────────────────
  router.add('#/cms', async () => {
    setSiteChrome(false);
    const module = await import('./cms/CmsApp.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountComponent(module.default.tag);
  });

  // ── Ontology graph viewer ───────────────────────────────────────────────────
  router.add('#/:l/graph/:uri', async (l, uri) => {
    setSiteChrome(true);
    setLang(l, 'platform');
    const module = await import('./components/OntologyGraph.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountComponent(module.default.tag, (el) => el.setAttribute('data-root-uri', decodeURIComponent(uri)));
  });

  // ── Fallback: any unmatched #/lang/xxx → main page ──────────────────────────
  router.add('#/:l/:page', (l) => {
    router.go(`#/${l}/p/main`);
  });

  router.go(location.hash || `#/${lang.current}/p/main`);
}
