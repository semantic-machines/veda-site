import { Component, html } from 'veda-client';
import { getText, getString, getOrder } from '../utils/blockData.js';
import { parseMarkdown } from '../utils/parseMarkdown.js';
import { mountMarkdownHtml } from '../utils/mountMarkdownHtml.js';
import { fetchMarkdownText } from '../utils/fetchMarkdown.js';
import {
  buildRoute,
  nav,
  mdTabKey,
  scrollToSection,
} from '../utils/pageNav.js';
import lang from '../lang.js';
import { loadModelsOrdered } from '../utils/loadModels.js';

export default class BlockDocTabs extends Component(HTMLElement) {
  static tag = 'block-doc-tabs';

  #loadSeq = 0;

  _syncMarkdown () {
    const tab = this.state.tabs?.[this.state.activeIdx];
    mountMarkdownHtml(this, this._markdownHtml, tab?.tabKey);
  }

  _docFromAttrs () {
    const tab = this.getAttribute('data-doc-tab') || undefined;
    const section = this.getAttribute('data-doc-section') || undefined;
    return tab || section ? { tab, section } : undefined;
  }

  async added () {
    const m = this.state.model;
    if (!m) return;

    if (!m.isLoaded?.()) {
      try {
        await m.load();
      } catch (e) {
        console.warn('[BlockDocTabs] model load failed', e);
        this.state.error = true;
        this.state.loading = false;
        await this.update();
        return;
      }
    }

    const itemRefs = m['site:hasItem'] ?? [];
    const items = await loadModelsOrdered(itemRefs);
    items.sort((a, b) => getOrder(a) - getOrder(b));

    this.state.tabs = items.map((item, idx) => ({
      idx,
      id:      item.id,
      label:   getText(item, 'rdfs:label'),
      fileUrl: getString(item, 'site:fileUrl'),
      tabKey:  mdTabKey(getString(item, 'site:fileUrl')),
    }));

    const doc = this._docFromAttrs();
    const idx = this._tabIndex(doc?.tab);
    if (this.state.tabs.length > 0) {
      await this._loadTab(idx, doc?.section);
    } else {
      this.state.loading = false;
      this.state.error = true;
      await this.update();
    }
  }

  _tabIndex (tabKey) {
    if (!tabKey) return 0;
    const idx = this.state.tabs.findIndex((t) => t.tabKey === tabKey);
    return idx >= 0 ? idx : 0;
  }

  /** @param {{ tab?: string, section?: string } | undefined} doc */
  async applyDocRoute (doc) {
    if (!this.state.tabs?.length) return;
    const idx = this._tabIndex(doc?.tab);
    if (idx !== this.state.activeIdx) {
      await this._loadTab(idx, doc?.section);
    } else {
      scrollToSection(doc?.section);
    }
  }

  async _loadTab (idx, section) {
    const tab = this.state.tabs[idx];
    const seq = ++this.#loadSeq;

    if (!tab?.fileUrl) {
      this._markdownHtml = '';
      this.state.error = true;
      this.state.activeIdx = idx;
      this.state.loading = false;
      await this.update();
      this._syncMarkdown();
      return;
    }

    this.state.activeIdx = idx;
    this.dataset.activeDocTab = tab.tabKey;
    this.state.loading = true;
    this.state.error = false;
    await this.update();

    try {
      const md = await fetchMarkdownText(tab.fileUrl);
      if (seq !== this.#loadSeq) return;
      const base = tab.fileUrl.substring(0, tab.fileUrl.lastIndexOf('/') + 1);
      this._markdownHtml = parseMarkdown(md, { baseUrl: base });
      this.state.error = false;
    } catch (e) {
      if (seq !== this.#loadSeq) return;
      console.warn('[BlockDocTabs] Failed to load', tab.fileUrl, e);
      this._markdownHtml = '';
      this.state.error = true;
    }

    this.state.loading = false;
    await this.update();
    this._syncMarkdown();
    const anchor = section ?? (this.getAttribute('data-doc-section') || undefined);
    scrollToSection(anchor);
  }

  post () {
    this._syncMarkdown();
  }

  renderedCallback () {
    this._syncMarkdown();
  }

  selectTab (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx) || idx === this.state.activeIdx) return;
    const tab = this.state.tabs[idx];
    if (!tab || !lang.current) return;
    nav(buildRoute(lang.current, lang.page, { doc: { tab: tab.tabKey } }));
  }

  render () {
    const tabs = this.state.tabs ?? [];
    const loading = this.state.loading ?? true;

    if (!tabs.length && loading) {
      return html`<div class="loading">...</div>`;
    }

    return html`
      <section class="page-section">
        <div class="container">
          <nav class="doc-tabs-nav">
            <veda-loop items="{state.tabs}" as="tab" key="id">
              <button class="doc-tab !{ tab.idx === state.activeIdx ? ' doc-tab--active' : ''}"
                      data-idx="{tab.idx}" onclick="{selectTab}">
                {tab.label || tab.id}
              </button>
            </veda-loop>
          </nav>
          <div class="doc-tabs-body">
            <veda-if condition="{state.loading}">
              <div class="doc-tabs-loading loading">...</div>
            </veda-if>
            <veda-if condition="{!state.loading && state.error}">
              <p class="doc-tabs-error text-muted">Не удалось загрузить документ.</p>
            </veda-if>
            <div class="markdown doc-content !{ state.loading || state.error ? ' doc-content--hidden' : ''}"
                 data-md-slot=""></div>
          </div>
        </div>
      </section>`;
  }
}
