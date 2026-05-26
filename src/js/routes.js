import { Router } from 'veda-client';
import lang from './lang.js';
import { swapOutlet } from './utils/swapOutlet.js';
import { ensureCmsCss } from './utils/cmsCss.js';
import { markAppReady } from './utils/appSkeleton.js';
import { initTocLinks, initPageNav, parseRoute } from './utils/pageNav.js';

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

async function mountPublicView (tag, setupFn) {
  const outlet = getOutlet();
  if (!outlet) return null;
  let view = null;
  await swapOutlet(outlet, () => {
    view = document.createElement(tag);
    if (setupFn) setupFn(view);
    return view;
  });
  return view;
}

/** @type {{ page: string, lang: string, view: import('./components/SiteView.js').default } | null} */
let mounted = null;

let routesReady = false;

export function initRoutes (homeUri) {
  if (routesReady) return;
  routesReady = true;

  const router = new Router();
  router.clear();
  initPageNav((hash) => router.go(hash));
  initTocLinks();

  async function syncPage () {
    const route = parseRoute();
    if (!route) return;

    setSiteChrome(true);
    setLang(route.l, route.page);

    const needMount = !mounted
      || mounted.page !== route.page
      || mounted.lang !== route.l;

    if (needMount) {
      mounted = null;
      const mod = await import('./components/SiteView.js');
      if (!customElements.get(mod.default.tag)) {
        customElements.define(mod.default.tag, mod.default);
      }
      const view = await mountPublicView(mod.default.tag);
      if (view) {
        mounted = { page: route.page, lang: route.l, view };
        await view.rendered;
      }
      return;
    }

    mounted.view.refresh();
  }

  const pageRoute = () => { void syncPage(); };

  router.add('#/:l/p/:pageUri/doc/:tab/:section', pageRoute);
  router.add('#/:l/p/:pageUri/doc/:tab', pageRoute);
  router.add('#/:l/p/:pageUri/apps/:aspect/:item', pageRoute);
  router.add('#/:l/p/:pageUri/apps/:aspect', pageRoute);
  router.add('#/:l/p/:pageUri', pageRoute);

  router.add('#/cms', async () => {
    mounted = null;
    setSiteChrome(false);
    ensureCmsCss();
    const mod = await import('./cms/CmsApp.js');
    if (!customElements.get(mod.default.tag)) {
      customElements.define(mod.default.tag, mod.default);
    }
    await mountCmsView(mod.default.tag);
  });

  router.add('#/:l/graph/:uri', async (l, uri) => {
    mounted = null;
    setSiteChrome(true);
    setLang(l, 'platform');
    const mod = await import('./components/OntologyGraph.js');
    if (!customElements.get(mod.default.tag)) {
      customElements.define(mod.default.tag, mod.default);
    }
    await mountPublicView(mod.default.tag, (view) => {
      view.setAttribute('data-root-uri', decodeURIComponent(uri));
    });
  });

  const initialHash = location.hash
    || (homeUri ? `#/${lang.current}/p/${homeUri}` : '');
  if (initialHash) router.go(initialHash);
}
