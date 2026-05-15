import lang from '../lang.js';

const LANG_SUFFIX_RE = /^([\s\S]*)\^\^([A-Za-z]{2})$/;

/**
 * Parse a veda-client Value string like "text^^RU" → { text, lang } or { text, lang: null }.
 */
export function parseMLString (v) {
  if (typeof v !== 'string') return { text: String(v ?? ''), lang: null };
  const m = v.match(LANG_SUFFIX_RE);
  return m ? { text: m[1], lang: m[2].toUpperCase() } : { text: v, lang: null };
}

/**
 * Return the value of article[prop] that matches the current UI language.
 * Falls back to an untagged value, then to the first available value.
 */
export function getLangValue (article, prop) {
  const l = lang.current.toUpperCase();
  const values = article[prop];
  if (!values?.length) return '';
  const match =
    values.find((v) => parseMLString(v).lang === l) ??
    values.find((v) => parseMLString(v).lang === null) ??
    values[0];
  return parseMLString(match).text;
}
