import { Component, Model } from 'veda-client';
import BasePage from './BasePage.js';

const SECTIONS = [
  { uri: 'site:AboutMainArticle' },
  { uri: 'site:PlatformMainArticle',     largeImage: true },
  { uri: 'site:ApplicationsMainArticle' },
  { uri: 'site:ServicesMainArticle' },
  { uri: 'site:ContactsMainArticle' },
];

export default class MainPage extends BasePage {
  static tag = 'page-main';
  static articleUri = null;

  constructor () {
    super();
    this.state.sections = [];
  }

  async added () {
    try {
      const models = await Promise.all(
        SECTIONS.map(async ({ uri, largeImage }) => {
          const m = new Model(uri);
          await m.load();
          m._largeImage = largeImage ?? false;
          return m;
        })
      );
      this.state.sections = models;
    } catch (e) {
      this.state.error = e.message;
    } finally {
      this.state.loading = false;
    }
  }

  render () {
    if (this.state.loading) return `<div class="loading">...</div>`;

    const sections = this.state.sections.map((article, idx) => {
      const heading = this.getLangValue(article, 'site:heading');
      const summary = this.renderMarkdown(article, 'site:summary');
      const content = this.renderMarkdown(article, 'site:content');

      // v-s:hasImage returns a Model instance — id is the file URI
      const imageModel = article['v-s:hasImage']?.[0];
      const imageUri = imageModel?.id ?? null;
      const imageUrl = imageUri ? `/files/${imageUri}` : null;

      const imgClass = `section-img${article._largeImage ? ' section-img--large' : ''}`;
      const imageBlock = imageUrl
        ? `<div class="section-media">
             <img src="${imageUrl}" alt="${heading}" class="${imgClass}" loading="lazy">
           </div>`
        : '';

      const textBlock = `
        <div class="section-text">
          ${heading ? `<h2 class="section-heading">${heading}</h2>` : ''}
          ${summary ? `<div class="markdown section-summary">${summary}</div>` : ''}
          ${content ? `<div class="markdown">${content}</div>` : ''}
        </div>
      `;

      const inner = `${textBlock}${imageBlock}`;

      const altClass = idx % 2 !== 0 ? ' page-section--alt' : '';

      return `
        <section class="page-section${altClass}">
          <div class="container section-inner${imageUrl ? ' section-inner--media' : ''}">${inner}</div>
        </section>
      `;
    }).join('');

    return `<div>${sections}</div>`;
  }
}
