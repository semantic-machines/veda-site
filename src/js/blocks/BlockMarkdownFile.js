import { Component, html } from 'veda-client';
import { getText, getString } from '../utils/blockData.js';
import { parseMarkdown } from '../utils/parseMarkdown.js';
import { fetchMarkdownText } from '../utils/fetchMarkdown.js';
import { mountMarkdownHtml } from '../utils/mountMarkdownHtml.js';
import { scrollToSection, mdTabKey } from '../utils/pageNav.js';

export default class BlockMarkdownFile extends Component(HTMLElement) {
  static tag = 'block-markdown-file';

  #tabKey = '';

  _syncMarkdown () {
    mountMarkdownHtml(this, this._markdownHtml, this.#tabKey);
  }

  async added () {
    const m = this.state.model;
    if (!m) return;

    if (!m.isLoaded?.()) {
      try {
        await m.load();
      } catch (e) {
        console.warn('[BlockMarkdownFile] model load failed', e);
        this.state.error = true;
        await this.update();
        return;
      }
    }

    this.state.heading  = getText(m, 'site:heading');
    this.state.cssClass = getString(m, 'site:cssClass') || '';

    const fileUrl = getString(m, 'site:fileUrl');
    if (!fileUrl) {
      this.state.error = true;
      await this.update();
      return;
    }

    this.#tabKey = mdTabKey(fileUrl);

    try {
      const md = await fetchMarkdownText(fileUrl);
      const base = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
      this._markdownHtml = parseMarkdown(md, { baseUrl: base });
    } catch (e) {
      console.warn('[BlockMarkdownFile] Failed to load', fileUrl, e);
      this.state.error = true;
      this._markdownHtml = '';
      await this.update();
      return;
    }

    await this.update();
    this._syncMarkdown();
    const section = this.closest('page-renderer')?.getAttribute('data-doc-section');
    if (section) scrollToSection(section);
  }

  post () {
    this._syncMarkdown();
  }

  renderedCallback () {
    this._syncMarkdown();
  }

  render () {
    if (this.state.error) {
      return html`
        <section class="page-section {state.cssClass}">
          <div class="container">
            <p class="text-muted">Не удалось загрузить документ.</p>
          </div>
        </section>`;
    }

    return html`
      <section class="page-section {state.cssClass}">
        <div class="container">
          <veda-if condition="{state.heading}">
            <h1 class="page-heading">{state.heading}</h1>
          </veda-if>
          <div class="markdown doc-content" data-md-slot=""></div>
        </div>
      </section>`;
  }
}
