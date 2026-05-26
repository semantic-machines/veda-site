import { Component } from 'veda-client';

export default class BlockHero extends Component(HTMLElement) {
  static tag = 'block-hero';

  render () {
    return `
      <section class="page-section block-hero
                       {state.model['site:bgVariant']?.[0] === 'dark' ? 'page-section--dark' : state.model['site:bgVariant']?.[0] === 'alt' ? 'page-section--alt' : ''}
                       {state.model['site:cssClass']?.[0] || ''}"
               data-bg="{state.model['site:bgVariant']?.[0] || 'default'}">
        <div class="container">
          <div class="section-inner {state.model['v-s:hasImage']?.[0]?.id ? 'section-inner--media' : ''}">
            <div class="section-text">
              <h1 class="page-heading" property="site:heading"></h1>
              <site-markdown :model="{state.model}" prop="site:summary" class="markdown lead"></site-markdown>
              <site-markdown :model="{state.model}" prop="site:content" class="markdown"></site-markdown>
              <veda-if condition="{state.model['site:ctaLabel']?.[0]}">
                <a href="{state.model['site:url']?.[0]}" class="btn btn-primary block-hero__cta">
                  <span property="site:ctaLabel"></span>
                </a>
              </veda-if>
            </div>
            <veda-if condition="{state.model['v-s:hasImage']?.[0]?.id}">
              <div class="block-hero__image">
                <img src="/files/{state.model['v-s:hasImage']?.[0]?.id}" alt=""
                     class="section-img section-img--large">
              </div>
            </veda-if>
          </div>
        </div>
      </section>
    `;
  }
}
