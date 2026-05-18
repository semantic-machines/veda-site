import { Component, Model } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getFileUrl, getString, getOrder } from '../utils/blockData.js';
import lang from '../lang.js';

let _lastTabIdx  = 0;
let _savedScroll = 0;

export default class BlockTabs extends Component(HTMLElement) {
  static tag = 'block-tabs';

  constructor () {
    super();
    this.state.heading    = '';
    this.state.tabs       = [];
    this.state.activeIdx  = 0;
    this.state.activeItems = [];
    this.state.detailItem = null;
    this.state.bgVariant  = 'default';
    this.state.cssClass   = '';
    this.state.loaded     = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    const initialItemId = this.getAttribute('data-initial-item');

    const tabRefs = model['site:hasItem'] ?? [];
    const tabs = await Promise.all(
      tabRefs.map(async (ref) => {
        const tab = new Model(ref.id);
        await tab.load();
        const cardRefs = tab['site:hasItem'] ?? [];
        const items = await Promise.all(
          cardRefs.map(async (cRef) => {
            const card = new Model(cRef.id);
            await card.load();
            return {
              id:          card.id,
              label:       getText(card, 'rdfs:label'),
              comment:     getText(card, 'rdfs:comment'),
              iconUrl:     getFileUrl(card, 'v-s:hasIcon'),
              summaryHtml: getMarkdown(card, 'v-s:summary'),
              descHtml:    getMarkdown(card, 'v-s:description'),
              order:       getOrder(card),
            };
          })
        );
        items.sort((a, b) => a.order - b.order);
        return {
          id:         tab.id,
          label:      getText(tab, 'rdfs:label'),
          shortLabel: getText(tab, 'v-s:shortLabel') || getText(tab, 'rdfs:label'),
          order:      getOrder(tab),
          items,
        };
      })
    );
    tabs.sort((a, b) => a.order - b.order);

    this.state.heading   = getText(model, 'site:heading');
    this.state.bgVariant = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass  = getString(model, 'site:cssClass');
    this.state.tabs      = tabs;

    if (initialItemId) {
      for (const tab of tabs) {
        const found = tab.items.find((i) => i.id === initialItemId);
        if (found) {
          _lastTabIdx            = tabs.indexOf(tab);
          this.state.detailItem  = found;
          this.state.activeIdx   = _lastTabIdx;
          this.state.activeItems = tab.items;
          break;
        }
      }
    } else {
      this.state.activeIdx   = _lastTabIdx;
      this.state.activeItems = tabs[_lastTabIdx]?.items ?? tabs[0]?.items ?? [];
    }

    this.state.loaded = true;
  }

  selectTab (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx) || idx === this.state.activeIdx) return;
    _lastTabIdx            = idx;
    this.state.activeIdx   = idx;
    this.state.activeItems = this.state.tabs[idx]?.items ?? [];
    this.update();
  }

  openItem (e) {
    const card = e.target.closest('[data-item-id]');
    if (!card) return;
    _savedScroll = window.scrollY;
    const blockId = encodeURIComponent(this.getAttribute('data-block-id'));
    const itemId  = encodeURIComponent(card.dataset.itemId);
    window.location.hash = `#/${lang.current}/b/${blockId}/${itemId}`;
  }

  closeItem () {
    if (_savedScroll > 0) {
      const y = _savedScroll;
      _savedScroll = 0;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    }
    window.history.back();
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, tabs, activeIdx, activeItems, detailItem, bgVariant, cssClass } = this.state;

    const altBg = bgVariant === 'alt' ? ' page-section--alt' : '';
    const l     = lang.current;

    // ── Detail view ───────────────────────────────────────────────────────────
    if (detailItem) {
      const back = l === 'ru' ? '← Назад' : '← Back';
      return `
        <section class="page-section ${cssClass}">
          <div class="container">
            <div class="app-detail__header">
              ${detailItem.iconUrl ? `<img src="${detailItem.iconUrl}" alt="" class="app-detail__icon">` : ''}
              <div>
                <h1 class="page-heading">${detailItem.label}</h1>
                ${detailItem.comment ? `<p class="lead text-muted">${detailItem.comment}</p>` : ''}
              </div>
            </div>
            ${detailItem.summaryHtml ? `<div class="markdown app-detail__summary">${detailItem.summaryHtml}</div>` : ''}
            ${detailItem.descHtml    ? `<div class="markdown app-detail__desc">${detailItem.descHtml}</div>` : ''}
            <button class="btn btn-outline app-detail__back" onclick="{closeItem}">${back}</button>
          </div>
        </section>
      `;
    }

    // ── List view ─────────────────────────────────────────────────────────────
    const tabsHtml = tabs.map((tab, i) => `
      <button class="aspect-tab${i === activeIdx ? ' active' : ''}"
              data-idx="${i}" onclick="{selectTab}">${tab.shortLabel}</button>
    `).join('');

    const cardsHtml = activeItems.map((item) => `
      <div class="app-card" data-item-id="${item.id}" onclick="{openItem}">
        ${item.iconUrl ? `<img src="${item.iconUrl}" alt="" class="app-card__icon" loading="lazy">` : ''}
        <div class="app-card__title">${item.label}</div>
        ${item.comment ? `<div class="app-card__desc">${item.comment}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="${cssClass}">
        ${heading ? `<div class="container page-section"><h2 class="section-heading">${heading}</h2></div>` : ''}
        <div class="aspects-section${altBg}">
          <div class="container">
            <div class="aspects-tabs">${tabsHtml}</div>
            <h2 class="aspect-title">${tabs[activeIdx]?.label ?? ''}</h2>
            <div class="app-grid">${cardsHtml}</div>
          </div>
        </div>
      </div>
    `;
  }
}
