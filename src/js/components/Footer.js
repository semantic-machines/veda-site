import { Component, Backend, html } from 'veda-client';
import lang from '../lang.js';
import { parseMLString } from '../utils/mlValue.js';
import { loadModels, loadModelsOrdered } from '../utils/loadModels.js';

function getBiLingual (model, prop) {
  const result = { ru: '', en: '' };
  for (const v of model[prop] ?? []) {
    const { text, lang: l } = parseMLString(String(v));
    if (l === 'RU')      result.ru = result.ru || text;
    else if (l === 'EN') result.en = result.en || text;
    else { result.ru = result.ru || text; result.en = result.en || text; }
  }
  return result;
}

export default class Footer extends Component(HTMLElement) {
  static tag = 'site-footer';

  constructor () {
    super();
    this.state.isAdmin     = false;
    this.state.footerLinks = [];
    this.state.lang        = lang.current;
  }

  get year () {
    return new Date().getFullYear();
  }

  get poweredByText () {
    return this.state.lang === 'en' ? 'Powered by' : 'Работает на';
  }

  get adminLinkText () {
    return this.state.lang === 'en' ? 'Site management' : 'Управление сайтом';
  }

  added () {
    this.effect(() => {
      this.state.lang = lang.current;
      this._syncFooterLinks();
    });
    void this._loadFooterData();
  }

  _syncFooterLinks () {
    if (!this._footerLinksBase) return;
    const l = this.state.lang;
    this.state.footerLinks = this._footerLinksBase.map((item) => ({
      ...item,
      label: l === 'en' ? (item.labelBi.en || item.labelBi.ru) : item.labelBi.ru,
    }));
  }

  async _loadFooterData () {
    const site = this.state.model;

    const menus = await loadModelsOrdered(site?.['site:hasNavMenu'] ?? []);
    const footerMenu = menus.find((m) => m['site:navPosition']?.[0] === 'footer');
    if (footerMenu) {
      const itemMap = await loadModels(footerMenu['site:hasMenuItem'] ?? []);
      const items = (footerMenu['site:hasMenuItem'] ?? [])
        .map((ref) => {
          const item = itemMap.get(ref.id);
          if (!item) return null;
          const pageUri = item['site:targetPage']?.[0]?.id ?? null;
          const extUrl  = item['site:url']?.[0] ?? null;
          return {
            id:      item.id,
            labelBi: getBiLingual(item, 'rdfs:label'),
            order:   item['v-s:order']?.[0] ?? 0,
            hidden:  !!item['v-s:deleted']?.[0],
            pageUri,
            href:    extUrl ?? null,
            external: !pageUri && !!extUrl,
          };
        })
        .filter(Boolean);
      this._footerLinksBase = items
        .filter((i) => !i.hidden && (i.pageUri || i.href))
        .sort((a, b) => a.order - b.order);
      this._syncFooterLinks();
    }

    try {
      const rights = await Backend.get_rights('site:Block');
      const val = rights?.['v-s:canUpdate']?.[0] ?? rights?.['v-s:canCreate']?.[0];
      this.state.isAdmin = val === true || val?.data === true;
    } catch {
      this.state.isAdmin = false;
    }
  }

  post () {
    this.querySelectorAll('a[target="_blank"]').forEach((a) => {
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  render () {
    return html`
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__brand">
            <img src="/files/site:SemanticMachinesLogoLong"
                 alt="Смысловые машины"
                 class="footer__logo"
                 width="200" height="28"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="footer__logo-text" style="display:none">Смысловые машины</span>
          </div>
          <div class="footer__copyright text-muted">
            &copy; {year} Semantic Machines.
            {poweredByText}
            <a href="https://github.com/semantic-machines/veda" target="_blank">Veda</a>.
          </div>
          <ul class="footer__links">
            <veda-loop items="{state.footerLinks}" as="l" key="id">
              <li>
                <veda-if condition="{l.pageUri}">
                  <a href="#/{state.lang}/p/{l.pageUri}">{l.label}</a>
                </veda-if>
                <veda-if condition="{l.external}">
                  <a href="{l.href}" target="_blank">{l.label}</a>
                </veda-if>
              </li>
            </veda-loop>
            <li><a href="https://semantic-machines.com" target="_blank">semantic-machines.com</a></li>
            <veda-if condition="{state.isAdmin}">
              <li><a href="#/cms">{adminLinkText}</a></li>
            </veda-if>
          </ul>
        </div>
      </footer>
    `;
  }
}
