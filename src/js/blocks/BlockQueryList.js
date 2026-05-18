import { Component, Model, Backend } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getString, getOrder } from '../utils/blockData.js';

export default class BlockQueryList extends Component(HTMLElement) {
  static tag = 'block-query-list';

  constructor () {
    super();
    this.state.heading     = '';
    this.state.summaryHtml = '';
    this.state.items       = [];
    this.state.bgVariant   = 'default';
    this.state.cssClass    = '';
    this.state.loaded      = false;
    this.state.error       = null;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    const heading   = getText(model, 'site:heading');
    const queryClass = model['site:queryClass']?.[0]?.id;
    const filter    = getString(model, 'site:queryFilter');
    const limit     = model['site:queryLimit']?.[0] ?? 10;
    const order     = getString(model, 'site:queryOrder') || 'v-s:created desc';

    this.state.heading     = heading;
    this.state.summaryHtml = getMarkdown(model, 'site:summary');
    this.state.bgVariant   = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass    = getString(model, 'site:cssClass');

    if (!queryClass) {
      this.state.loaded = true;
      return;
    }

    try {
      const query = [
        `'rdf:type' == '${queryClass}'`,
        filter ? `&& ${filter}` : '',
      ].filter(Boolean).join(' ');

      const results = await Backend.query({
        sql:   query,
        limit: limit,
        sort:  order,
      });

      const items = await Promise.all(
        (results ?? []).map(async (uri) => {
          const item = new Model(uri);
          await item.load();
          return {
            id:          item.id,
            label:       getText(item, 'rdfs:label'),
            comment:     getText(item, 'rdfs:comment'),
            summaryHtml: getMarkdown(item, 'site:summary') || getMarkdown(item, 'v-s:summary'),
            url:         getString(item, 'site:url'),
            order:       getOrder(item),
          };
        })
      );

      this.state.items = items;
    } catch (e) {
      this.state.error = e.message;
    } finally {
      this.state.loaded = true;
    }
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, summaryHtml, items, bgVariant, cssClass, error } = this.state;

    const altBg = bgVariant === 'alt' ? ' page-section--alt' : '';

    if (error) {
      return `<section class="page-section${altBg} ${cssClass}">
        <div class="container"><p class="text-muted">${error}</p></div>
      </section>`;
    }

    const itemsHtml = items.map((item) => `
      <div class="app-card${item.url ? ' app-card--link' : ''}"
           ${item.url ? `onclick="location.href='${item.url}'"` : ''}>
        <div class="app-card__title">${item.label}</div>
        ${item.comment     ? `<div class="app-card__desc">${item.comment}</div>` : ''}
        ${item.summaryHtml ? `<div class="markdown">${item.summaryHtml}</div>` : ''}
      </div>
    `).join('');

    return `
      <section class="page-section${altBg} ${cssClass}" data-bg="${bgVariant}">
        <div class="container">
          ${heading     ? `<h2 class="section-heading">${heading}</h2>` : ''}
          ${summaryHtml ? `<div class="markdown section-summary">${summaryHtml}</div>` : ''}
          ${items.length ? `<div class="app-grid">${itemsHtml}</div>` : ''}
        </div>
      </section>
    `;
  }
}
