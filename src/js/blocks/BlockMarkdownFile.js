import { Component } from 'veda-client';
import { marked } from 'marked';
import { blockCache } from '../utils/blockCache.js';
import { getText, getString } from '../utils/blockData.js';

export default class BlockMarkdownFile extends Component(HTMLElement) {
  static tag = 'block-markdown-file';

  constructor () {
    super();
    this.state.heading  = '';
    this.state.html     = '';
    this.state.cssClass = '';
    this.state.loaded   = false;
    this.state.error    = false;
  }

  async added () {
    const model = blockCache.get(this.getAttribute('data-block-id'));
    if (!model) return;

    this.state.heading  = getText(model, 'site:heading');
    this.state.cssClass = getString(model, 'site:cssClass') || '';

    const fileUrl = getString(model, 'site:fileUrl');
    if (!fileUrl) {
      this.state.error  = true;
      this.state.loaded = true;
      return;
    }

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let md = await res.text();

      // Rewrite relative image paths (./img.png → /doc/img.png)
      const base = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
      md = md.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, `![$1](${base}$2)`);

      this.state.html  = marked.parse(md);
    } catch (e) {
      console.warn('[BlockMarkdownFile] Failed to load', fileUrl, e);
      this.state.error = true;
    }

    this.state.loaded = true;
  }

  post () {
    // Inject markdown HTML via innerHTML since it must not be escaped.
    const slot = this.querySelector('[data-md-slot]');
    if (slot && this.state.html) slot.innerHTML = this.state.html;
  }

  render () {
    if (!this.state.loaded) return '<div class="loading">...</div>';
    const { heading, cssClass, error } = this.state;

    if (error) {
      return `
        <section class="page-section ${cssClass}">
          <div class="container">
            <p class="text-muted">Не удалось загрузить документ.</p>
          </div>
        </section>`;
    }

    return `
      <section class="page-section ${cssClass}">
        <div class="container">
          ${heading ? `<h1 class="page-heading">${heading}</h1>` : ''}
          <div class="markdown doc-content" data-md-slot></div>
        </div>
      </section>`;
  }
}
