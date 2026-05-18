import { Component } from 'veda-client';
import { blockCache } from '../utils/blockCache.js';
import { getText, getMarkdown, getFileUrl, getString } from '../utils/blockData.js';

export default class BlockText extends Component(HTMLElement) {
  static tag = 'block-text';

  constructor () {
    super();
    this.state.heading     = '';
    this.state.summaryHtml = '';
    this.state.contentHtml = '';
    this.state.imageUrl    = null;
    this.state.imagePos    = 'right';
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
    this.state.imagePos    = getString(model, 'site:imagePos')  || 'right';
    this.state.bgVariant   = getString(model, 'site:bgVariant') || 'default';
    this.state.cssClass    = getString(model, 'site:cssClass');
    this.state.loaded      = true;
  }

  render () {
    if (!this.state.loaded) return '';
    const { heading, summaryHtml, contentHtml, imageUrl, imagePos, bgVariant, cssClass } = this.state;

    const altBg    = bgVariant === 'alt' ? ' page-section--alt' : '';
    const hasMedia = !!imageUrl;

    const imageHtml = imageUrl
      ? `<div class="section-media">
           <img src="${imageUrl}" alt="" class="section-img" loading="lazy">
         </div>`
      : '';

    const textHtml = `
      <div class="section-text">
        ${heading     ? `<h2 class="section-heading">${heading}</h2>` : ''}
        ${summaryHtml ? `<div class="markdown section-summary">${summaryHtml}</div>` : ''}
        ${contentHtml ? `<div class="markdown">${contentHtml}</div>` : ''}
      </div>
    `;

    const inner = imagePos === 'left'
      ? `${imageHtml}${textHtml}`
      : `${textHtml}${imageHtml}`;

    return `
      <section class="page-section${altBg} ${cssClass}" data-bg="${bgVariant}">
        <div class="container">
          <div class="section-inner${hasMedia ? ' section-inner--media' : ''}">${inner}</div>
        </div>
      </section>
    `;
  }
}
