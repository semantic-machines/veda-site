import { Component, Model, Backend } from 'veda-client';
import { marked } from 'marked';
import { parseMLString } from '../utils/mlValue.js';
import { ALL_ARTICLES as ARTICLES } from '../pages.js';

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
    this.state.message = null;
    try {
      const article = new Model(uri);
      await article.load();

      this.state.article = article;
      this.state.selectedUri = uri;
      this.state.preview = false;
      this._loadBothLangs(article);
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
      this.state.selectedUri = null;
    }
    await this.update();
  }

  _loadBothLangs (article) {
    const getVal = (prop, langCode) => {
      const lc = langCode.toUpperCase();
      const values = article[prop] ?? [];
      const match = values.find((v) => parseMLString(String(v)).lang === lc);
      if (match) return parseMLString(String(match)).text;
      const plain = values.find((v) => parseMLString(String(v)).lang === null);
      return plain != null ? parseMLString(String(plain)).text : '';
    };

    this.state.labelRu   = getVal('rdfs:label', 'ru');
    this.state.labelEn   = getVal('rdfs:label', 'en');
    this.state.headingRu = getVal('site:heading', 'ru');
    this.state.headingEn = getVal('site:heading', 'en');
    this.state.contentRu = getVal('site:content', 'ru');
    this.state.contentEn = getVal('site:content', 'en');
  }

  async save () {
    if (!this.state.article) return;

    // Sync textarea content from DOM before re-rendering
    const taRu = this.querySelector('#content-ru');
    const taEn = this.querySelector('#content-en');
    if (taRu) this.state.contentRu = taRu.value;
    if (taEn) this.state.contentEn = taEn.value;

    this.state.saving = true;
    this.state.message = null;
    await this.update();

    try {
      const article = this.state.article;
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
      await this.update();
    }
  }

  cancel () {
    this.state.selectedUri = null;
    this.state.article = null;
    this.state.message = null;
    this.update();
  }

  togglePreview () {
    // Sync textarea content before re-render so preview shows what user typed
    const ta = this.querySelector('#content-ru');
    if (ta) this.state.contentRu = ta.value;
    this.state.preview = !this.state.preview;
    this.update();
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
