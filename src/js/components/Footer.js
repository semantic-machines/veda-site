import { Component, Backend } from 'veda-client';
import lang from '../lang.js';

const LABELS = {
  privacy:   { ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  poweredBy: { ru: 'Работает на',                 en: 'Powered by' },
  license:   { ru: 'Лицензия',                    en: 'License' },
  cmsLink:   { ru: 'Управление сайтом',           en: 'Site management' },
};

export default class Footer extends Component(HTMLElement) {
  static tag = 'site-footer';

  constructor () {
    super();
    this.state.isAdmin = false;
    this.state.lang    = lang.current;
  }

  async added () {
    this.effect(() => { this.state.lang = lang.current; });
    try {
      const rights = await Backend.get_rights('site:Article');
      this.state.isAdmin = rights?.canCreate === true;
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
    const l = this.state.lang;
    const year = new Date().getFullYear();
    const cmsLink = this.state.isAdmin
      ? `<a class="footer__link footer__cms-link" href="#/cms">${LABELS.cmsLink[l]}</a>`
      : '';

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
            ${LABELS.poweredBy[l]}
            <a href="https://github.com/semantic-machines/veda" target="_blank">Veda</a>.
            <!--
            ${LABELS.license[l]}
            <a href="https://www.gnu.org/licenses/gpl.html" target="_blank">GPLv3</a>.
            -->
          </div>
          <ul class="footer__links">
            <li><a href="#/${l}/privacy">${LABELS.privacy[l]}</a></li>
            <li><a href="https://semantic-machines.com" target="_blank">semantic-machines.com</a></li>
            ${this.state.isAdmin ? `<li><a href="#/cms">${LABELS.cmsLink[l]}</a></li>` : ''}
          </ul>
        </div>
      </footer>
    `;
  }
}
