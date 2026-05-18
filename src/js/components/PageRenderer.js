import { Component, Model } from 'veda-client';
import { getSiteConfig, getPageUri } from '../site-config.js';
import { blockCache } from '../utils/blockCache.js';
import { getOrder } from '../utils/blockData.js';

// Maps blockType → lazy module loader.
// Add new block types here without touching anything else.
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
    this.state.loading = true;
    this.state.error   = null;
    // Each entry: { id, type } — enough to build the tag name in render().
    // Full model lives in blockCache keyed by id.
    this.state.blocks = [];
  }

  async added () {
    try {
      // Ensure site tokens are injected before first paint.
      await getSiteConfig();

      const slug    = this.getAttribute('data-slug');
      const pageUri = getPageUri(slug);
      if (!pageUri) throw new Error(`Page not found: "${slug}"`);

      const page = new Model(pageUri);
      await page.load();

      const blockRefs = page['site:hasBlock'] ?? [];
      const models = await Promise.all(
        blockRefs.map(async (ref) => {
          const block = new Model(ref.id);
          await block.load();
          return block;
        })
      );

      models.sort((a, b) => getOrder(a) - getOrder(b));

      // Pre-register each block's custom element before render() is called.
      for (const model of models) {
        const type = model['site:blockType']?.[0];
        const loader = type && BLOCK_LOADERS[type];
        if (!loader) continue;
        const mod = await loader();
        if (!customElements.get(mod.default.tag)) {
          customElements.define(mod.default.tag, mod.default);
        }
        // Cache the loaded model so block components don't re-fetch.
        blockCache.set(model.id, model);
      }

      this.state.blocks = models.map((m) => ({
        id:   m.id,
        type: m['site:blockType']?.[0] ?? '',
      }));
    } catch (e) {
      this.state.error = e.message;
    } finally {
      this.state.loading = false;
    }
  }

  render () {
    if (this.state.loading) return `<div class="loading">...</div>`;
    if (this.state.error) {
      return `<div class="container page-section">
        <p class="text-muted">${this.state.error}</p>
      </div>`;
    }

    return this.state.blocks
      .filter((b) => b.type && BLOCK_LOADERS[b.type])
      .map((b) => `<block-${b.type} data-block-id="${b.id}"></block-${b.type}>`)
      .join('') || '';
  }
}
