import { Component } from 'veda-client';

export default class BlockText extends Component(HTMLElement) {
  static tag = 'block-text';

  render () {
    return `
      <section class="page-section
                       {state.model['site:bgVariant']?.[0] === 'alt' ? 'page-section--alt' : ''}
                       {state.model['site:cssClass']?.[0] || ''}"
               data-bg="{state.model['site:bgVariant']?.[0] || 'default'}">
        <div class="container">
          <div class="section-inner {state.model['v-s:hasImage']?.[0]?.id ? 'section-inner--media' : ''}">
            <div class="section-text">
              <h2 class="section-heading" property="site:heading"></h2>
              <site-markdown :model="{state.model}" prop="site:summary" class="markdown section-summary"></site-markdown>
              <site-markdown :model="{state.model}" prop="site:content" class="markdown"></site-markdown>
            </div>
            <veda-if condition="{state.model.hasValue('v-s:hasImage')}">
              <div class="section-media">
                <img :src="/files/{state.model['v-s:hasImage']?.[0]?.id}" alt="" class="section-img">
              </div>
            </veda-if>
          </div>
        </div>
      </section>
    `;
  }
}
