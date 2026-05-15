import { Router } from 'veda-client';
import lang from './lang.js';

const pages = {
  main:          () => import('./components/MainPage.js'),
  about:         () => import('./components/AboutPage.js'),
  platform:      () => import('./components/PlatformPage.js'),
  applications:  () => import('./components/ApplicationsPage.js'),
  services:      () => import('./components/ServicesPage.js'),
  documentation: () => import('./components/DocumentationPage.js'),
  price:         () => import('./components/PricePage.js'),
  contacts:      () => import('./components/ContactsPage.js'),
  download:      () => import('./components/DownloadPage.js'),
  privacy:       () => import('./components/PrivacyPage.js'),
};

// Query outlet fresh on each navigation to handle re-renders
function getOutlet () {
  return document.querySelector('site-app main')
    ?? document.querySelector('#outlet');
}

export function initRoutes () {
  const router = new Router();

  router.add('#/:l/:page', async (l, page) => {
    lang.current = l;
    lang.page = page;
    document.documentElement.lang = l;

    const loader = pages[page];
    if (!loader) {
      router.go(`#/${l}/main`);
      return;
    }
    const module = await loader();
    const tag = module.default.tag;
    if (!customElements.get(tag)) {
      customElements.define(tag, module.default);
    }
    const el = document.createElement(tag);
    const outlet = getOutlet();
    if (outlet) outlet.replaceChildren(el);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  router.add('#/:l/graph/:uri', async (l, uri) => {
    lang.current = l;
    lang.page = 'platform';
    document.documentElement.lang = l;
    const module = await import('./components/OntologyGraph.js');
    const tag = module.default.tag;
    if (!customElements.get(tag)) customElements.define(tag, module.default);
    const el = document.createElement(tag);
    el.setAttribute('data-root-uri', decodeURIComponent(uri));
    const outlet = getOutlet();
    if (outlet) outlet.replaceChildren(el);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  router.add('#/:l/applications/:appId', async (l, appId) => {
    lang.current = l;
    lang.page = 'applications';
    document.documentElement.lang = l;
    const module = await import('./components/ApplicationsPage.js');
    const tag = module.default.tag;
    if (!customElements.get(tag)) customElements.define(tag, module.default);
    const el = document.createElement(tag);
    el.setAttribute('data-initial-app', decodeURIComponent(appId));
    const outlet = getOutlet();
    if (outlet) outlet.replaceChildren(el);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  router.add('#/cms', async () => {
    const module = await import('./cms/CmsApp.js');
    const tag = module.default.tag;
    if (!customElements.get(tag)) {
      customElements.define(tag, module.default);
    }
    const el = document.createElement(tag);
    const outlet = getOutlet();
    if (outlet) outlet.replaceChildren(el);
  });

  router.go(location.hash || `#/${lang.current}/main`);
}
