import BasePage from './BasePage.js';

export default class PrivacyPage extends BasePage {
  static tag = 'page-privacy';
  static articleUri = 'site:ConfidentialArticle';

  render () {
    if (this.state.loading) return `<div class="loading">...</div>`;
    if (this.state.error) {
      return `<div class="container page-section"><p class="text-muted">${this.state.error}</p></div>`;
    }

    const article = this.state.article;
    // ConfidentialArticle has rdfs:label but no site:heading
    const heading = this.getLangValue(article, 'site:heading')
      || this.getLangValue(article, 'rdfs:label');
    const content = this.renderMarkdown(article, 'site:content');

    return `
      <div class="container page-section">
        ${heading ? `<h1 class="page-heading">${heading}</h1>` : ''}
        ${content ? `<div class="markdown">${content}</div>` : ''}
      </div>
    `;
  }
}
