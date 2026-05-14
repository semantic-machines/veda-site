import { Component, Model } from 'veda-client';
import { marked } from 'marked';
import lang from '../lang.js';

// Parse "text^^RU" / "text^^EN" → { ru, en } plain object
const LANG_RE = /^([\s\S]*)\^\^([A-Za-z]{2})$/;

function biLingual (model, prop) {
  const result = { ru: '', en: '' };
  for (const v of model[prop] ?? []) {
    if (typeof v !== 'string') continue;
    const m = v.match(LANG_RE);
    if (m) {
      const l = m[2].toUpperCase();
      if (l === 'RU') result.ru = result.ru || m[1];
      else if (l === 'EN') result.en = result.en || m[1];
    } else {
      result.ru = result.ru || v;
      result.en = result.en || v;
    }
  }
  return result;
}

function pickLang (bilingual) {
  const l = lang.current;
  return bilingual[l] || bilingual.ru || bilingual.en || '';
}

function mdHtml (bilingual) {
  const text = pickLang(bilingual);
  if (!text) return '';
  return marked.parse(text).replace(/(href|src)="files\//g, '$1="/files/');
}

export default class ApplicationsPage extends Component(HTMLElement) {
  static tag = 'page-applications';

  constructor () {
    super();
    this.state.loading    = true;
    this.state.error      = null;
    this.state.aspects    = [];
    this.state.activeIdx  = 0;
    this.state.activeApps = [];
  }

  async added () {
    try {
      // Article header
      const article = new Model('site:ApplicationsArticle');
      await article.load();
      this._heading     = pickLang(biLingual(article, 'site:heading'));
      this._summaryHtml = mdHtml(biLingual(article, 'site:summary'));
      this._contentHtml = mdHtml(biLingual(article, 'site:content'));
      const imgRef = article['v-s:hasImage']?.[0];
      this._imageUrl = imgRef ? `/files/${imgRef.id}` : null;

      // MetaAspect → aspects → applications (with full detail data)
      const meta = new Model('site:MetaAspect');
      await meta.load();

      const aspects = await Promise.all(
        (meta['v-s:hasAspect'] ?? []).map(async (ref) => {
          const aspect = new Model(ref.id);
          await aspect.load();

          const applications = await Promise.all(
            (aspect['v-s:hasApplication'] ?? []).map(async (appRef) => {
              const app = new Model(appRef.id);
              await app.load();
              const iconRef = app['v-s:hasIcon']?.[0];
              return {
                id:          app.id,
                label:       pickLang(biLingual(app, 'rdfs:label')),
                comment:     pickLang(biLingual(app, 'rdfs:comment')),
                iconUrl:     iconRef ? `/files/${iconRef.id}` : null,
                summaryHtml: mdHtml(biLingual(app, 'v-s:summary')),
                descHtml:    mdHtml(biLingual(app, 'v-s:description')),
              };
            })
          );

          return {
            id:         aspect.id,
            label:      pickLang(biLingual(aspect, 'rdfs:label')),
            shortLabel: pickLang(biLingual(aspect, 'v-s:shortLabel')) || pickLang(biLingual(aspect, 'rdfs:label')),
            applications,
          };
        })
      );

      this.state.aspects    = aspects;
      this.state.activeApps = aspects[0]?.applications ?? [];
      this.state.activeIdx  = 0;
    } catch (e) {
      this.state.error = e.message;
    } finally {
      this.state.loading = false;
    }
  }

  selectAspect (e) {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (isNaN(idx) || idx === this.state.activeIdx) return;
    this.state.activeIdx  = idx;
    this.state.activeApps = this.state.aspects[idx]?.applications ?? [];
  }

  async openApp (e) {
    const card = e.target.closest('[data-app-id]');
    if (!card) return;
    const id  = card.dataset.appId;
    const app = this.state.activeApps.find((a) => a.id === id);
    if (!app) return;
    this._savedScrollY = window.scrollY;   // remember scroll before opening
    this._detailApp = app;
    await this.update();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async closeApp () {
    this._detailApp = null;
    await this.update();
    // Restore scroll after paint so layout is already in place
    requestAnimationFrame(() => {
      window.scrollTo({ top: this._savedScrollY ?? 0, behavior: 'instant' });
    });
  }

  render () {
    if (this.state.loading) return `<div class="loading">...</div>`;
    if (this.state.error) {
      return `<div class="container page-section"><p class="text-muted">${this.state.error}</p></div>`;
    }

    const l = lang.current;
    const backLabel = l === 'ru' ? '← Назад' : '← Back';

    // --- Detail view ---
    if (this._detailApp) {
      const app = this._detailApp;
      return `
        <div class="container page-section">
          <div class="app-detail__header">
            ${app.iconUrl ? `<img src="${app.iconUrl}" alt="" class="app-detail__icon">` : ''}
            <div>
              <h1 class="page-heading">${app.label}</h1>
              ${app.comment ? `<p class="lead text-muted">${app.comment}</p>` : ''}
            </div>
          </div>
          ${app.summaryHtml ? `<div class="markdown app-detail__summary">${app.summaryHtml}</div>` : ''}
          ${app.descHtml    ? `<div class="markdown app-detail__desc">${app.descHtml}</div>`       : ''}
          <button class="btn btn-outline app-detail__back" onclick="{closeApp}">${backLabel}</button>
        </div>
      `;
    }

    // --- List view ---
    const imageBlock = this._imageUrl
      ? `<div class="page-header__image">
           <img src="${this._imageUrl}" alt="" class="section-img">
         </div>`
      : '';

    return `
      <div>
        <div class="container page-section">
          <div class="page-header${this._imageUrl ? ' page-header--media' : ''}">
            <div class="page-header__text">
              ${this._heading    ? `<h1 class="page-heading">${this._heading}</h1>` : ''}
              ${this._summaryHtml ? `<div class="markdown lead">${this._summaryHtml}</div>` : ''}
            </div>
            ${imageBlock}
          </div>
          ${this._contentHtml ? `<div class="markdown">${this._contentHtml}</div>` : ''}
        </div>

        <div class="aspects-section">
          <div class="container">
            <div class="aspects-tabs" items="{state.aspects}" as="aspect" key="id">
              <button class="aspect-tab {state.activeIdx === index ? 'active' : ''}"
                      data-idx="{index}"
                      onclick="{selectAspect}">{aspect.shortLabel}</button>
            </div>

            <h2 class="aspect-title">{state.aspects[state.activeIdx].label}</h2>

            <div class="app-grid" items="{state.activeApps}" as="app" key="id">
              <div class="app-card" data-app-id="{app.id}" onclick="{openApp}">
                <img src="{app.iconUrl}" alt="" class="app-card__icon" loading="lazy">
                <div class="app-card__title">{app.label}</div>
                <div class="app-card__desc">{app.comment}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
