import { Component } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getString } from '../utils/blockData.js';

export default class BlockCta extends Component(HTMLElement) {
  static tag = 'block-cta';

  constructor () {
    super();
    this.state.heading     = '';
    this.state.summaryHtml = '';
    this.state.ctaLabel    = '';
    this.state.ctaUrl      = '';
    this.state.align       = 'center';
    this.state.bgVariant   = 'primary';
    this.state.cssClass    = '';
    this.state.loaded      = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    this.state.heading     = getText(model, 'site:heading');
    this.state.summaryHtml = getMarkdown(model, 'site:summary');
    this.state.ctaLabel    = getText(model, 'site:ctaLabel');
    this.state.ctaUrl      = getString(model, 'site:url');
    this.state.align       = getString(model, 'site:align')     || 'center';
    this.state.bgVariant   = getString(model, 'site:bgVariant') || 'primary';
    this.state.cssClass    = getString(model, 'site:cssClass');
    this.state.loaded      = true;
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, summaryHtml, ctaLabel, ctaUrl, align, bgVariant, cssClass } = this.state;

    const bgClass  = bgVariant === 'primary' ? ' page-section--primary'
                   : bgVariant === 'dark'    ? ' page-section--dark'
                   : bgVariant === 'alt'     ? ' page-section--alt'
                   : '';
    const centered = align === 'center' ? ' text-center' : '';

    const ctaHtml = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" class="btn btn-primary block-cta__btn">${ctaLabel}</a>`
      : '';

    return `
      <section class="page-section block-cta${bgClass} ${cssClass}" data-bg="${bgVariant}">
        <div class="container${centered}">
          ${heading     ? `<h2 class="section-heading">${heading}</h2>` : ''}
          ${summaryHtml ? `<div class="markdown">${summaryHtml}</div>` : ''}
          ${ctaHtml}
        </div>
      </section>
    `;
  }
}
