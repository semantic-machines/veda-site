import { Component, Model } from 'veda-client';
import lang from '../lang.js';
import { parseMLString } from '../utils/mlValue.js';

const CSS_TOKENS = [
  ['colorPrimary',      '--color-primary'],
  ['colorPrimaryHover', '--color-primary-hover'],
  ['colorPrimaryLight', '--color-primary-light'],
  ['colorText',         '--color-text'],
  ['colorTextMuted',    '--color-text-muted'],
  ['colorBg',           '--color-bg'],
  ['colorBgAlt',        '--color-bg-alt'],
  ['fontSans',          '--font-sans'],
];

function injectTokens (site) {
  if (document.getElementById('site-tokens')) return;
  const vars = CSS_TOKENS
    .map(([prop, css]) => {
      const val = site[`site:${prop}`]?.[0];
      return val ? `  ${css}: ${val};` : null;
    })
    .filter(Boolean)
    .join('\n');
  if (vars) {
    const el = document.createElement('style');
    el.id = 'site-tokens';
    el.textContent = `:root {\n${vars}\n}`;
    document.head.prepend(el);
  }
  const customCss = site['site:customCss']?.[0];
  if (customCss && !document.getElementById('site-custom-css')) {
    const el = document.createElement('style');
    el.id = 'site-custom-css';
    el.textContent = customCss;
    document.head.appendChild(el);
  }
}

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

async function loadMenuItems (refs) {
  const items = await Promise.all(
    refs.map(async (ref) => {
      const item = new Model(ref.id);
      await item.load();
      return {
        id:      item.id,
        labelBi: getBiLingual(item, 'rdfs:label'),
        order:   item['v-s:order']?.[0] ?? 0,
        hidden:  !!item['v-s:deleted']?.[0],
        pageUri: item['site:targetPage']?.[0]?.id ?? null,
      };
    })
  );
  return items
    .filter((i) => !i.hidden && i.pageUri)
    .sort((a, b) => a.order - b.order);
}

export default class NavBar extends Component(HTMLElement) {
  static tag = 'site-navbar';

  constructor () {
    super();
    this.state.navItems  = [];
    this.state.homeUri   = '';
    this.state.logoUrl   = null;
    this.state.lang      = lang.current;
    this.state.page      = lang.page;
    this.state.menuOpen  = false;
    this._backdrop       = null;
  }

  _ensureBackdrop () {
    if (this._backdrop) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'navbar__backdrop';
    el.setAttribute('aria-label', 'Close menu');
    el.setAttribute('aria-hidden', 'true');
    el.addEventListener('click', () => this.closeMenu());
    document.body.appendChild(el);
    this._backdrop = el;
  }

  async added () {
    const site = this.state.model;

    injectTokens(site);
    this._ensureBackdrop();

    this.state.logoUrl = site?.['v-s:hasImage']?.[0]?.id
      ? `/files/${site['v-s:hasImage'][0].id}`
      : null;

    const menus = await Promise.all(
      (site?.['site:hasNavMenu'] ?? []).map(async (ref) => {
        const menu = new Model(ref.id);
        await menu.load();
        const items = await loadMenuItems(menu['site:hasMenuItem'] ?? []);
        return { position: menu['site:navPosition']?.[0] ?? 'main', items };
      })
    );

    const mainMenu = menus.find((m) => m.position === 'main') ?? { items: [] };
    this.state.navItems = mainMenu.items.map((item) => ({
      id:      item.pageUri,
      pageUri: item.pageUri,
      labelRu: item.labelBi.ru,
      labelEn: item.labelBi.en,
    }));

    this.state.homeUri = site?.['site:homePage']?.[0]?.id
      ?? mainMenu.items[0]?.pageUri
      ?? '';

    this.effect(() => {
      this.state.lang = lang.current;
      this.state.page = lang.page;
    });

    this.watch(
      () => `${lang.current}/${lang.page}`,
      () => this.closeMenu()
    );
  }

  removed () {
    this._backdrop?.remove();
    this._backdrop = null;
    document.body.classList.remove('navbar-menu-open');
  }

  setMenuOpen (open) {
    this.state.menuOpen = open;
    this._ensureBackdrop();
    document.body.classList.toggle('navbar-menu-open', open);
    this._backdrop.classList.toggle('is-visible', open);
    this._backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  closeMenu () {
    if (this.state.menuOpen) this.setMenuOpen(false);
  }

  toggleMenu (e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    this.setMenuOpen(!this.state.menuOpen);
  }

  onNavClick () {
    this.closeMenu();
  }

  switchLang (e) {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    location.hash = `#/${btn.dataset.lang}/p/${this.state.page}`;
  }

  render () {
    const logoHtml = this.state.logoUrl
      ? `<img src="${this.state.logoUrl}" alt="Смысловые машины" class="navbar__logo"
              onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
         <span class="navbar__logo-text" style="display:none">Смысловые машины</span>`
      : `<span class="navbar__logo-text">Смысловые машины</span>`;

    return `
      <nav class="navbar">
        <div class="container navbar__inner">

          <a class="navbar__brand" href="#/{state.lang}/p/{state.homeUri}">${logoHtml}</a>

          <div class="navbar__menu {state.menuOpen ? 'is-open' : ''}">
            <ul id="site-nav-menu" class="navbar__nav"
                items="{state.navItems}" as="p" key="id">
              <li class="navbar__nav-item">
                <a href="#/{state.lang}/p/{p.pageUri}"
                   class="{state.page === p.pageUri ? 'active' : ''}"
                   onclick="{onNavClick}">
                  {state.lang === 'en' ? p.labelEn || p.labelRu : p.labelRu}
                </a>
              </li>
            </ul>
          </div>

          <div class="navbar__lang">
            <button class="navbar__lang-btn {state.lang === 'ru' ? 'active' : ''}"
                    data-lang="ru" onclick="{switchLang}">RU</button>
            <button class="navbar__lang-btn {state.lang === 'en' ? 'active' : ''}"
                    data-lang="en" onclick="{switchLang}">EN</button>
          </div>

          <button type="button" class="navbar__toggle" onclick="{toggleMenu}"
                  aria-label="Menu" aria-expanded="{state.menuOpen}" aria-controls="site-nav-menu">
            <span class="navbar__toggle-bar"></span>
            <span class="navbar__toggle-bar"></span>
            <span class="navbar__toggle-bar"></span>
          </button>

        </div>
      </nav>
    `;
  }
}
