import { Component, html, raw } from 'veda-client';
import { getOrder } from '../utils/blockData.js';
import { loadModelsOrdered } from '../utils/loadModels.js';
import { scrollToSection } from '../utils/pageNav.js';

const BLOCK_LOADERS = {
  'hero':          () => import('../blocks/BlockHero.js'),
  'text':          () => import('../blocks/BlockText.js'),
  'cards':         () => import('../blocks/BlockCards.js'),
  'tabs':          () => import('../blocks/BlockTabs.js'),
  'layout':        () => import('../blocks/BlockLayout.js'),
  'cta':           () => import('../blocks/BlockCta.js'),
  'query-list':    () => import('../blocks/BlockQueryList.js'),
  'markdown-file': () => import('../blocks/BlockMarkdownFile.js'),
  'doc-tabs':      () => import('../blocks/BlockDocTabs.js'),
};

export { BLOCK_LOADERS };

export default class PageRenderer extends Component(HTMLElement) {
  static tag = 'page-renderer';

  constructor () {
    super();
    this.state.blocks = [];
    this.state.error  = null;
  }

  async added () {
    try {
      const page = this.state.model;
      if (!page) throw new Error('No page model');
      if (!page.isLoaded?.()) await page.load();

      const models = await loadModelsOrdered(page['site:hasBlock'] ?? []);
      models.sort((a, b) => getOrder(a) - getOrder(b));

      // Pre-register custom elements and warm Model.cache with loaded models.
      // Block components receive already-loaded instances via Model.cache when
      // populate() calls new Model(uri) — no duplicate network requests.
      for (const model of models) {
        const type   = model['site:blockType']?.[0];
        const loader = type && BLOCK_LOADERS[type];
        if (!loader) continue;
        const mod = await loader();
        if (!customElements.get(mod.default.tag)) {
          customElements.define(mod.default.tag, mod.default);
        }
      }

      this.state.blocks = models
        .map((m) => ({
          id:   m.id,
          type: m['site:blockType']?.[0] ?? '',
        }))
        .filter((b) => b.type && BLOCK_LOADERS[b.type]);
    } catch (e) {
      this.state.error = e.message;
    }
  }

  /**
   * @param {import('../utils/pageNav.js').SiteRoute} route
   */
  forwardRoute (route) {
    this.setAttribute('data-doc-tab', route.doc?.tab ?? '');
    this.setAttribute('data-doc-section', route.doc?.section ?? '');
    this.setAttribute('data-apps-aspect', route.apps?.aspect ?? '');

    const docTabs = this.querySelector('block-doc-tabs');
    if (docTabs) void docTabs.applyDocRoute(route.doc);

    const tabs = this.querySelector('block-tabs');
    if (tabs) void tabs.applyAppsRoute(route.apps);

    if (route.doc?.section) scrollToSection(route.doc.section);
  }

  render () {
    if (this.state.error) {
      return html`
        <div class="container page-section">
          <p class="text-muted">{state.error}</p>
        </div>
      `;
    }

    const docTab = this.getAttribute('data-doc-tab') || '';
    const docSec = this.getAttribute('data-doc-section') || '';
    const appsAsp = this.getAttribute('data-apps-aspect') || '';

    const blocksHtml = this.state.blocks
      .map((b) => {
        if (b.type === 'doc-tabs') {
          return `<block-doc-tabs about="${b.id}" data-doc-tab="${docTab}" data-doc-section="${docSec}"></block-doc-tabs>`;
        }
        if (b.type === 'tabs') {
          return `<block-tabs about="${b.id}" data-apps-aspect="${appsAsp}"></block-tabs>`;
        }
        return `<block-${b.type} about="${b.id}"></block-${b.type}>`;
      })
      .join('');

    return html`${raw(blocksHtml)}`;
  }
}
