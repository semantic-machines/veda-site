import { marked } from 'marked';

/** GitHub-style heading slug (supports Cyrillic TOC anchors). */
export function headingSlug (text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

marked.use({
  walkTokens (token) {
    if (token.type === 'heading') token.headingId = headingSlug(token.text);
  },
  renderer: {
    heading ({ tokens, depth, headingId }) {
      const inner = this.parser.parseInline(tokens);
      const id    = headingId ? ` id="${headingId}"` : '';
      return `<h${depth}${id}>${inner}</h${depth}>\n`;
    },
  },
});

/**
 * Parse markdown to HTML with heading ids and site path fixes.
 * @param {string} md
 * @param {{ baseUrl?: string }} [opts]
 */
export function parseMarkdown (md, { baseUrl } = {}) {
  let text = md ?? '';
  if (baseUrl) {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    text = text.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, `![$1](${base}$2)`);
  }
  return marked.parse(text).replace(/(href|src)="files\//g, '$1="/files/');
}
