import { Router } from 'veda-client';
import lang from './lang.js';
import { swapOutlet } from './utils/swapOutlet.js';
import { ensureCmsCss } from './utils/cmsCss.js';
import { markAppReady } from './utils/appSkeleton.js';

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

/** CMS: immediate replace, no transition spinner. */
async function mountCmsView (tag, setupFn) {
  const outlet = getOutlet();
  if (!outlet) return;
  const view = document.createElement(tag);
  if (setupFn) setupFn(view);
  outlet.replaceChildren(view);
  await view.rendered;
  markAppReady();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** Public routes: pre-render off-screen, swap when rendered (spinner over current view). */
async function mountPublicView (tag, setupFn) {
  const outlet = getOutlet();
  if (!outlet) return;

  await swapOutlet(outlet, () => {
    const view = document.createElement(tag);
    if (setupFn) setupFn(view);
    return view;
  });
}

export function initRoutes (homeUri) {
  const router = new Router();

  // ── Universal page route ────────────────────────────────────────────────────
  router.add('#/:l/p/:pageUri', async (l, pageUri) => {
    setSiteChrome(true);
    setLang(l, pageUri);
    const module = await import('./components/PageRenderer.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountPublicView(module.default.tag, (view) => {
      view.setAttribute('about', decodeURIComponent(pageUri));
    });
  });

  // ── Tabs block: #/ru/b/:blockId  (list view) ───────────────────────────────
  router.add('#/:l/b/:blockId', async (l, blockId) => {
    setSiteChrome(true);
    setLang(l, 'tabs');
    const module = await import('./blocks/BlockTabs.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountPublicView(module.default.tag, (view) => {
      view.setAttribute('about', decodeURIComponent(blockId));
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
    await mountPublicView(module.default.tag, (view) => {
      view.setAttribute('about',            decodeURIComponent(blockId));
      view.setAttribute('data-initial-item', decodeURIComponent(itemId));
    });
  });

  // ── CMS ─────────────────────────────────────────────────────────────────────
  router.add('#/cms', async () => {
    setSiteChrome(false);
    ensureCmsCss();
    const module = await import('./cms/CmsApp.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountCmsView(module.default.tag);
  });

  // ── Ontology graph viewer ───────────────────────────────────────────────────
  router.add('#/:l/graph/:uri', async (l, uri) => {
    setSiteChrome(true);
    setLang(l, 'platform');
    const module = await import('./components/OntologyGraph.js');
    if (!customElements.get(module.default.tag)) {
      customElements.define(module.default.tag, module.default);
    }
    await mountPublicView(module.default.tag, (view) => {
      view.setAttribute('data-root-uri', decodeURIComponent(uri));
    });
  });

  // ── Fallback: any unmatched #/lang/xxx → home page ──────────────────────────
  if (homeUri) {
    router.add('#/:l/:page', (l) => { router.go(`#/${l}/p/${homeUri}`); });
  }

  const initialHash = location.hash
    || (homeUri ? `#/${lang.current}/p/${homeUri}` : '');
  if (initialHash) router.go(initialHash);
}
