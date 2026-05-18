import { Backend } from 'veda-client';
import { parseMLString } from '../utils/mlValue.js';

export function escapeHtml (s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Read bilingual values from a model property. */
export function getBiLingual (model, prop) {
  const result = { ru: '', en: '' };
  for (const v of model[prop] ?? []) {
    const { text, lang } = parseMLString(String(v));
    if (lang === 'RU')      result.ru = result.ru || text;
    else if (lang === 'EN') result.en = result.en || text;
    else { result.ru = result.ru || text; result.en = result.en || text; }
  }
  return result;
}

/** Write bilingual values back onto a model property. */
export function setBiLingual (model, prop, { ru, en }) {
  const values = [];
  if (ru) values.push(`${ru}^^RU`);
  if (en) values.push(`${en}^^EN`);
  model[prop] = values.length ? values : null;
}

export function getStringProp (model, prop) {
  return model[prop]?.[0] ?? '';
}

export function setStringProp (model, prop, value) {
  model[prop] = value ? [value] : null;
}

/** Check whether the current user can edit site content. */
export async function checkCmsAccess () {
  try {
    const rights = await Backend.get_rights('site:Block');
    const r = rights?.['v-s:canUpdate'] ?? rights?.['v-s:canCreate'];
    const val = r?.[0];
    if (val === true) return true;
    if (val?.data === true) return true;
    return false;
  } catch {
    return false;
  }
}

export async function saveModel (model) {
  await Backend.put_individual(model.toJSON());
}
