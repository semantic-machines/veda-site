import { Component } from 'veda-client';
import { getOrder } from '../utils/blockData.js';
import { loadModelsOrdered } from '../utils/loadModels.js';
import { BLOCK_LOADERS as loaders } from '../components/PageRenderer.js';

export default class BlockLayout extends Component(HTMLElement) {
  static tag = 'block-layout';

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    const childRefs = m['site:hasBlock'] ?? [];
    const children  = await loadModelsOrdered(childRefs);
    children.sort((a, b) => getOrder(a) - getOrder(b));

    for (const child of children) {
      const type   = child['site:blockType']?.[0];
      const loader = type && loaders[type];
      if (!loader) continue;
      const mod = await loader();
      if (!customElements.get(mod.default.tag)) {
        customElements.define(mod.default.tag, mod.default);
      }
    }

    this.state.blocks = children.map((c) => ({
      id:   c.id,
      type: c['site:blockType']?.[0] ?? '',
    }));
  }

  render () {
    const blocks   = this.state.blocks ?? [];
    const columns  = this.state.model?.['site:columns']?.[0] ?? 2;
    const colStyle = `grid-template-columns: repeat(${columns}, 1fr)`;

    const childrenHtml = blocks
      .filter((b) => b.type && loaders[b.type])
      .map((b) => `<block-${b.type} about="${b.id}"></block-${b.type}>`)
      .join('');

    return `
      <section class="page-section block-layout
                       {state.model['site:bgVariant']?.[0] === 'alt' ? 'page-section--alt' : ''}
                       {state.model['site:cssClass']?.[0] || ''}"
               data-bg="{state.model['site:bgVariant']?.[0] || 'default'}">
        <div class="container">
          <div class="block-layout__grid" style="${colStyle}">
            ${childrenHtml}
          </div>
        </div>
      </section>
    `;
  }
}
