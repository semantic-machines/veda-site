import { Component, Model } from 'veda-client';
import { SITE_URI } from '../site-config.js';
import { escapeHtml, getStringProp, setStringProp, saveModel } from './cmsUtils.js';

const TOKEN_FIELDS = [
  ['site:colorPrimary',       'Основной цвет'],
  ['site:colorPrimaryHover',  'Основной (hover)'],
  ['site:colorPrimaryLight',  'Основной (светлый)'],
  ['site:colorText',          'Цвет текста'],
  ['site:colorTextMuted',     'Приглушённый текст'],
  ['site:colorBg',            'Фон'],
  ['site:colorBgAlt',         'Альт. фон'],
  ['site:fontSans',           'Шрифт (CSS)'],
];

export default class SiteSettings extends Component(HTMLElement) {
  static tag = 'cms-site-settings';

  constructor () {
    super();
    this.state.model = null;
    this.state.tokens = {};
    this.state.customCss = '';
    this.state.saving = false;
    this.state.loading = true;
    this.state.message = null;
  }

  async added () {
    try {
      const model = new Model(SITE_URI);
      await model.load();
      this.state.model = model;
      const tokens = {};
      for (const [prop] of TOKEN_FIELDS) {
        tokens[prop] = getStringProp(model, prop);
      }
      this.state.tokens = tokens;
      this.state.customCss = getStringProp(model, 'site:customCss');
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.loading = false;
    }
  }

  handleToken (e) {
    const prop = e.target.dataset.prop;
    if (prop) this.state.tokens[prop] = e.target.value;
  }

  handleCss (e) {
    this.state.customCss = e.target.value;
  }

  async save () {
    if (!this.state.model) return;

    this.state.saving = true;
    this.state.message = null;
    await this.update();

    try {
      const model = this.state.model;
      for (const [prop] of TOKEN_FIELDS) {
        setStringProp(model, prop, this.state.tokens[prop]);
      }
      setStringProp(model, 'site:customCss', this.state.customCss);
      await saveModel(model);

      const el = document.getElementById('site-tokens');
      if (el) el.remove();
      const customEl = document.getElementById('site-custom-css');
      if (customEl) customEl.remove();

      this.state.message = { type: 'success', text: 'Сохранено. Обновите страницу сайта для применения стилей.' };
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.saving = false;
      await this.update();
    }
  }

  render () {
    if (this.state.loading) return '<div class="loading">Загрузка...</div>';

    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const tokenFields = TOKEN_FIELDS.map(([prop, label]) => `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input class="form-input" type="text"
          data-prop="${prop}" value="${escapeHtml(this.state.tokens[prop])}"
          oninput="{handleToken}">
      </div>
    `).join('');

    return `
      <div>
        <h2>Настройки сайта</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Дизайн-токены и пользовательский CSS для <code>${SITE_URI}</code>.
        </p>
        ${msgHtml}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
          ${tokenFields}
        </div>
        <div class="form-group">
          <label class="form-label">Пользовательский CSS</label>
          <textarea class="form-textarea" rows="12" oninput="{handleCss}"
            style="font-family:var(--font-mono,monospace)">${escapeHtml(this.state.customCss)}</textarea>
        </div>
        <button class="btn btn-primary" onclick="{save}" ${this.state.saving ? 'disabled' : ''}>
          ${this.state.saving ? 'Сохраняю...' : '💾 Сохранить'}
        </button>
      </div>
    `;
  }
}
