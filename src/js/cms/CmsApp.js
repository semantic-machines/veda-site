import { Component, Backend, html } from 'veda-client';
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
    this.state.checking  = true;
    this.state.allowed   = false;
    this.state.section   = 'blocks';
    this.state.homeHref  = '#/';
    this.state.login     = '';
    this.state.password  = '';
    this.state.loginError = null;
    this.state.loggingIn = false;
    this.state.sections  = SECTIONS;
  }

  get loginButtonText () {
    return this.state.loggingIn ? 'Вход...' : 'Войти';
  }

  async added () {
    try {
      const { Model } = await import('veda-client');
      const site = new Model('site:VedaSite');
      await site.load();
      const homeRef = site['site:homePage']?.[0] ?? site['site:hasPage']?.[0];
      if (homeRef?.id) {
        this.state.homeHref = `#/ru/p/${homeRef.id}`;
      }
    } catch { /* offline */ }

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
      return html`<div class="loading">Проверка доступа...</div>`;
    }

    if (!this.state.allowed) {
      return html`
        <div class="cms-login">
          <div class="cms-login__card">
            <div class="cms-login__title">Вход в CMS</div>
            <div class="cms-login__sub">Управление контентом сайта</div>
            <veda-if condition="{state.loginError}">
              <div class="alert alert-error">{state.loginError}</div>
            </veda-if>
            <form onsubmit="{submitLogin}">
              <div class="form-group" style="margin-bottom:.75rem">
                <label class="form-label">Логин</label>
                <input class="form-input" type="text" autocomplete="username"
                  value="{state.login}" oninput="{handleLogin}">
              </div>
              <div class="form-group">
                <label class="form-label">Пароль</label>
                <input class="form-input" type="password" autocomplete="current-password"
                  value="{state.password}" oninput="{handlePassword}">
              </div>
              <div class="cms-login__actions">
                <button class="btn btn-primary" type="submit"
                  !{ state.loggingIn ? 'disabled' : '' }>{loginButtonText}</button>
                <a class="btn btn-outline" href="{state.homeHref}">← На сайт</a>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    return html`
      <div class="cms-app">
        <header class="cms-header">
          <h1>Управление сайтом</h1>
          <a class="cms-header__back" href="{state.homeHref}">← На сайт</a>
        </header>
        <nav class="cms-sidebar">
          <veda-loop items="{state.sections}" as="s" key="id">
            <a class="cms-nav__item !{ state.section === s.id ? ' cms-nav__item--active' : '' }"
               href="#"
               data-section="{s.id}"
               onclick="{selectSection}">
              <span>{s.icon}</span> {s.label}
            </a>
          </veda-loop>
        </nav>
        <main class="cms-content">
          <veda-if condition="{state.section === 'blocks'}"><cms-block-editor></cms-block-editor></veda-if>
          <veda-if condition="{state.section === 'pages'}"><cms-page-manager></cms-page-manager></veda-if>
          <veda-if condition="{state.section === 'catalog'}"><cms-catalog-editor></cms-catalog-editor></veda-if>
          <veda-if condition="{state.section === 'media'}"><cms-media-uploader></cms-media-uploader></veda-if>
          <veda-if condition="{state.section === 'settings'}"><cms-site-settings></cms-site-settings></veda-if>
        </main>
      </div>
    `;
  }
}
