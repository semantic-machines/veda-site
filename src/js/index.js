import './install_sw.js';
import { Backend, Subscription } from 'veda-client';
import SiteApp from './components/SiteApp.js';

Backend.init();
Subscription.init();

// SHA-256 of empty string — guest has no password
const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
try {
  if (!await Backend.is_ticket_valid()) {
    await Backend.authenticate('guest', EMPTY_SHA256);
  }
} catch (e) {
  console.warn('[veda-site] guest auth failed:', e);
}

customElements.define(SiteApp.tag, SiteApp);
