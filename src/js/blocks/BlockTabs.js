import { Component } from 'veda-client';
import { getText, getMarkdown, getFileUrl, getString, getOrder } from '../utils/blockData.js';
import { loadModels, loadModelsOrdered } from '../utils/loadModels.js';
import lang from '../lang.js';

let _lastTabIdx  = 0;
let _savedScroll = 0;

export default class BlockTabs extends Component(HTMLElement) {
  static tag = 'block-tabs';

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    this.state.heading   = getText(m, 'site:heading');
    this.state.bgVariant = getString(m, 'site:bgVariant') || 'default';
    this.state.cssClass  = getString(m, 'site:cssClass') || '';

    const initialItemId = this.getAttribute('data-initial-item');

    const tabRefs = m['site:hasItem'] ?? [];
    const tabModels = await loadModelsOrdered(tabRefs);
    const cardRefs = tabModels.flatMap((tab) => tab['site:hasItem'] ?? []);
    const cardMap = await loadModels(cardRefs);

    const tabs = tabModels.map((tab) => {
      const items = (tab['site:hasItem'] ?? [])
        .map((cRef) => cardMap.get(cRef.id))
        .filter(Boolean)
        .map((card) => ({
          id:          card.id,
          label:       getText(card, 'rdfs:label'),
          comment:     getText(card, 'rdfs:comment'),
          iconUrl:     getFileUrl(card, 'v-s:hasIcon'),
          summaryHtml: getMarkdown(card, 'v-s:summary'),
          descHtml:    getMarkdown(card, 'v-s:description'),
          order:       getOrder(card),
        }));
      items.sort((a, b) => a.order - b.order);
      return {
        id:         tab.id,
        label:      getText(tab, 'rdfs:label'),
        shortLabel: getText(tab, 'v-s:shortLabel') || getText(tab, 'rdfs:label'),
        order:      getOrder(tab),
        items,
      };
    });
    tabs.sort((a, b) => a.order - b.order);

    this.state.tabs = tabs;

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
    const blockId = encodeURIComponent(this.getAttribute('about'));
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
    const tabs        = this.state.tabs ?? [];
    const activeIdx   = this.state.activeIdx ?? 0;
    const activeItems = this.state.activeItems ?? [];
    const detailItem  = this.state.detailItem;
    const bg          = this.state.bgVariant || 'default';
    const altBg       = bg === 'alt' ? ' page-section--alt' : '';
    const l           = lang.current;

    if (detailItem) {
      const back = l === 'ru' ? '← Назад' : '← Back';
      return `
        <section class="page-section {state.cssClass}">
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
      <div class="{state.cssClass}">
        ${this.state.heading ? '<div class="container page-section"><h2 class="section-heading">{state.heading}</h2></div>' : ''}
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
