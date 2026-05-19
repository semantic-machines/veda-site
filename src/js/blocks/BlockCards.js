import { Component, Model } from 'veda-client';
import { getOrder } from '../utils/blockData.js';

export default class BlockCards extends Component(HTMLElement) {
  static tag = 'block-cards';

  // Pre-fetch and sort items so veda-loop renders them in the right order.
  // Items are stored as Model instances — Model.cache ensures no duplicate requests.
  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;
    const refs  = m['site:hasItem'] ?? [];
    const items = await Promise.all(refs.map((ref) => new Model(ref.id).load()));
    items.sort((a, b) => getOrder(a) - getOrder(b));
    this.state.sortedItems = items;
  }

  navigateTo (e) {
    const card = e.target.closest('[data-url]');
    const url  = card?.getAttribute('data-url');
    if (url) location.href = url;
  }

  render () {
    return `
      <section class="page-section
                       {state.model['site:bgVariant']?.[0] === 'alt' ? 'page-section--alt' : ''}
                       {state.model['site:cssClass']?.[0] || ''}"
               data-bg="{state.model['site:bgVariant']?.[0] || 'default'}">
        <div class="container">
          <veda-if condition="{state.model['site:heading']?.length}">
            <h2 class="section-heading" property="site:heading"></h2>
          </veda-if>
          <site-markdown :model="{state.model}" prop="site:summary" class="markdown section-summary"></site-markdown>
          <div class="app-grid">
            <veda-loop items="{state.sortedItems}" as="item" key="id">
              <div class="app-card {item['site:url']?.[0] ? 'app-card--link' : ''}"
                   data-url="{item['site:url']?.[0]}"
                   onclick="{navigateTo}"
                   about="{item.id}">
                <veda-if condition="{state.model['v-s:hasIcon']?.[0]?.id}">
                  <img src="/files/{state.model['v-s:hasIcon']?.[0]?.id}" alt=""
                       class="app-card__icon" loading="lazy">
                </veda-if>
                <div class="app-card__title" property="rdfs:label"></div>
                <div class="app-card__desc" property="rdfs:comment"></div>
              </div>
            </veda-loop>
          </div>
        </div>
      </section>
    `;
  }
}
