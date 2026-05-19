import { Component, Model, Backend } from 'veda-client';
import { getString } from '../utils/blockData.js';

export default class BlockQueryList extends Component(HTMLElement) {
  static tag = 'block-query-list';

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    const queryClass = m['site:queryClass']?.[0]?.id;
    const filter     = getString(m, 'site:queryFilter');
    const limit      = m['site:queryLimit']?.[0] ?? 10;
    const order      = getString(m, 'site:queryOrder') || 'v-s:created desc';

    if (!queryClass) return;

    try {
      const query = [
        `'rdf:type' == '${queryClass}'`,
        filter ? `&& ${filter}` : '',
      ].filter(Boolean).join(' ');

      const uris  = await Backend.query({ sql: query, limit, sort: order });
      const items = await Promise.all((uris ?? []).map((uri) => new Model(uri).load()));
      this.state.items = items;
    } catch (e) {
      this.state.error = e.message;
    }
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
          <veda-if condition="{state.error}">
            <p class="text-muted">{state.error}</p>
          </veda-if>
          <div class="app-grid">
            <veda-loop items="{state.items}" as="item" key="id">
              <div class="app-card {item['site:url']?.[0] ? 'app-card--link' : ''}"
                   data-url="{item['site:url']?.[0]}"
                   onclick="{navigateTo}"
                   about="{item.id}">
                <div class="app-card__title" property="rdfs:label"></div>
                <div class="app-card__desc" property="rdfs:comment"></div>
                <site-markdown :model="{state.model}" prop="site:summary" class="markdown"></site-markdown>
              </div>
            </veda-loop>
          </div>
        </div>
      </section>
    `;
  }
}
