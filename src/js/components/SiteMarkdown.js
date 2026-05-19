import { Component } from 'veda-client';
import { getMarkdown } from '../utils/blockData.js';

/**
 * Renders a markdown-valued ontology property as HTML.
 * Receives the model via :model="{state.model}" property binding.
 * Specify the property name via the `prop` attribute.
 *
 * Usage:
 *   <site-markdown :model="{state.model}" prop="site:summary" class="markdown"></site-markdown>
 */
export default class SiteMarkdown extends Component(HTMLElement) {
  static tag = 'site-markdown';

  added () {
    const prop = this.getAttribute('prop');
    let first = true;
    this.effect(() => {
      void this.state.model?.[prop]; // track for CCUS reactivity
      if (!first) this.update();
      first = false;
    });
  }

  post () {
    const prop = this.getAttribute('prop');
    this.innerHTML = getMarkdown(this.state.model, prop) || '';
  }

  render () { return ''; }
}
