import { Component } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getFileUrl, getString } from '../utils/blockData.js';

export default class BlockHero extends Component(HTMLElement) {
  static tag = 'block-hero';

  constructor () {
    super();
    this.state.heading     = '';
    this.state.summaryHtml = '';
    this.state.contentHtml = '';
    this.state.imageUrl    = null;
    this.state.ctaLabel    = '';
    this.state.ctaUrl      = '';
    this.state.bgVariant   = 'default';
    this.state.cssClass    = '';
    this.state.loaded      = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    this.state.heading     = getText(model, 'site:heading');
    this.state.summaryHtml = getMarkdown(model, 'site:summary');
    this.state.contentHtml = getMarkdown(model, 'site:content');
    this.state.imageUrl    = getFileUrl(model, 'v-s:hasImage');
    this.state.ctaLabel    = getText(model, 'site:ctaLabel');
    this.state.ctaUrl      = getString(model, 'site:url');
    this.state.bgVariant   = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass    = getString(model, 'site:cssClass');
    this.state.loaded      = true;
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, summaryHtml, contentHtml, imageUrl, ctaLabel, ctaUrl, bgVariant, cssClass } = this.state;

    const altBg    = bgVariant === 'alt' ? ' page-section--alt' : bgVariant === 'dark' ? ' page-section--dark' : '';
    const hasMedia = !!imageUrl;

    const imageHtml = imageUrl
      ? `<div class="block-hero__image">
           <img src="${imageUrl}" alt="" class="section-img section-img--large" loading="lazy">
         </div>`
      : '';

    const ctaHtml = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" class="btn btn-primary block-hero__cta">${ctaLabel}</a>`
      : '';

    return `
      <section class="page-section block-hero${altBg} ${cssClass}" data-bg="${bgVariant}">
        <div class="container">
          <div class="section-inner${hasMedia ? ' section-inner--media' : ''}">
            <div class="section-text">
              ${heading     ? `<h1 class="page-heading">${heading}</h1>` : ''}
              ${summaryHtml ? `<div class="markdown lead">${summaryHtml}</div>` : ''}
              ${contentHtml ? `<div class="markdown">${contentHtml}</div>` : ''}
              ${ctaHtml}
            </div>
            ${imageHtml}
          </div>
        </div>
      </section>
    `;
  }
}
