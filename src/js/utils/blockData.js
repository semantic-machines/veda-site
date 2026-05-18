import { marked } from 'marked';
import lang from '../lang.js';
import { parseMLString } from './mlValue.js';

function getBiLingual (model, prop) {
  const result = { ru: '', en: '' };
  for (const v of model[prop] ?? []) {
    const { text, lang: l } = parseMLString(String(v));
    if (l === 'RU')      result.ru = result.ru || text;
    else if (l === 'EN') result.en = result.en || text;
    else { result.ru = result.ru || text; result.en = result.en || text; }
  }
  return result;
}

function pickLang (bi) {
  return bi[lang.current] || bi.ru || bi.en || '';
}

/** Return multilingual text value from model property, in current UI language. */
export function getText (model, prop) {
  return pickLang(getBiLingual(model, prop));
}

/** Return rendered Markdown HTML from model property, in current UI language. */
export function getMarkdown (model, prop) {
  const text = getText(model, prop);
  if (!text) return '';
  return marked.parse(text).replace(/(href|src)="files\//g, '$1="/files/');
}

/** Return absolute URL for the first image attached via an object-property. */
export function getFileUrl (model, prop) {
  const ref = model[prop]?.[0];
  return ref?.id ? `/files/${ref.id}` : null;
}

/** Return integer order value (0 if absent). */
export function getOrder (model) {
  return model['v-s:order']?.[0] ?? 0;
}

/** Return string value of a datatype property (first value, no lang processing). */
export function getString (model, prop) {
  return model[prop]?.[0] ?? '';
}
