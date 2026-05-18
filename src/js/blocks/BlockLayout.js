import { Component, Model } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getString, getOrder } from '../utils/blockData.js';
import { BLOCK_LOADERS as loaders } from '../components/PageRenderer.js';

export default class BlockLayout extends Component(HTMLElement) {
  static tag = 'block-layout';

  constructor () {
    super();
    this.state.columns   = 2;
    this.state.blocks    = [];  // [{ id, type }]
    this.state.bgVariant = 'default';
    this.state.cssClass  = '';
    this.state.loaded    = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    const childRefs = model['site:hasBlock'] ?? [];
    const children  = await Promise.all(
      childRefs.map(async (ref) => {
        const child = new Model(ref.id);
        await child.load();
        return child;
      })
    );
    children.sort((a, b) => getOrder(a) - getOrder(b));

    // Pre-register child block custom elements
    for (const child of children) {
      const type   = child['site:blockType']?.[0];
      const loader = type && loaders[type];
      if (!loader) continue;
      const mod = await loader();
      if (!customElements.get(mod.default.tag)) {
        customElements.define(mod.default.tag, mod.default);
      }
      blockCache.set(child.id, child);
    }

    this.state.columns   = model['site:columns']?.[0] ?? 2;
    this.state.bgVariant = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass  = getString(model, 'site:cssClass');
    this.state.blocks    = children.map((c) => ({
      id:   c.id,
      type: c['site:blockType']?.[0] ?? '',
    }));
    this.state.loaded = true;
  }

  render () {
    if (!this.state.loaded) return '';
    const { columns, blocks, bgVariant, cssClass } = this.state;

    const altBg    = bgVariant === 'alt' ? ' page-section--alt' : '';
    const colStyle = `grid-template-columns: repeat(${columns}, 1fr)`;

    const childrenHtml = blocks
      .filter((b) => b.type && loaders[b.type])
      .map((b) => `<block-${b.type} data-block-id="${b.id}"></block-${b.type}>`)
      .join('');

    return `
      <section class="page-section${altBg} block-layout ${cssClass}" data-bg="${bgVariant}">
        <div class="container">
          <div class="block-layout__grid" style="${colStyle}">
            ${childrenHtml}
          </div>
        </div>
      </section>
    `;
  }
}
