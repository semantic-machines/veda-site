import $ from 'jquery';

export const pre = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  const base = 'https://raw.githubusercontent.com/semantic-machines/veda/master/doc/developer/';
  const re = new RegExp('(!\\[.*\\]\\().*\\/(.*\\))', 'gi');
  return $.get(base + 'dev-doc.md', {_: $.now()}).then(function (doc) {
    doc = doc.replace(re, '$1' + base + '$2');
    template.find('.docs').text(doc);
  });
};

export const post = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  template.on('click', "a[href^='#']", function (e) {
    e.preventDefault();
    const id = decodeURIComponent(this.getAttribute('href')).substring(1);
    const target = document.getElementById(id);
    const bodyRect = document.body.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - bodyRect.top - 10;
    window.scrollTo({
      top: offset,
      behavior: 'auto',
    });
  });
};

export const html = `
  <div>
    <style>
      .docs {
        padding: 0 30px;
        font-size: 0.9em;
      }
      .docs table {
        width: 100%;
        max-width: 100%;
        margin-top: 1em;
        margin-bottom: 2em;
        border: 1px solid #ddd;
      }
      .docs table th,
      .docs table td {
        padding: 0.75rem;
        vertical-align: top;
        border-top: 1px solid #ddd;
        border: 1px solid #ddd;
      }
      .docs table thead th,
      .docs table thead td {
        border-bottom-width: 2px;
      }
      .docs table thead th {
        vertical-align: bottom;
        border-bottom: 2px solid #ddd;
      }
      .docs table tbody + tbody {
        border-top: 2px solid #ddd;
      }
      .docs table tbody tr:nth-of-type(odd) {
        background-color: rgba(0, 0, 0, 0.05);
      }
      .docs img {
        margin-top: 1em;
        border: 1px solid #aaa;
        border-radius: 6px;
      }
    </style>
    <div class="docs markdown"></div>
  </div>
`;
