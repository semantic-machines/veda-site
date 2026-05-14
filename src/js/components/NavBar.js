import { Component } from 'veda-client';
import lang from '../lang.js';

const NAV_PAGES = [
  { id: 'platform',      label: { ru: 'Платформа',    en: 'Platform' } },
  { id: 'documentation', label: { ru: 'Документация', en: 'Docs' } },
  { id: 'applications',  label: { ru: 'Приложения',   en: 'Applications' } },
  { id: 'services',      label: { ru: 'Услуги',       en: 'Services' } },
  { id: 'price',         label: { ru: 'Цены',         en: 'Price' } },
  { id: 'contacts',      label: { ru: 'Контакты',     en: 'Contacts' } },
];

export default class NavBar extends Component(HTMLElement) {
  static tag = 'site-navbar';

  constructor () {
    super();
    // Static data — put in state so loop can access via {state.navPages}
    this.state.navPages = NAV_PAGES;
    // Initialise from current lang reactive state
    this.state.lang = lang.current;
    this.state.page = lang.page;
  }

  async added () {
    // Mirror external reactive lang → this.state so {expr} bindings update
    this.effect(() => {
      this.state.lang = lang.current;
      this.state.page = lang.page;
    });
  }

  toggleMenu () {
    this.querySelector('.navbar__nav')?.classList.toggle('open');
  }

  switchLang (e) {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    // Navigate — routes.js will update lang.current and lang.page reactively
    location.hash = `#/${btn.dataset.lang}/${this.state.page || 'main'}`;
  }

  render () {
    // Use {expr} so veda-client wraps each binding in its own effect.
    // {state.lang} / {state.page} update only the affected DOM nodes/attributes
    // when lang.current or lang.page changes — no full re-render needed.
    return `
      <nav class="navbar">
        <div class="container navbar__inner">

          <a class="navbar__brand" href="#/{state.lang}/main">
            <img src="/files/site:SemanticMachinesLogoLong"
                 alt="Смысловые машины"
                 class="navbar__logo"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="navbar__logo-text" style="display:none">Смысловые машины</span>
          </a>

          <ul class="navbar__nav" items="{state.navPages}" as="p" key="id">
            <li class="navbar__nav-item">
              <a href="#/{state.lang}/{p.id}"
                 class="{state.page === p.id ? 'active' : ''}">{p.label[state.lang] || p.label.ru}</a>
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
