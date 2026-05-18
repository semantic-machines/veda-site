import { Component } from 'veda-client';
import lang from '../lang.js';
import { getSiteConfig, getCachedConfig } from '../site-config.js';

export default class NavBar extends Component(HTMLElement) {
  static tag = 'site-navbar';

  constructor () {
    super();
    this.state.navItems  = [];
    this.state.logoUrl   = null;
    this.state.lang      = lang.current;
    this.state.page      = lang.page;
    this.state.menuOpen  = false;
  }

  async added () {
    // If config is already cached (SiteApp called getSiteConfig first), use it
    // synchronously; otherwise wait for the load.
    const config = getCachedConfig() ?? await getSiteConfig();

    this.state.logoUrl  = config.logoUrl;
    this.state.navItems = config.mainMenu.items.map((item) => ({
      id:      item.slug ?? item.id,
      slug:    item.slug,
      labelRu: item.labelBi.ru,
      labelEn: item.labelBi.en,
    }));

    // Mirror reactive lang changes into local state
    this.effect(() => {
      this.state.lang = lang.current;
      this.state.page = lang.page;
    });
  }

  toggleMenu () {
    this.state.menuOpen = !this.state.menuOpen;
    this.querySelector('.navbar__nav')?.classList.toggle('open', this.state.menuOpen);
  }

  switchLang (e) {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    // For new pages (p/ prefix) preserve the slug; legacy pages use their id directly
    const currentPage = this.state.page;
    const hash = `#/${btn.dataset.lang}/p/${currentPage}`;
    location.hash = hash;
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

          <a class="navbar__brand" href="#/{state.lang}/p/main">${logoHtml}</a>

          <ul class="navbar__nav" items="{state.navItems}" as="p" key="id">
            <li class="navbar__nav-item">
              <a href="#/{state.lang}/p/{p.slug}"
                 class="{state.page === p.slug ? 'active' : ''}">
                {state.lang === 'en' ? p.labelEn || p.labelRu : p.labelRu}
              </a>
            </li>
          </ul>

          <div class="navbar__lang">
            <button class="navbar__lang-btn {state.lang === 'ru' ? 'active' : ''}"
                    data-lang="ru" onclick="{switchLang}">RU</button>
            <button class="navbar__lang-btn {state.lang === 'en' ? 'active' : ''}"
                    data-lang="en" onclick="{switchLang}">EN</button>
          </div>

          <button class="navbar__toggle" onclick="{toggleMenu}" aria-label="Menu">
            <span class="navbar__toggle-bar"></span>
            <span class="navbar__toggle-bar"></span>
            <span class="navbar__toggle-bar"></span>
          </button>

        </div>
      </nav>
    `;
  }
}
