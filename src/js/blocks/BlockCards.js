import { Component, Model } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getFileUrl, getString, getOrder } from '../utils/blockData.js';

export default class BlockCards extends Component(HTMLElement) {
  static tag = 'block-cards';

  constructor () {
    super();
    this.state.heading     = '';
    this.state.summaryHtml = '';
    this.state.items       = [];
    this.state.bgVariant   = 'default';
    this.state.cssClass    = '';
    this.state.loaded      = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    const itemRefs = model['site:hasItem'] ?? [];
    const items = await Promise.all(
      itemRefs.map(async (ref) => {
        const item = new Model(ref.id);
        await item.load();
        return {
          id:      item.id,
          label:   getText(item, 'rdfs:label'),
          comment: getText(item, 'rdfs:comment'),
          iconUrl: getFileUrl(item, 'v-s:hasIcon'),
          url:     getString(item, 'site:url'),
          order:   getOrder(item),
        };
      })
    );
    items.sort((a, b) => a.order - b.order);

    this.state.heading     = getText(model, 'site:heading');
    this.state.summaryHtml = getMarkdown(model, 'site:summary');
    this.state.items       = items;
    this.state.bgVariant   = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass    = getString(model, 'site:cssClass');
    this.state.loaded      = true;
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, summaryHtml, items, bgVariant, cssClass } = this.state;

    const altBg = bgVariant === 'alt' ? ' page-section--alt' : '';

    const cardsHtml = items.map((item) => `
      <div class="app-card${item.url ? ' app-card--link' : ''}"
           ${item.url ? `onclick="location.href='${item.url}'"` : ''}>
        ${item.iconUrl ? `<img src="${item.iconUrl}" alt="" class="app-card__icon" loading="lazy">` : ''}
        <div class="app-card__title">${item.label}</div>
        ${item.comment ? `<div class="app-card__desc">${item.comment}</div>` : ''}
      </div>
    `).join('');

    return `
      <section class="page-section${altBg} ${cssClass}" data-bg="${bgVariant}">
        <div class="container">
          ${heading     ? `<h2 class="section-heading">${heading}</h2>` : ''}
          ${summaryHtml ? `<div class="markdown section-summary">${summaryHtml}</div>` : ''}
          <div class="app-grid">${cardsHtml}</div>
        </div>
      </section>
    `;
  }
}
