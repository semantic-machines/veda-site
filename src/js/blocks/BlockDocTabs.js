import { Component } from 'veda-client';
import { marked } from 'marked';
import { getText, getString, getOrder } from '../utils/blockData.js';
import { loadModelsOrdered } from '../utils/loadModels.js';

export default class BlockDocTabs extends Component(HTMLElement) {
  static tag = 'block-doc-tabs';

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    const itemRefs = m['site:hasItem'] ?? [];
    const items = await loadModelsOrdered(itemRefs);
    items.sort((a, b) => getOrder(a) - getOrder(b));

    this.state.tabs      = items.map((item) => ({
      id:      item.id,
      label:   getText(item, 'rdfs:label'),
      fileUrl: getString(item, 'site:fileUrl'),
    }));
    this.state.activeIdx = 0;
    this.state.loading   = false;
    this.update();

    if (this.state.tabs.length > 0) {
      await this._loadTab(0);
    }
  }

  async _loadTab (idx) {
    const tab = this.state.tabs[idx];
    if (!tab?.fileUrl) {
      this.state.html      = '';
      this.state.error     = true;
      this.state.activeIdx = idx;
      this.update();
      return;
    }

    this.state.activeIdx = idx;
    this.state.loading   = true;
    this.update();

    try {
      const res = await fetch(tab.fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let md = await res.text();
      const base = tab.fileUrl.substring(0, tab.fileUrl.lastIndexOf('/') + 1);
      md = md.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, `![$1](${base}$2)`);
      this.state.html  = marked.parse(md);
      this.state.error = false;
    } catch (e) {
      console.warn('[BlockDocTabs] Failed to load', tab.fileUrl, e);
      this.state.html  = '';
      this.state.error = true;
    }

    this.state.loading = false;
    this.update();
  }

  post () {
    const slot = this.querySelector('[data-md-slot]');
    if (slot && this.state.html) slot.innerHTML = this.state.html;
  }

  selectTab (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx) || idx === this.state.activeIdx) return;
    this._loadTab(idx);
  }

  render () {
    const tabs      = this.state.tabs ?? [];
    const activeIdx = this.state.activeIdx ?? 0;
    const loading   = this.state.loading ?? true;

    if (!tabs.length && loading) return '<div class="loading">...</div>';

    const tabsHtml = tabs.map((t, i) => `
      <button class="doc-tab${i === activeIdx ? ' doc-tab--active' : ''}"
              data-idx="${i}" onclick="{selectTab}">${t.label || t.id}</button>`
    ).join('');

    let bodyHtml;
    if (loading) {
      bodyHtml = '<div class="loading">...</div>';
    } else if (this.state.error) {
      bodyHtml = '<p class="text-muted">Не удалось загрузить документ.</p>';
    } else {
      bodyHtml = '<div class="markdown doc-content" data-md-slot></div>';
    }

    return `
      <section class="page-section">
        <div class="container">
          <nav class="doc-tabs-nav">${tabsHtml}</nav>
          <div class="doc-tabs-body">${bodyHtml}</div>
        </div>
      </section>`;
  }
}
