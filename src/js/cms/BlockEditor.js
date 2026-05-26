import { Component, Model, html, raw } from 'veda-client';
import { marked } from 'marked';
import { getOrder } from '../utils/blockData.js';
import { loadModels, loadModelsOrdered } from '../utils/loadModels.js';
import {
  escapeHtml, getBiLingual, setBiLingual,
  getStringProp, setStringProp, saveModel,
} from './cmsUtils.js';

// blockType → editable multilingual properties
const ML_FIELDS = {
  text:  ['site:heading', 'site:summary', 'site:content'],
  hero:  ['site:heading', 'site:summary', 'site:content', 'site:ctaLabel'],
  cta:   ['site:heading', 'site:summary', 'site:ctaLabel'],
};

const STRING_FIELDS = {
  hero: ['site:url'],
  cta:  ['site:url'],
};

const FIELD_LABELS = {
  'site:heading':  { ru: 'Заголовок', en: 'Heading' },
  'site:summary':  { ru: 'Резюме (Markdown)', en: 'Summary (Markdown)' },
  'site:content':  { ru: 'Контент (Markdown)', en: 'Content (Markdown)' },
  'site:ctaLabel': { ru: 'Текст кнопки', en: 'CTA label' },
  'site:url':      { ru: 'URL', en: 'URL' },
  'site:fileUrl':  { ru: 'Путь к файлу', en: 'File path' },
};

const BLOCK_TYPE_LABELS = {
  text: 'Текст', hero: 'Hero', cta: 'CTA', tabs: 'Вкладки',
  cards: 'Карточки', layout: 'Сетка', 'query-list': 'Список',
  'markdown-file': 'Markdown-файл', 'doc-tabs': 'Документация',
};

export default class BlockEditor extends Component(HTMLElement) {
  static tag = 'cms-block-editor';

  constructor () {
    super();
    this.state.pages = [];
    this.state.blocks = [];
    this.state.selectedPage = null;
    this.state.selectedBlock = null;
    this.state.model = null;
    this.state.fields = {};
    this.state.strFields = {};
    this.state.docItems = [];
    this.state.preview = false;
    this.state.saving = false;
    this.state.loading = true;
    this.state.message = null;
  }

  async added () {
    try {
      const site = new Model('site:VedaSite');
      await site.load();
      const pageModels = await loadModelsOrdered(site['site:hasPage'] ?? []);
      const pages = pageModels.map((page) => {
        const label = getBiLingual(page, 'rdfs:label');
        return { uri: page.id, labelRu: label.ru, labelEn: label.en };
      });
      pages.sort((a, b) => a.labelRu.localeCompare(b.labelRu, 'ru'));
      this.state.pages = pages;
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.loading = false;
    }
  }

  async selectPage (e) {
    const el = e.target.closest('[data-uri]');
    if (!el) return;
    const uri = el.dataset.uri;
    const page = this.state.pages.find((p) => p.uri === uri);
    if (!page) return;

    this.state.message = null;
    this.state.selectedBlock = null;
    this.state.model = null;
    this.state.selectedPage = uri;

    try {
      const m = new Model(page.uri);
      await m.load();
      const blockModels = await loadModelsOrdered(m['site:hasBlock'] ?? []);
      const blocks = blockModels.map((block) => {
        const type = block['site:blockType']?.[0] ?? '';
        const label = getBiLingual(block, 'site:heading');
        return {
          id:      block.id,
          type,
          typeLabel: BLOCK_TYPE_LABELS[type] || type,
          label:   label.ru || label.en || block.id,
          order:   getOrder(block),
          editable: !!(ML_FIELDS[type] || type === 'doc-tabs'),
        };
      });
      blocks.sort((a, b) => a.order - b.order);
      this.state.blocks = blocks;
    } catch (err) {
      this.state.message = { type: 'error', text: err.message };
    }
    await this.update();
  }

  async selectBlock (e) {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    const id = el.dataset.id;
    const meta = this.state.blocks.find((b) => b.id === id);
    if (!meta) return;

    this.state.message = null;
    this.state.preview = false;

    try {
      const model = new Model(id);
      await model.load();
      this.state.model = model;
      this.state.selectedBlock = id;

      const type = model['site:blockType']?.[0] ?? '';
      const fields = {};
      for (const prop of ML_FIELDS[type] ?? []) {
        fields[prop] = getBiLingual(model, prop);
      }
      this.state.fields = fields;

      const strFields = {};
      for (const prop of STRING_FIELDS[type] ?? []) {
        strFields[prop] = getStringProp(model, prop);
      }
      this.state.strFields = strFields;

      if (type === 'doc-tabs') {
        const itemModels = await loadModelsOrdered(model['site:hasItem'] ?? []);
        const items = itemModels.map((item) => {
          const label = getBiLingual(item, 'rdfs:label');
          return {
            id:      item.id,
            labelRu: label.ru,
            labelEn: label.en,
            fileUrl: getStringProp(item, 'site:fileUrl'),
            order:   getOrder(item),
            model:   item,
          };
        });
        items.sort((a, b) => a.order - b.order);
        this.state.docItems = items;
      } else {
        this.state.docItems = [];
      }
    } catch (err) {
      this.state.message = { type: 'error', text: err.message };
    }
    await this.update();
  }

  backToPages () {
    this.state.selectedPage = null;
    this.state.selectedBlock = null;
    this.state.model = null;
    this.state.blocks = [];
    this.update();
  }

  backToBlocks () {
    this.state.selectedBlock = null;
    this.state.model = null;
    this.update();
  }

  _syncFromDom () {
    for (const prop of Object.keys(this.state.fields)) {
      const ru = this.querySelector(`#field-${prop.replace(/[^a-z]/gi, '')}-ru`);
      const en = this.querySelector(`#field-${prop.replace(/[^a-z]/gi, '')}-en`);
      if (ru) this.state.fields[prop].ru = ru.value;
      if (en) this.state.fields[prop].en = en.value;
    }
    for (const prop of Object.keys(this.state.strFields)) {
      const el = this.querySelector(`#str-${prop.replace(/[^a-z]/gi, '')}`);
      if (el) this.state.strFields[prop] = el.value;
    }
    for (const item of this.state.docItems) {
      const ru = this.querySelector(`#doc-${item.id}-ru`);
      const en = this.querySelector(`#doc-${item.id}-en`);
      const url = this.querySelector(`#doc-${item.id}-url`);
      if (ru)  item.labelRu = ru.value;
      if (en)  item.labelEn = en.value;
      if (url) item.fileUrl = url.value;
    }
  }

  togglePreview () {
    this._syncFromDom();
    this.state.preview = !this.state.preview;
    this.update();
  }

  async save () {
    if (!this.state.model) return;
    this._syncFromDom();

    this.state.saving = true;
    this.state.message = null;
    await this.update();

    try {
      const model = this.state.model;
      const type = model['site:blockType']?.[0] ?? '';

      for (const [prop, vals] of Object.entries(this.state.fields)) {
        setBiLingual(model, prop, vals);
      }
      for (const [prop, val] of Object.entries(this.state.strFields)) {
        setStringProp(model, prop, val);
      }

      if (type === 'doc-tabs') {
        for (const item of this.state.docItems) {
          setBiLingual(item.model, 'rdfs:label', { ru: item.labelRu, en: item.labelEn });
          setStringProp(item.model, 'site:fileUrl', item.fileUrl);
          await saveModel(item.model);
        }
      }

      await saveModel(model);
      this.state.message = { type: 'success', text: 'Сохранено' };
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.saving = false;
      await this.update();
    }
  }

  render () {
    if (this.state.loading) return html`<div class="loading">Загрузка...</div>`;
    if (this.state.selectedBlock) return this.renderBlockEditor();
    if (this.state.selectedPage) return this.renderBlockList();
    return this.renderPageList();
  }

  renderPageList () {
    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const items = this.state.pages.map((p) => `
      <div class="article-card">
        <span class="article-card__title">
          ${escapeHtml(p.labelRu)}
          <span class="text-muted" style="font-weight:400"> ${escapeHtml(p.uri)}</span>
        </span>
        <div class="article-card__actions">
          <button class="btn btn-outline" data-uri="${escapeHtml(p.uri)}" onclick="{selectPage}">
            Блоки
          </button>
        </div>
      </div>
    `).join('');

    return html`
      <div>
        <h2>Контент страниц</h2>
        <p class="text-muted" style="margin:.5rem 0 1rem">Выберите страницу для редактирования блоков.</p>
        ${raw(msgHtml)}
        <div class="article-list">${raw(items)}</div>
      </div>
    `;
  }

  renderBlockList () {
    const page = this.state.pages.find((p) => p.uri === this.state.selectedPage);
    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const items = this.state.blocks.map((b) => `
      <div class="article-card">
        <span class="article-card__title">
          ${escapeHtml(b.label)}
          <span class="text-muted" style="font-weight:400"> — ${escapeHtml(b.typeLabel)}</span>
        </span>
        <div class="article-card__actions">
          ${b.editable
            ? `<button class="btn btn-outline" data-id="${escapeHtml(b.id)}" onclick="{selectBlock}">Редактировать</button>`
            : '<span class="text-muted" style="font-size:.85rem">Только в онтологии</span>'
          }
        </div>
      </div>
    `).join('');

    return html`
      <div>
        <div style="margin-bottom:1rem">
          <button class="btn btn-outline btn-sm" onclick="{backToPages}">← Страницы</button>
        </div>
        <h2>${escapeHtml(page?.labelRu ?? this.state.selectedPage)}</h2>
        <p class="text-muted" style="margin:.5rem 0 1rem">Блоки страницы (по порядку отображения).</p>
        ${raw(msgHtml)}
        <div class="article-list">${raw(items)}</div>
      </div>
    `;
  }

  _fieldId (prop) {
    return prop.replace(/[^a-z]/gi, '');
  }

  _renderMlField (prop, vals) {
    const labels = FIELD_LABELS[prop] ?? { ru: prop, en: prop };
    const fid = this._fieldId(prop);
    const isMd = prop === 'site:summary' || prop === 'site:content' || prop === 'v-s:summary';

    if (this.state.preview && isMd) {
      return `
        <div class="form-group">
          <label class="form-label">${labels.ru} / ${labels.en}</label>
          <div class="editor-preview markdown">
            <strong>RU:</strong> ${marked.parse(vals.ru || '')}
            <hr style="margin:.75rem 0">
            <strong>EN:</strong> ${marked.parse(vals.en || '')}
          </div>
        </div>`;
    }

    return `
      <div class="editor-split" style="margin-bottom:.75rem">
        <div class="editor-split__pane">
          <div class="form-group">
            <label class="form-label">${labels.ru}</label>
            <textarea id="field-${fid}-ru" class="form-textarea" rows="${isMd ? 8 : 2}"
              style="${isMd ? 'min-height:120px' : ''}">${escapeHtml(vals.ru)}</textarea>
          </div>
        </div>
        <div class="editor-split__pane">
          <div class="form-group">
            <label class="form-label">${labels.en}</label>
            <textarea id="field-${fid}-en" class="form-textarea" rows="${isMd ? 8 : 2}"
              style="${isMd ? 'min-height:120px' : ''}">${escapeHtml(vals.en)}</textarea>
          </div>
        </div>
      </div>`;
  }

  renderBlockEditor () {
    const meta = this.state.blocks.find((b) => b.id === this.state.selectedBlock);
    const type = meta?.type ?? '';
    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const mlFields = Object.entries(this.state.fields)
      .map(([prop, vals]) => this._renderMlField(prop, vals))
      .join('');

    const strFields = Object.entries(this.state.strFields).map(([prop, val]) => {
      const labels = FIELD_LABELS[prop] ?? { ru: prop, en: prop };
      const fid = this._fieldId(prop);
      return `
        <div class="form-group">
          <label class="form-label">${labels.ru}</label>
          <input id="str-${fid}" class="form-input" type="text" value="${escapeHtml(val)}">
        </div>`;
    }).join('');

    const docItems = this.state.docItems.map((item) => `
      <div class="article-card" style="flex-direction:column;align-items:stretch;gap:.75rem">
        <div class="editor-split">
          <div class="form-group">
            <label class="form-label">Название RU</label>
            <input id="doc-${item.id}-ru" class="form-input" type="text" value="${escapeHtml(item.labelRu)}">
          </div>
          <div class="form-group">
            <label class="form-label">Название EN</label>
            <input id="doc-${item.id}-en" class="form-input" type="text" value="${escapeHtml(item.labelEn)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Файл (site:fileUrl)</label>
          <input id="doc-${item.id}-url" class="form-input" type="text" value="${escapeHtml(item.fileUrl)}">
        </div>
      </div>
    `).join('');

    const unsupported = !ML_FIELDS[type] && type !== 'doc-tabs';

    return html`
      <div class="article-editor">
        <div class="editor-toolbar">
          <h2 class="editor-title">${escapeHtml(meta?.label ?? this.state.selectedBlock)}</h2>
          <div class="editor-toolbar__actions">
            ${raw(!unsupported ? `
              <button class="btn btn-outline btn-sm" onclick="{togglePreview}">
                ${this.state.preview ? '✏️ Редактор' : '👁 Предпросмотр'}
              </button>
              <button class="btn btn-primary btn-sm" onclick="{save}" ${this.state.saving ? 'disabled' : ''}>
                ${this.state.saving ? 'Сохраняю...' : '💾 Сохранить'}
              </button>
            ` : '')}
            <button class="btn btn-outline btn-sm" onclick="{backToBlocks}">← Блоки</button>
          </div>
        </div>
        ${raw(msgHtml)}
        ${raw(unsupported
          ? `<p class="text-muted">Блок типа «${escapeHtml(type)}» редактируется в онтологии или в разделе «Каталог».</p>`
          : `
            ${mlFields}
            ${strFields}
            ${type === 'doc-tabs' ? `<h3 style="margin-top:1.5rem;font-size:.95rem">Вкладки документации</h3>${docItems}` : ''}
          `)}
      </div>
    `;
  }
}
