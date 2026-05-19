import { Component } from 'veda-client';
import { marked } from 'marked';
import { getText, getString } from '../utils/blockData.js';

export default class BlockMarkdownFile extends Component(HTMLElement) {
  static tag = 'block-markdown-file';

  async added () {
    const m = this.state.model;
    if (!m?.isLoaded()) return;

    this.state.heading  = getText(m, 'site:heading');
    this.state.cssClass = getString(m, 'site:cssClass') || '';

    const fileUrl = getString(m, 'site:fileUrl');
    if (!fileUrl) {
      this.state.error = true;
      return;
    }

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let md = await res.text();
      const base = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
      md = md.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, `![$1](${base}$2)`);
      this.state.html = marked.parse(md);
    } catch (e) {
      console.warn('[BlockMarkdownFile] Failed to load', fileUrl, e);
      this.state.error = true;
    }
  }

  post () {
    const slot = this.querySelector('[data-md-slot]');
    if (slot && this.state.html) slot.innerHTML = this.state.html;
  }

  render () {
    if (this.state.error) {
      return `
        <section class="page-section {state.cssClass}">
          <div class="container">
            <p class="text-muted">Не удалось загрузить документ.</p>
          </div>
        </section>`;
    }

    return `
      <section class="page-section {state.cssClass}">
        <div class="container">
          ${this.state.heading ? '<h1 class="page-heading">{state.heading}</h1>' : ''}
          <div class="markdown doc-content" data-md-slot></div>
        </div>
      </section>`;
  }
}
