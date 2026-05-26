import { Component, html } from 'veda-client';

export default class BlockCta extends Component(HTMLElement) {
  static tag = 'block-cta';

  render () {
    return html`
      <section class="page-section block-cta
                       {state.model['site:bgVariant']?.[0] === 'primary' ? 'page-section--primary' : state.model['site:bgVariant']?.[0] === 'dark' ? 'page-section--dark' : state.model['site:bgVariant']?.[0] === 'alt' ? 'page-section--alt' : ''}
                       {state.model['site:cssClass']?.[0] || ''}"
               data-bg="{state.model['site:bgVariant']?.[0] || 'primary'}">
        <div class="container {state.model['site:align']?.[0] === 'center' ? 'text-center' : ''}">
          <h2 class="section-heading" property="site:heading"></h2>
          <site-markdown :model="{state.model}" prop="site:summary" class="markdown"></site-markdown>
          <veda-if condition="{state.model['site:ctaLabel']?.[0] && state.model['site:url']?.[0]}">
            <a href="{state.model['site:url']?.[0]}" class="btn btn-primary block-cta__btn">
              <span property="site:ctaLabel"></span>
            </a>
          </veda-if>
        </div>
      </section>
    `;
  }
}
