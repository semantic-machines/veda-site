import { Component, Backend } from 'veda-client';
import lang from '../lang.js';

const LABELS = {
  privacy:   { ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  poweredBy: { ru: 'Работает на',                 en: 'Powered by' },
  cmsLink:   { ru: 'Управление сайтом',           en: 'Site management' },
};

export default class Footer extends Component(HTMLElement) {
  static tag = 'site-footer';

  constructor () {
    super();
    this.state.isAdmin    = false;
    this.state.poweredBy  = '';
    this.state.privacyTxt = '';
    this.state.privacyHref = '#/';
    this.state.cmsLinkTxt = '';
    this._syncLabels();
  }

  _syncLabels () {
    const l = lang.current;
    this.state.poweredBy   = LABELS.poweredBy[l];
    this.state.privacyTxt  = LABELS.privacy[l];
    this.state.privacyHref = `#/${l}/p/privacy`;
    this.state.cmsLinkTxt  = LABELS.cmsLink[l];
  }

  async added () {
    // Re-sync labels whenever lang changes — reads lang.current so it's tracked
    this.effect(() => this._syncLabels());

    try {
      const rights = await Backend.get_rights('site:Block');
      const val = rights?.['v-s:canUpdate']?.[0] ?? rights?.['v-s:canCreate']?.[0];
      this.state.isAdmin = val === true || val?.data === true;
    } catch {
      this.state.isAdmin = false;
    }
  }

  post () {
    // Set rel="noopener noreferrer" after every render — can't use rel= in template
    // because veda-client treats rel as an RDF relation attribute
    this.querySelectorAll('a[target="_blank"]').forEach((a) => {
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  render () {
    const year = new Date().getFullYear();
    return `
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__brand">
            <img src="/files/site:SemanticMachinesLogoLong"
                 alt="Смысловые машины"
                 class="footer__logo"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="footer__logo-text" style="display:none">Смысловые машины</span>
          </div>
          <div class="footer__copyright text-muted">
            &copy; ${year} Semantic Machines.
            {state.poweredBy}
            <a href="https://github.com/semantic-machines/veda" target="_blank">Veda</a>.
          </div>
          <ul class="footer__links">
            <li><a href="{state.privacyHref}">{state.privacyTxt}</a></li>
            <li><a href="https://semantic-machines.com" target="_blank">semantic-machines.com</a></li>
            ${this.state.isAdmin ? `<li><a href="#/cms">{state.cmsLinkTxt}</a></li>` : ''}
          </ul>
        </div>
      </footer>
    `;
  }
}
