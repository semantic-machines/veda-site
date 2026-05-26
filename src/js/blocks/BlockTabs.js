import { Component, html, raw } from 'veda-client';
import { getText, getMarkdown, getFileUrl, getString, getOrder } from '../utils/blockData.js';
import { loadModels, loadModelsOrdered } from '../utils/loadModels.js';
import { buildRoute, nav, APP_PAGE } from '../utils/pageNav.js';
import lang from '../lang.js';

let _savedScroll = 0;

export default class BlockTabs extends Component(HTMLElement) {
  static tag = 'block-tabs';

  get _detailMode () {
    return !!this.getAttribute('data-apps-item');
  }

  _appsFromAttrs () {
    const aspect = this.getAttribute('data-apps-aspect') || undefined;
    const item   = this.getAttribute('data-apps-item') || undefined;
    return aspect || item ? { aspect, item } : undefined;
  }

  _findItem (itemId) {
    for (const tab of this.state.tabs ?? []) {
      const item = tab.items?.find((i) => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  _applyApps (apps) {
    let idx = 0;
    if (apps?.aspect) {
      const found = this.state.tabs.findIndex((t) => t.id === apps.aspect);
      if (found >= 0) idx = found;
    }
    this.state.activeIdx   = idx;
    this.state.activeItems = this.state.tabs[idx]?.items ?? [];

    if (this._detailMode && apps?.item) {
      this.state.detailItem = this.state.activeItems.find((i) => i.id === apps.item)
        ?? this._findItem(apps.item)
        ?? null;
    } else {
      this.state.detailItem = null;
    }
  }

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    this.state.heading   = getText(m, 'site:heading');
    this.state.bgVariant = getString(m, 'site:bgVariant') || 'default';
    this.state.cssClass  = getString(m, 'site:cssClass') || '';

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

    this._applyApps(this._appsFromAttrs());
    await this.update();
    if (this._detailMode) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** @param {{ aspect?: string, item?: string } | undefined} apps */
  async applyAppsRoute (apps) {
    if (!this.state.tabs?.length) return;
    this._applyApps(apps);
    await this.update();
    if (!this._detailMode && _savedScroll > 0) {
      const y = _savedScroll;
      _savedScroll = 0;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
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
    if (!btn || !lang.current || lang.page !== APP_PAGE) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx) || idx === this.state.activeIdx) return;
    const aspect = this.state.tabs[idx];
    if (!aspect) return;
    nav(buildRoute(lang.current, lang.page, { apps: { aspect: aspect.id } }));
  }

  openItem (e) {
    const card = e.target.closest('[data-item-id]');
    if (!card || !lang.current || lang.page !== APP_PAGE) return;
    _savedScroll = window.scrollY;
    const aspect = this.state.tabs[this.state.activeIdx];
    if (!aspect) return;
    nav(buildRoute(lang.current, lang.page, {
      apps: { aspect: aspect.id, item: card.dataset.itemId },
    }));
  }

  closeItem () {
    const aspect = this.state.tabs[this.state.activeIdx];
    if (!aspect || !lang.current) return;
    // Prefer returning via browser history (works for hash-navigation).
    if (history.length > 1) {
      history.back();
      return;
    }
    // Fallback for direct deep-link to detail.
    nav(buildRoute(lang.current, lang.page, { apps: { aspect: aspect.id } }));
  }

  render () {
    if (this._detailMode) {
      if (!this.state.detailItem) return html`<div class="loading">...</div>`;
      const item = this.state.detailItem;
      return html`
        <section class="page-section {state.cssClass}">
          <div class="container">
            <div class="app-detail__header">
              <veda-if condition="{state.detailItem?.iconUrl}">
                <img src="{state.detailItem?.iconUrl}" alt="" class="app-detail__icon">
              </veda-if>
              <div>
                <h1 class="page-heading">{state.detailItem?.label}</h1>
                <veda-if condition="{state.detailItem?.comment}">
                  <p class="lead text-muted">{state.detailItem?.comment}</p>
                </veda-if>
              </div>
            </div>
            <veda-if condition="{state.detailItem?.summaryHtml}">
              <div class="markdown app-detail__summary">${raw(item.summaryHtml)}</div>
            </veda-if>
            <veda-if condition="{state.detailItem?.descHtml}">
              <div class="markdown app-detail__desc">${raw(item.descHtml)}</div>
            </veda-if>
            <button class="btn btn-outline app-detail__back" onclick="{closeItem}">{backLabel}</button>
          </div>
        </section>`;
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
      </div>`;
  }
}
