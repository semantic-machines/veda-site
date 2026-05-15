import { Component, Model, Backend } from 'veda-client';
import { CMS_PAGES } from '../pages.js';

const PAGES = CMS_PAGES.map((p) => ({
  uri:     p.pageUri,
  labelRu: p.label?.ru ?? p.id,
  labelEn: p.label?.en ?? p.id,
}));

export default class PageManager extends Component(HTMLElement) {
  static tag = 'cms-page-manager';

  constructor () {
    super();
    this.state.pages = [];
    this.state.loading = true;
    this.state.message = null;
  }

  async added () {
    try {
      const models = await Promise.all(
        PAGES.map(async (p) => {
          const m = new Model(p.uri);
          await m.load();
          return { ...p, model: m, enabled: !m['v-s:deleted']?.[0] };
        })
      );
      this.state.pages = models;
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.loading = false;
    }
  }

  // onchange="{togglePage}" — reads uri from data-uri on the checkbox
  async togglePage (e) {
    const el = e.target.closest('[data-uri]');
    if (!el) return;
    const uri = el.dataset.uri;
    const page = this.state.pages.find((p) => p.uri === uri);
    if (!page) return;

    const newEnabled = !page.enabled;
    page.enabled = newEnabled;
    page.model['v-s:deleted'] = newEnabled ? [] : [{ type: 'Boolean', value: true }];

    try {
      await Backend.put_individual(page.model);
      this.state.message = {
        type: 'success',
        text: `${page.labelRu}: ${newEnabled ? 'включена' : 'скрыта'}`,
      };
    } catch (e) {
      page.enabled = !newEnabled;
      this.state.message = { type: 'error', text: e.message };
    }

    this.state.pages = [...this.state.pages];
  }

  render () {
    if (this.state.loading) return `<div class="loading">Загрузка...</div>`;

    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${this.state.message.text}</div>`
      : '';

    const items = this.state.pages.map((p) => `
      <div class="page-item" data-uri="${p.uri}">
        <span class="page-item__label">${p.labelRu} / ${p.labelEn}</span>
        <label class="page-item__toggle">
          <label class="toggle">
            <input type="checkbox" ${p.enabled ? 'checked' : ''}
              data-uri="${p.uri}" onchange="{togglePage}">
            <span class="toggle__slider"></span>
          </label>
          ${p.enabled ? 'Видна' : 'Скрыта'}
        </label>
      </div>
    `).join('');

    return `
      <div>
        <h2>Страницы навигации</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Управление видимостью страниц в меню.
        </p>
        ${msgHtml}
        <div class="page-list">${items}</div>
      </div>
    `;
  }
}
