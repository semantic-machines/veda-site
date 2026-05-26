import { Component, html, raw } from 'veda-client';
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
    this.state.tabs = tabs.map((tab, idx) => ({ ...tab, idx }));

    if (initialItemId) {
      for (const tab of this.state.tabs) {
        const found = tab.items.find((i) => i.id === initialItemId);
        if (found) {
          _lastTabIdx            = tab.idx;
          this.state.detailItem  = found;
          this.state.activeIdx   = _lastTabIdx;
          this.state.activeItems = tab.items;
          break;
        }
      }
    } else {
      this.state.activeIdx   = _lastTabIdx;
      this.state.activeItems = this.state.tabs[_lastTabIdx]?.items ?? this.state.tabs[0]?.items ?? [];
    }
  }

  get backLabel () {
    return lang.current === 'ru' ? '← Назад' : '← Back';
  }

  get sectionAltClass () {
    return (this.state.bgVariant || 'default') === 'alt' ? ' page-section--alt' : '';
  }

  get activeTabLabel () {
    const tabs = this.state.tabs ?? [];
    const idx  = this.state.activeIdx ?? 0;
    return tabs[idx]?.label ?? '';
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
    if (this.state.detailItem) {
      return html`
        <section class="page-section {state.cssClass}">
          <div class="container">
            <div class="app-detail__header">
              <veda-if condition="{state.detailItem.iconUrl}">
                <img src="{state.detailItem.iconUrl}" alt="" class="app-detail__icon">
              </veda-if>
              <div>
                <h1 class="page-heading">{state.detailItem.label}</h1>
                <veda-if condition="{state.detailItem.comment}">
                  <p class="lead text-muted">{state.detailItem.comment}</p>
                </veda-if>
              </div>
            </div>
            <veda-if condition="{state.detailItem.summaryHtml}">
              <div class="markdown app-detail__summary">${raw(this.state.detailItem.summaryHtml)}</div>
            </veda-if>
            <veda-if condition="{state.detailItem.descHtml}">
              <div class="markdown app-detail__desc">${raw(this.state.detailItem.descHtml)}</div>
            </veda-if>
            <button class="btn btn-outline app-detail__back" onclick="{closeItem}">{backLabel}</button>
          </div>
        </section>
      `;
    }

    return html`
      <div class="{state.cssClass}">
        <veda-if condition="{state.heading}">
          <div class="container page-section">
            <h2 class="section-heading">{state.heading}</h2>
          </div>
        </veda-if>
        <div class="aspects-section{sectionAltClass}">
          <div class="container">
            <div class="aspects-tabs">
              <veda-loop items="{state.tabs}" as="tab" key="id">
                <button class="aspect-tab !{ tab.idx === state.activeIdx ? ' active' : ''}"
                        data-idx="{tab.idx}" onclick="{selectTab}">{tab.shortLabel}</button>
              </veda-loop>
            </div>
            <h2 class="aspect-title">{activeTabLabel}</h2>
            <div class="app-grid">
              <veda-loop items="{state.activeItems}" as="item" key="id">
                <div class="app-card" data-item-id="{item.id}" onclick="{openItem}">
                  <veda-if condition="{item.iconUrl}">
                    <img src="{item.iconUrl}" alt="" class="app-card__icon" loading="lazy">
                  </veda-if>
                  <div class="app-card__title">{item.label}</div>
                  <veda-if condition="{item.comment}">
                    <div class="app-card__desc">{item.comment}</div>
                  </veda-if>
                </div>
              </veda-loop>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
