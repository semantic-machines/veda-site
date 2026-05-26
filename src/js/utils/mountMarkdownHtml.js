import { rewriteTocLinks } from './pageNav.js';

/**
 * @param {ParentNode} root
 * @param {string} html
 * @param {string} [docTab] - md file basename for TOC link targets
 */
export function mountMarkdownHtml (root, html, docTab) {
  if (!root) return;
  const slot = root.querySelector('[data-md-slot]');
  if (!slot) return;
  slot.innerHTML = html || '';
  if (docTab) rewriteTocLinks(slot, docTab);
}
