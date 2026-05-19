import { Component, Model } from 'veda-client';
import { escapeHtml, getBiLingual, saveModel } from './cmsUtils.js';

export default class PageManager extends Component(HTMLElement) {
  static tag = 'cms-page-manager';

  constructor () {
    super();
    this.state.items = [];
    this.state.loading = true;
    this.state.message = null;
  }

  async added () {
    try {
      const site = new Model('site:VedaSite');
      await site.load();

      const mainMenuRef = (site['site:hasNavMenu'] ?? []).find(async (ref) => {
        const m = new Model(ref.id);
        await m.load();
        return (m['site:navPosition']?.[0] ?? 'main') === 'main';
      });
      const mainMenu = mainMenuRef ? new Model(mainMenuRef.id) : null;
      if (mainMenu) await mainMenu.load();

      const menuItemRefs = mainMenu?.['site:hasMenuItem'] ?? [];
      const items = await Promise.all(
        menuItemRefs.map(async (ref) => {
          const m = new Model(ref.id);
          await m.load();
          const label = getBiLingual(m, 'rdfs:label');

          let slug = null;
          const pageRef = m['site:targetPage']?.[0];
          if (pageRef) {
            const page = new Model(pageRef.id);
            await page.load();
            slug = page['site:slug']?.[0] ?? null;
          }

          return {
            id:      m.id,
            labelRu: label.ru || slug,
            labelEn: label.en || slug,
            slug,
            enabled: !m['v-s:deleted']?.[0],
            model:   m,
          };
        })
      );
      this.state.items = items;
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.loading = false;
    }
  }

  async togglePage (e) {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    const id = el.dataset.id;
    const item = this.state.items.find((p) => p.id === id);
    if (!item) return;

    const newEnabled = !item.enabled;
    item.enabled = newEnabled;
    item.model['v-s:deleted'] = newEnabled ? null : true;

    try {
      await saveModel(item.model);
      this.state.message = {
        type: 'success',
        text: `${item.labelRu}: ${newEnabled ? 'в меню' : 'скрыта'}`,
      };
    } catch (err) {
      item.enabled = !newEnabled;
      item.model['v-s:deleted'] = item.enabled ? null : true;
      this.state.message = { type: 'error', text: err.message };
    }

    this.state.items = [...this.state.items];
  }

  render () {
    if (this.state.loading) return '<div class="loading">Загрузка...</div>';

    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const items = this.state.items.map((p) => `
      <div class="page-item" data-id="${escapeHtml(p.id)}">
        <span class="page-item__label">
          ${escapeHtml(p.labelRu)} / ${escapeHtml(p.labelEn)}
          <span class="text-muted" style="font-weight:400"> — /${escapeHtml(p.slug || '')}</span>
        </span>
        <label class="page-item__toggle">
          <label class="toggle">
            <input type="checkbox" ${p.enabled ? 'checked' : ''}
              data-id="${escapeHtml(p.id)}" onchange="{togglePage}">
            <span class="toggle__slider"></span>
          </label>
          ${p.enabled ? 'В меню' : 'Скрыта'}
        </label>
      </div>
    `).join('');

    return `
      <div>
        <h2>Навигация</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Видимость пунктов главного меню. Скрытая страница остаётся доступной по прямой ссылке.
        </p>
        ${msgHtml}
        <div class="page-list">${items}</div>
      </div>
    `;
  }
}
