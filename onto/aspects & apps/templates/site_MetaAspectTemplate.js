import BrowserUtil from '/js/browser/util.js';
import $ from 'jquery';

export const post = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  template.on("click", ".aspect-link", function (e) {
    e.preventDefault();
    var that = $(this);
    var tabId = that.attr("about");
    var tab = $(".active.aspect-link[about='" + BrowserUtil.escape4$(tabId) + "']");
    $([document.documentElement, document.body]).animate({
      scrollTop: tab.offset().top - 20
    }, 400);
  });
};

export const html = `
<div>
  <style>
    .aspect-links {
      display: flex;
      flex-wrap: wrap;
    }
    .aspect-link-group {
      flex-grow: 1;
      border-bottom: 1px solid #333;
    }
    .aspect-link-group * {
      flex-grow: 1;
    }
    .aspect-link-group .btn-link {
      color: #333;
      border-radius: 6px 6px 0 0!important;
    }
    .aspect-link-group .btn-link:hover {
      color: #333;
      text-decoration: underline;
    }
    .aspect-link-group .btn-link.active {
      color: #fff;
      background-color: #333;
      border-color: #333;
      pointer-events: none;
      text-decoration: none;
      text-shadow: 0px 1px 1px black;
    }
    .aspect-link-group .btn-link.active:hover {
      color: #fff;
      text-decoration: underline;
      background-color: #333;
      border-color: #333;
    }
  </style>
  <div about="@" rel="v-s:hasAspect" data-template="site:MetaAspectTemplate_Aspect"></div>
</div>
`;