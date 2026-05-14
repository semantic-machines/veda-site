import { Component } from 'veda-client';
import { marked } from 'marked';
import lang from '../lang.js';

import devDocRaw from '../../doc/dev-doc.md';
import webApiRaw from '../../doc/web-api.md';

// Fix relative image/file links coming from the doc sources
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
    label: { ru: 'Web API',                   en: 'Web API' },
    html: mdHtml(webApiRaw),
  },
];

export default class DocumentationPage extends Component(HTMLElement) {
  static tag = 'page-documentation';

  constructor () {
    super();
    this.state.activeIdx = 0;
  }

  selectDoc (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (!isNaN(idx)) this.state.activeIdx = idx;
  }

  render () {
    const l = lang.current;

    const tabs = DOCS.map((doc, i) =>
      `<button class="aspect-tab {state.activeIdx === ${i} ? 'active' : ''}"
               data-idx="${i}" onclick="{selectDoc}">${doc.label[l] || doc.label.ru}</button>`
    ).join('');

    // Content is rendered once per render() call — activeIdx switching is reactive via update()
    // We use post() to swap visible content to avoid re-parsing large markdown on each tab click
    return `
      <div class="container page-section">
        <div class="aspects-tabs doc-tabs">${tabs}</div>
        ${DOCS.map((doc, i) =>
          `<div class="doc-content {state.activeIdx === ${i} ? '' : 'doc-content--hidden'}" data-doc="${i}">
             <div class="markdown">${doc.html}</div>
           </div>`
        ).join('')}
      </div>
    `;
  }
}
