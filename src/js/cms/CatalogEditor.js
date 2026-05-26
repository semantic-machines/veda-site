import { Component, Model } from 'veda-client';
import { marked } from 'marked';
import {
  escapeHtml, getBiLingual, setBiLingual, saveModel,
} from './cmsUtils.js';
import { loadModelsOrdered } from '../utils/loadModels.js';

const ASPECT_URI = 'site:BlockApplicationsTabs';

const ASPECT_FIELDS = ['rdfs:label', 'rdfs:comment', 'v-s:shortLabel'];
const APP_FIELDS    = ['rdfs:label', 'rdfs:comment', 'v-s:shortLabel', 'v-s:summary'];

const FIELD_LABELS = {
  'rdfs:label':      'Название',
  'rdfs:comment':    'Подзаголовок',
  'v-s:shortLabel':  'Краткое название',
  'v-s:summary':     'Описание (Markdown)',
};

export default class CatalogEditor extends Component(HTMLElement) {
  static tag = 'cms-catalog-editor';

  constructor () {
    super();
    this.state.aspects = [];
    this.state.apps = [];
    this.state.selectedAspect = null;
    this.state.selectedApp = null;
    this.state.model = null;
    this.state.fields = {};
    this.state.view = 'aspects';
    this.state.editKind = null;
    this.state.preview = false;
    this.state.saving = false;
    this.state.loading = true;
    this.state.message = null;
  }

  async added () {
    try {
      const tabsBlock = new Model(ASPECT_URI);
      await tabsBlock.load();
      const aspectModels = await loadModelsOrdered(tabsBlock['site:hasItem'] ?? []);
      const aspects = aspectModels.map((m) => {
        const label = getBiLingual(m, 'rdfs:label');
        const appCount = (m['site:hasItem'] ?? []).length;
        return {
          id:       m.id,
          labelRu:  label.ru,
          labelEn:  label.en,
          appCount,
          model:    m,
        };
      });
      this.state.aspects = aspects;
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.loading = false;
    }
  }

  async selectAspect (e) {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    const id = el.dataset.id;
    const aspect = this.state.aspects.find((a) => a.id === id);
    if (!aspect) return;

    this.state.message = null;
    this.state.selectedApp = null;
    this.state.model = null;
    this.state.selectedAspect = id;
    this.state.view = 'apps';

    try {
      const m = aspect.model;
      const appModels = await loadModelsOrdered(m['site:hasItem'] ?? []);
      const apps = appModels.map((app) => {
        const label = getBiLingual(app, 'rdfs:label');
        return { id: app.id, labelRu: label.ru, labelEn: label.en, model: app };
      });
      this.state.apps = apps;
    } catch (err) {
      this.state.message = { type: 'error', text: err.message };
    }
    await this.update();
  }

  async selectApp (e) {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    const id = el.dataset.id;

    this.state.message = null;
    this.state.preview = false;

    try {
      const model = new Model(id);
      await model.load();
      this.state.model = model;
      this.state.selectedApp = id;

      this.state.editKind = 'application';
      const fields = {};
      for (const prop of APP_FIELDS) {
        fields[prop] = getBiLingual(model, prop);
      }
      this.state.fields = fields;
      this.state.view = 'edit';
    } catch (err) {
      this.state.message = { type: 'error', text: err.message };
    }
    await this.update();
  }

  async editAspect (e) {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    const id = el.dataset.id;
    this.state.selectedAspect = id;
    this.state.selectedApp = id;
    this.state.view = 'edit';
    this.state.editKind = 'aspect';

    try {
      const model = new Model(id);
      await model.load();
      this.state.model = model;
      const fields = {};
      for (const prop of ASPECT_FIELDS) {
        fields[prop] = getBiLingual(model, prop);
      }
      this.state.fields = fields;
    } catch (err) {
      this.state.message = { type: 'error', text: err.message };
    }
    await this.update();
  }

  backToAspects () {
    this.state.view = 'aspects';
    this.state.selectedAspect = null;
    this.state.selectedApp = null;
    this.state.model = null;
    this.state.apps = [];
    this.update();
  }

  backToApps () {
    this.state.view = 'apps';
    this.state.selectedApp = null;
    this.state.model = null;
    this.update();
  }

  backFromEditor () {
    if (this.state.editKind === 'application') this.backToApps();
    else this.backToAspects();
  }

  _syncFromDom () {
    for (const prop of Object.keys(this.state.fields)) {
      const fid = prop.replace(/[^a-z]/gi, '');
      const ru = this.querySelector(`#cat-${fid}-ru`);
      const en = this.querySelector(`#cat-${fid}-en`);
      if (ru) this.state.fields[prop].ru = ru.value;
      if (en) this.state.fields[prop].en = en.value;
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
      for (const [prop, vals] of Object.entries(this.state.fields)) {
        setBiLingual(this.state.model, prop, vals);
      }
      await saveModel(this.state.model);
      this.state.message = { type: 'success', text: 'Сохранено' };
    } catch (e) {
      this.state.message = { type: 'error', text: e.message };
    } finally {
      this.state.saving = false;
      await this.update();
    }
  }

  _renderFields () {
    return Object.entries(this.state.fields).map(([prop, vals]) => {
      const label = FIELD_LABELS[prop] ?? prop;
      const fid = prop.replace(/[^a-z]/gi, '');
      const isMd = prop === 'v-s:summary';

      if (this.state.preview && isMd) {
        return `
          <div class="form-group">
            <label class="form-label">${label}</label>
            <div class="editor-preview markdown">
              <strong>RU:</strong> ${marked.parse(vals.ru || '')}
              <hr style="margin:.75rem 0">
              <strong>EN:</strong> ${marked.parse(vals.en || '')}
            </div>
          </div>`;
      }

      const rows = isMd ? 10 : 2;
      return `
        <div class="editor-split" style="margin-bottom:.75rem">
          <div class="form-group">
            <label class="form-label">${label} RU</label>
            <textarea id="cat-${fid}-ru" class="form-textarea" rows="${rows}">${escapeHtml(vals.ru)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">${label} EN</label>
            <textarea id="cat-${fid}-en" class="form-textarea" rows="${rows}">${escapeHtml(vals.en)}</textarea>
          </div>
        </div>`;
    }).join('');
  }

  render () {
    if (this.state.loading) return '<div class="loading">Загрузка...</div>';
    if (this.state.view === 'edit') return this.renderEditor();
    if (this.state.view === 'apps') return this.renderAppList();
    return this.renderAspectList();
  }

  renderAspectList () {
    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const items = this.state.aspects.map((a) => `
      <div class="article-card">
        <span class="article-card__title">
          ${escapeHtml(a.labelRu)}
          <span class="text-muted" style="font-weight:400"> — ${a.appCount} прилож.</span>
        </span>
        <div class="article-card__actions">
          <button class="btn btn-outline" data-id="${escapeHtml(a.id)}" onclick="{selectAspect}">Приложения</button>
          <button class="btn btn-outline" data-id="${escapeHtml(a.id)}" onclick="{editAspect}">Аспект</button>
        </div>
      </div>
    `).join('');

    return `
      <div>
        <h2>Каталог приложений</h2>
        <p class="text-muted" style="margin:.5rem 0 1rem">Аспекты и приложения со страницы «Приложения».</p>
        ${msgHtml}
        <div class="article-list">${items}</div>
      </div>
    `;
  }

  renderAppList () {
    const aspect = this.state.aspects.find((a) => a.id === this.state.selectedAspect);
    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const items = this.state.apps.map((a) => `
      <div class="article-card">
        <span class="article-card__title">${escapeHtml(a.labelRu)}</span>
        <div class="article-card__actions">
          <button class="btn btn-outline" data-id="${escapeHtml(a.id)}" onclick="{selectApp}">Редактировать</button>
        </div>
      </div>
    `).join('');

    return `
      <div>
        <button class="btn btn-outline btn-sm" onclick="{backToAspects}" style="margin-bottom:1rem">← Аспекты</button>
        <h2>${escapeHtml(aspect?.labelRu ?? '')}</h2>
        ${msgHtml}
        <div class="article-list">${items}</div>
      </div>
    `;
  }

  renderEditor () {
    const isApp = this.state.editKind === 'application';
    const meta = isApp
      ? this.state.apps.find((a) => a.id === this.state.selectedApp)
      : this.state.aspects.find((a) => a.id === this.state.selectedAspect);

    const msgHtml = this.state.message
      ? `<div class="alert alert-${this.state.message.type}">${escapeHtml(this.state.message.text)}</div>`
      : '';

    const fields = this._renderFields();

    return `
      <div class="article-editor">
        <div class="editor-toolbar">
          <h2 class="editor-title">${escapeHtml(meta?.labelRu ?? this.state.selectedApp)}</h2>
          <div class="editor-toolbar__actions">
            <button class="btn btn-outline btn-sm" onclick="{togglePreview}">
              ${this.state.preview ? '✏️ Редактор' : '👁 Предпросмотр'}
            </button>
            <button class="btn btn-primary btn-sm" onclick="{save}" ${this.state.saving ? 'disabled' : ''}>
              ${this.state.saving ? 'Сохраняю...' : '💾 Сохранить'}
            </button>
            <button class="btn btn-outline btn-sm" onclick="{backFromEditor}">
              ← ${isApp ? 'Приложения' : 'Аспекты'}
            </button>
          </div>
        </div>
        ${msgHtml}
        ${fields}
      </div>
    `;
  }
}
