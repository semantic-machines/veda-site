import './install_sw.js';
import { Backend, Subscription } from 'veda-client';
import SiteApp from './components/SiteApp.js';

Backend.init();
Subscription.init();

customElements.define(SiteApp.tag, SiteApp);
