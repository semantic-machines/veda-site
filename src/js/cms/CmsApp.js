import { Component, Backend } from 'veda-client';
import ArticleEditor from './ArticleEditor.js';
import PageManager from './PageManager.js';
import MediaUploader from './MediaUploader.js';

customElements.define(ArticleEditor.tag, ArticleEditor);
customElements.define(PageManager.tag, PageManager);
customElements.define(MediaUploader.tag, MediaUploader);

const SECTIONS = [
  { id: 'articles', label: 'Статьи' },
  { id: 'pages',    label: 'Страницы' },
  { id: 'media',    label: 'Медиафайлы' },
];

export default class CmsApp extends Component(HTMLElement) {
  static tag = 'cms-app';

  constructor () {
    super();
    this.state.checking = true;
    this.state.allowed = false;
    this.state.section = 'articles';
  }

  async added () {
    try {
      const rights = await Backend.get_rights('site:Article');
      this.state.allowed = rights?.canCreate === true || rights?.canUpdate === true;
    } catch {
      this.state.allowed = false;
    } finally {
      this.state.checking = false;
    }
  }

  // onclick="{selectSection}" — reads section from data-section attribute
  selectSection (e) {
    e.preventDefault();
    const el = e.target.closest('[data-section]');
    if (el) this.state.section = el.dataset.section;
  }

  render () {
    if (this.state.checking) {
      return `<div class="loading">Проверка доступа...</div>`;
    }

    if (!this.state.allowed) {
      return `
        <div class="container page-section text-center">
          <h2>Доступ запрещён</h2>
          <p class="text-muted">Управление сайтом доступно только членам группы site:SiteAdmin.</p>
          <a class="btn btn-outline" href="#/ru/main">На главную</a>
        </div>
      `;
    }

    const section = this.state.section;

    const navItems = SECTIONS.map((s) => `
      <a class="cms-nav__item${section === s.id ? ' cms-nav__item--active' : ''}"
         href="#"
         data-section="${s.id}"
         onclick="{selectSection}">
        ${s.label}
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
        <div class="cms-layout">
          <nav class="cms-sidebar">${navItems}</nav>
          <main class="cms-content">${content}</main>
        </div>
      </div>
    `;
  }
}
