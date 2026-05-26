import { Component, html } from 'veda-client';
import {
  parseRoute,
  isAppDetail,
  scrollToSection,
  APP_BLOCK,
} from '../utils/pageNav.js';

export default class SiteView extends Component(HTMLElement) {
  static tag = 'site-view';

  constructor () {
    super();
    this.state.route = null;
  }

  async added () {
    const [pageMod, tabsMod] = await Promise.all([
      import('./PageRenderer.js'),
      import('../blocks/BlockTabs.js'),
    ]);
    for (const mod of [pageMod, tabsMod]) {
      if (!customElements.get(mod.default.tag)) {
        customElements.define(mod.default.tag, mod.default);
      }
    }
    this.refresh();
  }

  /** Re-read hash and update outlet content or forward sub-route to page blocks. */
  refresh () {
    const route = parseRoute();
    if (!route) return;
    this.state.route = route;

    if (isAppDetail(route)) {
      void this.update();
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    const pr = this.querySelector('page-renderer');
    if (pr?.getAttribute('about') === route.page) {
      pr.forwardRoute(route);
      if (!route.doc && !route.apps) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    void this.update();
    if (!route.doc && !route.apps) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (route.doc?.section) {
      scrollToSection(route.doc.section);
    }
  }

  render () {
    const route = this.state.route;
    if (!route) return html`<div class="loading">...</div>`;

    if (isAppDetail(route)) {
      const { aspect, item } = route.apps;
      return html`
        <block-tabs about="${APP_BLOCK}"
                    data-apps-aspect="${aspect}"
                    data-apps-item="${item}"></block-tabs>`;
    }

    const docTab = route.doc?.tab ?? '';
    const docSec = route.doc?.section ?? '';
    const appsAsp = route.apps?.aspect ?? '';

    return html`
      <page-renderer about="${route.page}"
                     data-doc-tab="${docTab}"
                     data-doc-section="${docSec}"
                     data-apps-aspect="${appsAsp}"></page-renderer>`;
  }
}
