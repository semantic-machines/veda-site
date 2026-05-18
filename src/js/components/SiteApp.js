import { Component, html } from 'veda-client';
import { initRoutes } from '../routes.js';
import { getSiteConfig } from '../site-config.js';
import NavBar from './NavBar.js';
import Footer from './Footer.js';

customElements.define(NavBar.tag, NavBar);
customElements.define(Footer.tag, Footer);

export default class SiteApp extends Component(HTMLElement) {
  static tag = 'site-app';

  async added () {
    this._onError = (e) => {
      console.error('[veda-site] uncaught error:', e.error ?? e.message);
    };
    this._onRejection = (e) => {
      console.error('[veda-site] unhandled rejection:', e.reason);
    };
    window.addEventListener('error', this._onError);
    window.addEventListener('unhandledrejection', this._onRejection);

    // Pre-load site config so NavBar and PageRenderer share the same cached object.
    await getSiteConfig();

    initRoutes();
  }

  removed () {
    window.removeEventListener('error', this._onError);
    window.removeEventListener('unhandledrejection', this._onRejection);
  }

  render () {
    return html`
      <site-navbar></site-navbar>
      <main id="outlet" class="main-outlet"></main>
      <site-footer></site-footer>
    `;
  }
}
