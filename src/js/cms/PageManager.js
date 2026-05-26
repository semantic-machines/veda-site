import { Component, Model, html } from 'veda-client';
import { getBiLingual, saveModel } from './cmsUtils.js';
import { loadModels, loadModelsOrdered } from '../utils/loadModels.js';

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

      const menus = await loadModelsOrdered(site['site:hasNavMenu'] ?? []);
      const mainMenu = menus.find((m) => (m['site:navPosition']?.[0] ?? 'main') === 'main');

      const menuItemRefs = mainMenu?.['site:hasMenuItem'] ?? [];
      const menuItems = await loadModelsOrdered(menuItemRefs);
      const pageRefs = menuItems
        .map((m) => m['site:targetPage']?.[0])
        .filter(Boolean);
      const pageMap = await loadModels(pageRefs);

      const items = menuItems.map((m) => {
        const label = getBiLingual(m, 'rdfs:label');
        const pageRef = m['site:targetPage']?.[0];
        const page = pageRef ? pageMap.get(pageRef.id) : null;
        const slug = page?.['site:slug']?.[0] ?? null;

        return {
          id:      m.id,
          labelRu: label.ru || slug,
          labelEn: label.en || slug,
          slug,
          enabled: !m['v-s:deleted']?.[0],
          model:   m,
        };
      });
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
    if (this.state.loading) return html`<div class="loading">Загрузка...</div>`;

    return html`
      <div>
        <h2>Навигация</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Видимость пунктов главного меню. Скрытая страница остаётся доступной по прямой ссылке.
        </p>
        <veda-if condition="{state.message}">
          <div class="alert alert-{state.message.type}">{state.message.text}</div>
        </veda-if>
        <div class="page-list">
          <veda-loop items="{state.items}" as="p" key="id">
            <div class="page-item" data-id="{p.id}">
              <span class="page-item__label">
                {p.labelRu} / {p.labelEn}
                <span class="text-muted" style="font-weight:400"> — /{p.slug}</span>
              </span>
              <label class="page-item__toggle">
                <label class="toggle">
                  <input type="checkbox" checked="{p.enabled}"
                    data-id="{p.id}" onchange="{togglePage}">
                  <span class="toggle__slider"></span>
                </label>
                !{ p.enabled ? 'В меню' : 'Скрыта' }
              </label>
            </div>
          </veda-loop>
        </div>
      </div>
    `;
  }
}
