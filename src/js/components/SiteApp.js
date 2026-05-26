import { Model, Component, html } from 'veda-client';
import { initRoutes } from '../routes.js';
import NavBar from './NavBar.js';
import Footer from './Footer.js';
import SiteMarkdown from './SiteMarkdown.js';

customElements.define(NavBar.tag, NavBar);
customElements.define(Footer.tag, Footer);
customElements.define(SiteMarkdown.tag, SiteMarkdown);

export default class SiteApp extends Component(HTMLElement) {
  static tag = 'site-app';

  constructor () {
    super();
    this.state.model = new Model('site:VedaSite');
  }

  added () {
    this._onError = (e) => {
      console.error('[veda-site] uncaught error:', e.error ?? e.message);
    };
    this._onRejection = (e) => {
      console.error('[veda-site] unhandled rejection:', e.reason);
    };
    window.addEventListener('error', this._onError);
    window.addEventListener('unhandledrejection', this._onRejection);

    const site = this.state.model;
    const hasHash = !!location.hash;

    if (hasHash) {
      initRoutes(null);
      void site.load().catch(() => {});
      return;
    }

    void site.load()
      .catch(() => {})
      .finally(() => {
        const homeUri = site['site:homePage']?.[0]?.id
          ?? site['site:hasPage']?.[0]?.id
          ?? null;
        initRoutes(homeUri);
      });
  }

  removed () {
    window.removeEventListener('error', this._onError);
    window.removeEventListener('unhandledrejection', this._onRejection);
  }

  render () {
    return html`
      <site-navbar about="{this.state.model.id}"></site-navbar>
      <main id="outlet" class="main-outlet"></main>
      <site-footer about="{this.state.model.id}"></site-footer>
    `;
  }
}
