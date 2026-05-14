import { Component, Model } from 'veda-client';
import { marked } from 'marked';
import lang from '../lang.js';

// Matches Value.js parse() output: "text^^RU" or "text^^EN"
const LANG_SUFFIX_RE = /^([\s\S]*)\^\^([A-Za-z]{2})$/;

/**
 * Parse a string returned by veda-client Value.parse().
 * Language-tagged literals come back as "text^^RU" (uppercase 2-letter code).
 */
function parseMLString (v) {
  if (typeof v !== 'string') return { text: String(v ?? ''), lang: null };
  const m = v.match(LANG_SUFFIX_RE);
  return m ? { text: m[1], lang: m[2].toUpperCase() } : { text: v, lang: null };
}

export default class BasePage extends Component(HTMLElement) {
  static articleUri = null;

  constructor () {
    super();
    this.state.article = null;
    this.state.loading = true;
    this.state.error = null;
  }

  async added () {
    try {
      const article = new Model(this.constructor.articleUri);
      await article.load();
      this.state.article = article;
    } catch (e) {
      this.state.error = e.message;
    } finally {
      this.state.loading = false;
    }
  }

  getLangValue (article, prop) {
    const l = lang.current.toUpperCase(); // 'RU' or 'EN'
    const values = article[prop];
    if (!values?.length) return '';

    // Find value matching current language
    const match = values.find((v) => parseMLString(v).lang === l)
      // Fallback: first value with no language tag (plain string)
      ?? values.find((v) => parseMLString(v).lang === null)
      // Last resort: first value
      ?? values[0];

    return parseMLString(match).text;
  }

  renderMarkdown (article, prop) {
    const raw = this.getLangValue(article, prop);
    if (!raw) return '';
    const html = marked.parse(raw);
    // Fix relative Veda file URLs: "files/site:Xxx" → "/files/site:Xxx"
    return html.replace(/(href|src)="files\//g, '$1="/files/');
  }

  getImageUrl (article) {
    const imageModel = article['v-s:hasImage']?.[0];
    const id = imageModel?.id ?? null;
    return id ? `/files/${id}` : null;
  }

  render () {
    if (this.state.loading) {
      return `<div class="loading">...</div>`;
    }
    if (this.state.error) {
      return `<div class="container page-section"><p class="text-muted">${this.state.error}</p></div>`;
    }
    const article = this.state.article;
    const heading  = this.getLangValue(article, 'site:heading');
    const summary  = this.renderMarkdown(article, 'site:summary');
    const content  = this.renderMarkdown(article, 'site:content');
    const imageUrl = this.getImageUrl(article);

    const headerBlock = (heading || summary || imageUrl) ? `
      <div class="page-header${imageUrl ? ' page-header--media' : ''}">
        <div class="page-header__text">
          ${heading ? `<h1 class="page-heading">${heading}</h1>` : ''}
          ${summary ? `<div class="markdown lead">${summary}</div>` : ''}
        </div>
        ${imageUrl ? `<div class="page-header__image"><img src="${imageUrl}" alt="${heading}" class="section-img"></div>` : ''}
      </div>
    ` : '';

    return `
      <div class="container page-section">
        ${headerBlock}
        ${content ? `<div class="markdown">${content}</div>` : ''}
      </div>
    `;
  }
}
