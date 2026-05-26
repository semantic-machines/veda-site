import { Component, Model, Backend } from 'veda-client';
import lang from '../lang.js';
import { parseMLString } from '../utils/mlValue.js';

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

  added () {
    this.effect(() => { this.state.lang = lang.current; });
    void this._loadFooterData();
  }

  async _loadFooterData () {
    const site = this.state.model;

    // Load footer menu links from the site model
    const menus = await Promise.all(
      (site?.['site:hasNavMenu'] ?? []).map(async (ref) => {
        const menu = new Model(ref.id);
        await menu.load();
        return menu;
      })
    );
    const footerMenu = menus.find((m) => m['site:navPosition']?.[0] === 'footer');
    if (footerMenu) {
      const items = await Promise.all(
        (footerMenu['site:hasMenuItem'] ?? []).map(async (ref) => {
          const item = new Model(ref.id);
          await item.load();
          const pageUri = item['site:targetPage']?.[0]?.id ?? null;
          const extUrl  = item['site:url']?.[0] ?? null;
          return {
            id:      item.id,
            labelBi: getBiLingual(item, 'rdfs:label'),
            order:   item['v-s:order']?.[0] ?? 0,
            hidden:  !!item['v-s:deleted']?.[0],
            href:    pageUri
              ? `#/{lang}/p/${pageUri}`
              : (extUrl ?? null),
            external: !pageUri && !!extUrl,
          };
        })
      );
      this.state.footerLinks = items
        .filter((i) => !i.hidden && i.href)
        .sort((a, b) => a.order - b.order);
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
    const year = new Date().getFullYear();
    const lang = this.state.lang;

    const linkItems = this.state.footerLinks
      .map((l) => {
        const label = lang === 'en' ? (l.labelBi.en || l.labelBi.ru) : l.labelBi.ru;
        const href  = l.href.replace('{lang}', this.state.lang);
        const ext   = l.external ? ' target="_blank"' : '';
        return `<li><a href="${href}"${ext}>${label}</a></li>`;
      })
      .join('');

    const adminLink = this.state.isAdmin
      ? `<li><a href="#/cms">${lang === 'en' ? 'Site management' : 'Управление сайтом'}</a></li>`
      : '';

    return `
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
            &copy; ${year} Semantic Machines.
            ${lang === 'en' ? 'Powered by' : 'Работает на'}
            <a href="https://github.com/semantic-machines/veda" target="_blank">Veda</a>.
          </div>
          <ul class="footer__links">
            ${linkItems}
            <li><a href="https://semantic-machines.com" target="_blank">semantic-machines.com</a></li>
            ${adminLink}
          </ul>
        </div>
      </footer>
    `;
  }
}
