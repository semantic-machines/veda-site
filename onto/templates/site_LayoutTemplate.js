import BrowserUtil from '/js/browser/util.js';
import $ from 'jquery';
import riot from 'riot';
import marked from 'marked';

export const pre = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  document.title = 'Смысловые машины';

  // Markdown
  const main = document;
  const observer = new MutationObserver(function (mutations, observer) {
    const lastMutation = mutations.pop();
    processMain(lastMutation);
  });
  const mainConfig = {childList: true, subtree: true};
  const markdownConfig = {childList: true};
  observer.observe(main, mainConfig);
  template.one('remove', function () {
    observer.disconnect();
  });
  function processMain (mutation) {
    const target = $(mutation.target);
    const markdown = target.find('.markdown:not(.observed)');
    markdown.each(function () {
      this.classList.add('observed');
      const text = this.textContent;
      this.innerHTML = marked(text, {sanitize: false, breaks: true});
      const markdownObserver = new MutationObserver(function (mutations, observer) {
        const lastMutation = mutations.pop();
        processMarkdown(lastMutation, observer);
      });
      markdownObserver.observe(this, markdownConfig);
      $(this).one('remove', function () {
        markdownObserver.disconnect();
      });
    });
  }
  function processMarkdown (mutation, observer) {
    observer.disconnect();
    const target = mutation.target;
    const text = target.textContent;
    target.innerHTML = marked(text);
    observer.observe(target, markdownConfig);
  }
};

export const post = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  // Mark active item
  riot.route(markActive);
  function markActive (hash) {
    const page = hash.slice(2);
    $('.nav-pages', template)
      .children()
      .removeClass('active')
      .filter("[resource='" + BrowserUtil.escape4$(page) + "']")
      .addClass('active');
  }
};

export const html = `
  <div class="page">
    <style>
      body {
        font-size: 16px;
        line-height: 1.7em;
      }
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        font-weight: 400;
      }
      h1 {
        font-size: 2.25em;
      }
      h2 {
        font-size: 1.75em;
      }
      h3 {
        font-size: 1.5em;
      }
      h4 {
        font-size: 1.25em;
      }
      h5 {
        font-size: 1em;
      }
      h6 {
        font-size: 0.75em;
      }
      .page-header {
        border-bottom: 1px solid #eee;
      }
      .page-sheet {
        padding: 30px !important;
      }
      #main {
        margin: 20px 0 100px 0;
      }
      .nav.navbar-nav > li.active {
        background-color: #eee;
      }
      .nav.navbar-nav > li > a:hover {
        background-color: #f8f8f8 !important;
      }
      em {
        font-style: italic !important;
        font-weight: normal !important;
      }
      .vcenter {
        display: inline-block;
        vertical-align: middle;
        float: none;
      }
      img[src*='#left'] {
        float: left;
      }
      img[src*='#right'] {
        float: right;
      }
      img[src*='#center'] {
        display: block;
        margin: auto;
      }
      img {
        max-width: 100%;
      }
    </style>
    <nav role="navigation" class="navbar navbar-veda navbar-fixed" style="background-color: #fff; border-bottom: 2px solid #ddd; margin-bottom:15px;">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="btn btn-default navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
            <span class="glyphicon glyphicon-menu-hamburger"></span>
          </button>
          <a
            style="width:300px;margin-top:-10px;"
            class="navbar-brand"
            href="#/site:Main"
            about="site:SemanticMachinesLogoLong"
            data-template="v-ui:ImageTemplate"></a>
          <small
            style="margin-top:5px;font-weight:200; font-size: 1em;"
            class="navbar-brand text-muted"
            class="pull-left"
            about="site:Slogan"
            property="rdfs:label"></small>
        </div>
        <div class="collapse navbar-collapse" id="navbar-collapse">
          <ul class="nav navbar-nav navbar-right" style="margin-left:15px;">
            <li about="v-ui:AvailableLanguage" data-template="v-ui:LanguageSwitchTemplate" data-switch-behavior="radio"></li>
          </ul>
          <ul class="nav navbar-nav navbar-right nav-pages" about="site:Main" rel="site:hasPage">
            <li about="@"><a about="@" href="#/@" property="rdfs:label"></a></li>
          </ul>
        </div>
      </div>
    </nav>

    <div id="main"></div>

    <nav id="copyright" class="navbar-fixed-bottom container clearfix">
      <div class="pull-left text-muted">
        <a href="#/site:ConfidentialArticle" about="site:ConfidentialArticle" property="rdfs:label"></a>
      </div>
      <div class="pull-right text-muted">
        <span about="v-s:PoweredBy" property="rdfs:label"></span>
        <a about="v-s:VedaPlatform" property="rdfs:label" href="https://github.com/semantic-machines/veda"></a>. &copy;
        <a href="https://semantic-machines.com" about="v-s:SemanticMachines" property="rdfs:label"></a>.
        <span about="v-s:License" property="rdfs:label"></span>
        <a alt="GNU General Public License version 3 official text" href="http://www.gnu.org/licenses/gpl.html">GPLv3.</a>
      </div>
    </nav>
  </div>
`;
