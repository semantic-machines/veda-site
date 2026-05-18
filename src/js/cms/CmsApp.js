import { Component, Backend } from 'veda-client';
import { checkCmsAccess } from './cmsUtils.js';
import BlockEditor from './BlockEditor.js';
import PageManager from './PageManager.js';
import CatalogEditor from './CatalogEditor.js';
import MediaUploader from './MediaUploader.js';
import SiteSettings from './SiteSettings.js';

customElements.define(BlockEditor.tag, BlockEditor);
customElements.define(PageManager.tag, PageManager);
customElements.define(CatalogEditor.tag, CatalogEditor);
customElements.define(MediaUploader.tag, MediaUploader);
customElements.define(SiteSettings.tag, SiteSettings);

const SECTIONS = [
  { id: 'blocks',  label: 'Контент',    icon: '📝' },
  { id: 'pages',   label: 'Навигация',  icon: '🗂' },
  { id: 'catalog', label: 'Каталог',    icon: '📦' },
  { id: 'media',   label: 'Медиа',      icon: '🖼' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

export default class CmsApp extends Component(HTMLElement) {
  static tag = 'cms-app';

  constructor () {
    super();
    this.state.checking = true;
    this.state.allowed = false;
    this.state.section = 'blocks';
    this.state.login = '';
    this.state.password = '';
    this.state.loginError = null;
    this.state.loggingIn = false;
  }

  async added () {
    await this._checkAccess();
  }

  async _checkAccess () {
    this.state.checking = true;
    this.state.allowed = await checkCmsAccess();
    this.state.checking = false;
    await this.update();
  }

  handleLogin (e)    { this.state.login    = e.target.value; }
  handlePassword (e) { this.state.password = e.target.value; }

  async submitLogin (e) {
    e.preventDefault();
    this.state.loggingIn = true;
    this.state.loginError = null;
    await this.update();
    try {
      const encoded = new TextEncoder().encode(this.state.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      await Backend.authenticate(this.state.login, hashHex);
      this.state.login = '';
      this.state.password = '';
      await this._checkAccess();
    } catch {
      this.state.loginError = 'Неверный логин или пароль';
      this.state.loggingIn = false;
      await this.update();
    }
  }

  selectSection (e) {
    e.preventDefault();
    const el = e.target.closest('[data-section]');
    if (el) {
      this.state.section = el.dataset.section;
      this.update();
    }
  }

  render () {
    if (this.state.checking) {
      return '<div class="loading">Проверка доступа...</div>';
    }

    if (!this.state.allowed) {
      const errHtml = this.state.loginError
        ? `<div class="alert alert-error">${this.state.loginError}</div>`
        : '';
      return `
        <div class="cms-login">
          <div class="cms-login__card">
            <div class="cms-login__title">Вход в CMS</div>
            <div class="cms-login__sub">Управление контентом сайта</div>
            ${errHtml}
            <form onsubmit="{submitLogin}">
              <div class="form-group" style="margin-bottom:.75rem">
                <label class="form-label">Логин</label>
                <input class="form-input" type="text" autocomplete="username"
                  value="${this.state.login}" oninput="{handleLogin}">
              </div>
              <div class="form-group">
                <label class="form-label">Пароль</label>
                <input class="form-input" type="password" autocomplete="current-password"
                  value="${this.state.password}" oninput="{handlePassword}">
              </div>
              <div class="cms-login__actions">
                <button class="btn btn-primary" type="submit" ${this.state.loggingIn ? 'disabled' : ''}>
                  ${this.state.loggingIn ? 'Вход...' : 'Войти'}
                </button>
                <a class="btn btn-outline" href="#/ru/p/main">← На сайт</a>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    const section = this.state.section;
    const navItems = SECTIONS.map((s) => `
      <a class="cms-nav__item${section === s.id ? ' cms-nav__item--active' : ''}"
         href="#"
         data-section="${s.id}"
         onclick="{selectSection}">
        <span>${s.icon}</span> ${s.label}
      </a>
    `).join('');

    const content = {
      blocks:   '<cms-block-editor></cms-block-editor>',
      pages:    '<cms-page-manager></cms-page-manager>',
      catalog:  '<cms-catalog-editor></cms-catalog-editor>',
      media:    '<cms-media-uploader></cms-media-uploader>',
      settings: '<cms-site-settings></cms-site-settings>',
    }[section] ?? '';

    return `
      <div class="cms-app">
        <header class="cms-header">
          <h1>Управление сайтом</h1>
          <a class="cms-header__back" href="#/ru/p/main">← На сайт</a>
        </header>
        <nav class="cms-sidebar">${navItems}</nav>
        <main class="cms-content">${content}</main>
      </div>
    `;
  }
}
