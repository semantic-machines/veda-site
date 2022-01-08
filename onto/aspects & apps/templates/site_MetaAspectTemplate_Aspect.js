import BrowserUtil from '/js/browser/util.js';
import $ from 'jquery';

export const post = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  $(".aspect-link[about='" + BrowserUtil.escape4$(individual.id) + "']", template).addClass('active');
};

export const html = `
  <div>
    <div about="site:MetaAspect" class="container aspect-links">
      <div class="btn-group aspect-link-group">
        <div class="aspect-links" about="@" rel="v-s:hasAspect">
          <a href="#" class="btn btn-link aspect-link" about="@" property="v-s:shortLabel"></a>
        </div>
      </div>
    </div>
    <div class="aspect-container" about="@" data-template="site:AspectTemplate"></div>
  </div>
`;
