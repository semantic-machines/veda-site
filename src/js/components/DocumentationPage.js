import { Component } from 'veda-client';
import { marked } from 'marked';
import lang from '../lang.js';

import devDocRaw from '../../doc/dev-doc.md';
import webApiRaw from '../../doc/web-api.md';

function mdHtml (raw) {
  return marked.parse(raw).replace(/(href|src)="files\//g, '$1="/files/');
}

const DOCS = [
  {
    id: 'dev-guide',
    label: { ru: 'Руководство разработчика', en: 'Developer Guide' },
    html: mdHtml(devDocRaw),
  },
  {
    id: 'web-api',
    label: { ru: 'Web API', en: 'Web API' },
    html: mdHtml(webApiRaw),
  },
];

export default class DocumentationPage extends Component(HTMLElement) {
  static tag = 'page-documentation';

  constructor () {
    super();
    this.state.activeIdx = 0;
  }

  // Set doc body innerHTML directly — bypasses veda-client template processing
  // so curly braces in code examples are never interpreted as reactive expressions
  _updateBody (idx) {
    const body = this.querySelector('.doc-body');
    if (body) body.innerHTML = `<div class="markdown">${DOCS[idx].html}</div>`;
  }

  selectDoc (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx)) return;
    this.state.activeIdx = idx;
    this._updateBody(idx);
  }

  // post() is called after the component is fully rendered — safe to query DOM
  post () {
    this._updateBody(this.state.activeIdx);
  }

  render () {
    const l = lang.current;

    const tabs = DOCS.map((doc, i) =>
      `<button class="aspect-tab {state.activeIdx === ${i} ? 'active' : ''}"
               data-idx="${i}" onclick="{selectDoc}">${doc.label[l] || doc.label.ru}</button>`
    ).join('');

    return `
      <div class="container page-section">
        <div class="aspects-tabs doc-tabs">${tabs}</div>
        <div class="doc-body"></div>
      </div>
    `;
  }
}
