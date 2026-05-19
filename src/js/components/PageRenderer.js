import { Component, Model } from 'veda-client';
import { getOrder } from '../utils/blockData.js';

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

      const blockRefs = page['site:hasBlock'] ?? [];
      const models = await Promise.all(
        blockRefs.map(async (ref) => {
          const block = new Model(ref.id);
          await block.load();
          return block;
        })
      );

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

      this.state.blocks = models.map((m) => ({
        id:   m.id,
        type: m['site:blockType']?.[0] ?? '',
      }));
    } catch (e) {
      this.state.error = e.message;
    }
  }

  render () {
    if (this.state.error) {
      return `<div class="container page-section">
        <p class="text-muted">{state.error}</p>
      </div>`;
    }

    return this.state.blocks
      .filter((b) => b.type && BLOCK_LOADERS[b.type])
      .map((b) => `<block-${b.type} about="${b.id}"></block-${b.type}>`)
      .join('') || '';
  }
}
