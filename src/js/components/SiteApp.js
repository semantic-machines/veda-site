import { Component, html } from 'veda-client';
import { initRoutes } from '../routes.js';
import NavBar from './NavBar.js';
import Footer from './Footer.js';

customElements.define(NavBar.tag, NavBar);
customElements.define(Footer.tag, Footer);

export default class SiteApp extends Component(HTMLElement) {
  static tag = 'site-app';

  async added () {
    initRoutes();
  }

  render () {
    return html`
      <site-navbar></site-navbar>
      <main id="outlet" class="main-outlet"></main>
      <site-footer></site-footer>
    `;
  }
}
