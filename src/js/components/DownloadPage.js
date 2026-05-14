import { marked } from 'marked';
import BasePage from './BasePage.js';
import lang from '../lang.js';

const LABELS = {
  download: { ru: 'Скачать',           en: 'Download' },
  github:   { ru: 'GitHub репозиторий', en: 'GitHub repository' },
};

export default class DownloadPage extends BasePage {
  static tag = 'page-download';
  static articleUri = 'site:DownloadArticle';

  added () {
    const result = super.added();
    // Set rel on external links after render
    result?.then?.(() => this._setExternalRel());
    return result;
  }

  _setExternalRel () {
    this.querySelectorAll('a[target="_blank"]').forEach((a) => {
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  render () {
    if (this.state.loading) return `<div class="loading">...</div>`;

    const l = lang.current;
    const article = this.state.article;
    const heading = article ? this.getLangValue(article, 'site:heading') : '';
    const content = article ? marked.parse(this.getLangValue(article, 'site:content') || '') : '';

    return `
      <div class="container page-section">
        ${heading ? `<h1>${heading}</h1>` : ''}
        <div class="markdown">${content}</div>
        <div class="download-links" style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap">
          <a class="btn btn-primary"
             href="https://github.com/semantic-machines/veda/releases"
             target="_blank">
            ${LABELS.download[l]}
          </a>
          <a class="btn btn-outline"
             href="https://github.com/semantic-machines/veda"
             target="_blank">
            ${LABELS.github[l]}
          </a>
        </div>
      </div>
    `;
  }
}
