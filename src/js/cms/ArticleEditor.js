import { Component, Model, Backend } from 'veda-client';
import { marked } from 'marked';

// Main page section articles (shown on homepage)
// Individual page articles (shown on dedicated pages)
const ARTICLES = [
  { uri: 'site:AboutMainArticle',    label: 'Главная — О компании (секция)' },
  { uri: 'site:PlatformMainArticle', label: 'Главная — Платформа (секция)' },
  { uri: 'site:ApplicationsMainArticle', label: 'Главная — Приложения (секция)' },
  { uri: 'site:ServicesMainArticle', label: 'Главная — Услуги (секция)' },
  { uri: 'site:ContactsMainArticle', label: 'Главная — Контакты (секция)' },
  { uri: 'site:AboutArticle',        label: 'Страница: О компании' },
  { uri: 'site:PlatformArticle',     label: 'Страница: Платформа' },
  { uri: 'site:ApplicationsArticle', label: 'Страница: Приложения' },
  { uri: 'site:ServicesArticle',     label: 'Страница: Услуги' },
  { uri: 'site:DeveloperGuide',      label: 'Страница: Документация' },
  { uri: 'site:PriceArticle',        label: 'Страница: Цены' },
  { uri: 'site:ContactsArticle',     label: 'Страница: Контакты' },
  { uri: 'site:DownloadArticle',     label: 'Страница: Скачать' },
  { uri: 'site:ConfidentialArticle', label: 'Политика конфиденциальности' },
];

export default class ArticleEditor extends Component(HTMLElement) {
  static tag = 'cms-article-editor';

  constructor () {
    super();
    this.state.selectedUri = null;
    this.state.article = null;
    this.state.labelRu = '';
    this.state.labelEn = '';
    this.state.headingRu = '';
    this.state.headingEn = '';
    this.state.contentRu = '';
    this.state.contentEn = '';
    this.state.preview = false;
    this.state.saving = false;
    this.state.message = null;
  }

  // onclick="{selectArticle}" — reads uri from data-uri
  async selectArticle (e) {
    const el = e.target.closest('[data-uri]');
    if (!el) return;
    const uri = el.dataset.uri;
    this.state.selectedUri = uri;
    this.state.message = null;
    try {
      const article = new Model(uri);
      await article.load();
      this.state.article = article;

      // Values are stored as "text^^RU" strings (see Value.js parse())
      const LANG_RE = /^([\s\S]*)\^\^([A-Za-z]{2})$/;
      const getVal = (prop, langCode) => {
        const values = article[prop] ?? [];
        const match = values.find((v) => {
          const m = String(v).match(LANG_RE);
          return m && m[2].toUpperCase() === langCode.toUpperCase();
        });
        if (match) return String(match).replace(LANG_RE, '$1');
        // Fallback: first value without language tag
        const plain = values.find((v) => !String(v).match(LANG_RE));
        return plain != null ? String(plain) : '';
      };

      this.state.labelRu   = getVal('rdfs:label', 'ru');
      this.state.labelEn   = getVal('rdfs:label', 'en');
      this.state.headingRu = getVal('site:heading', 'ru');
      this.state.headingEn = getVal('site:heading', 'en');
      this.state.contentRu = getVal('site:content', 'ru');
      this.state.contentEn = getVal('site:content', 'en');
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    }
  }

  async save () {
    if (!this.state.article) return;
    this.state.saving = true;
    this.state.message = null;

    // Sync textarea values from DOM before saving
    const taRu = this.querySelector('#content-ru');
    const taEn = this.querySelector('#content-en');
    if (taRu) this.state.contentRu = taRu.value;
    if (taEn) this.state.contentEn = taEn.value;

    try {
      const article = this.state.article;
      // Save as "text^^RU" strings — Value.serialize() recognises this format
      article['rdfs:label'] = [
        `${this.state.labelRu}^^RU`,
        `${this.state.labelEn}^^EN`,
      ];
      article['site:heading'] = [
        `${this.state.headingRu}^^RU`,
        `${this.state.headingEn}^^EN`,
      ];
      article['site:content'] = [
        `${this.state.contentRu}^^RU`,
        `${this.state.contentEn}^^EN`,
      ];
      await Backend.put_individual(article);
      this.state.message = { type: 'success', text: 'Сохранено' };
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.saving = false;
    }
  }

  cancel () {
    this.state.selectedUri = null;
    this.state.article = null;
    this.state.message = null;
  }

  togglePreview () {
    this.state.preview = !this.state.preview;
  }

  render () {
    if (!this.state.selectedUri) return this.renderList();
    return this.renderEditor();
  }

  renderList () {
    const items = ARTICLES.map((a) => `
      <div class="article-card">
        <span class="article-card__title">${a.label}</span>
        <div class="article-card__actions">
          <button class="btn btn-outline" data-uri="${a.uri}" onclick="{selectArticle}">
            Редактировать
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div>
        <h2>Статьи</h2>
        <div class="article-list" style="margin-top:1rem">${items}</div>
      </div>
    `;
  }

  renderEditor () {
    const s = this.state;
    const articleMeta = ARTICLES.find((a) => a.uri === s.selectedUri);
    const msgHtml = s.message
      ? `<div class="alert alert-${s.message.type}">${s.message.text}</div>`
      : '';

    const previewHtml = marked.parse(s.contentRu || '');

    return `
      <div class="article-editor">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <h2>${articleMeta?.label ?? s.selectedUri}</h2>
          <button class="btn btn-outline" onclick="{cancel}" style="margin-left:auto">← Назад</button>
        </div>

        ${msgHtml}

        <div class="form-group">
          <label class="form-label">Заголовок (RU)</label>
          <input class="form-input" type="text" value="${s.labelRu}"
            oninput="{handleLabelRu}">
        </div>
        <div class="form-group">
          <label class="form-label">Заголовок (EN)</label>
          <input class="form-input" type="text" value="${s.labelEn}"
            oninput="{handleLabelEn}">
        </div>
        <div class="form-group">
          <label class="form-label">Heading (RU)</label>
          <input class="form-input" type="text" value="${s.headingRu}"
            oninput="{handleHeadingRu}">
        </div>
        <div class="form-group">
          <label class="form-label">Heading (EN)</label>
          <input class="form-input" type="text" value="${s.headingEn}"
            oninput="{handleHeadingEn}">
        </div>

        <div class="form-group">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">
            <span class="form-label" style="margin:0">Контент RU (Markdown)</span>
            <button class="btn btn-outline" style="padding:.2em .6em;font-size:.8rem"
              onclick="{togglePreview}">
              ${s.preview ? 'Редактор' : 'Предпросмотр'}
            </button>
          </div>
          ${s.preview
            ? `<div class="editor-preview markdown">${previewHtml}</div>`
            : `<textarea id="content-ru" class="form-textarea">${s.contentRu}</textarea>`
          }
        </div>

        <div class="form-group">
          <label class="form-label">Контент EN (Markdown)</label>
          <textarea id="content-en" class="form-textarea">${s.contentEn}</textarea>
        </div>

        <div class="editor-actions">
          <button class="btn btn-primary" onclick="{save}" ${s.saving ? 'disabled' : ''}>
            ${s.saving ? 'Сохраняю...' : 'Сохранить'}
          </button>
          <button class="btn btn-outline" onclick="{cancel}">Отмена</button>
        </div>
      </div>
    `;
  }

  handleLabelRu (e)   { this.state.labelRu   = e.target.value; }
  handleLabelEn (e)   { this.state.labelEn   = e.target.value; }
  handleHeadingRu (e) { this.state.headingRu = e.target.value; }
  handleHeadingEn (e) { this.state.headingEn = e.target.value; }
}
