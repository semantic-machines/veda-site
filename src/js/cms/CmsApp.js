import { Component, Backend } from 'veda-client';
import ArticleEditor from './ArticleEditor.js';
import PageManager from './PageManager.js';
import MediaUploader from './MediaUploader.js';

customElements.define(ArticleEditor.tag, ArticleEditor);
customElements.define(PageManager.tag, PageManager);
customElements.define(MediaUploader.tag, MediaUploader);

const SECTIONS = [
  { id: 'articles', label: 'Статьи',     icon: '📝' },
  { id: 'pages',    label: 'Страницы',   icon: '🗂' },
  { id: 'media',    label: 'Медиафайлы', icon: '🖼' },
];

export default class CmsApp extends Component(HTMLElement) {
  static tag = 'cms-app';

  constructor () {
    super();
    this.state.checking = true;
    this.state.allowed = false;
    this.state.section = 'articles';
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
    try {
      const rights = await Backend.get_rights('site:Article');
      this.state.allowed = !!rights?.['v-s:canCreate']?.[0]?.data || !!rights?.['v-s:canUpdate']?.[0]?.data;
    } catch {
      this.state.allowed = false;
    } finally {
      this.state.checking = false;
    }
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

  // onclick="{selectSection}" — reads section from data-section attribute
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
      return `<div class="loading">Проверка доступа...</div>`;
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
                <a class="btn btn-outline" href="#/ru/main">← На сайт</a>
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

    const content = section === 'articles' ? '<cms-article-editor></cms-article-editor>'
      : section === 'pages'    ? '<cms-page-manager></cms-page-manager>'
      : '<cms-media-uploader></cms-media-uploader>';

    return `
      <div class="cms-app">
        <header class="cms-header">
          <h1>Управление сайтом</h1>
          <a class="cms-header__back" href="#/ru/main">← На сайт</a>
        </header>
        <nav class="cms-sidebar">${navItems}</nav>
        <main class="cms-content">${content}</main>
      </div>
    `;
  }
}
