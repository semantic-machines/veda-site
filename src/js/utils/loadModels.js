import { Model, Backend } from 'veda-client';

function toUri (ref) {
  if (typeof ref === 'string') return ref;
  return ref?.id ?? ref?.['@'] ?? null;
}

/**
 * Load multiple models via a single get_individuals request.
 * Skips URIs already present in Model.cache.
 * @param {Array<string|{id?: string, '@'?: string}>} urisOrRefs
 * @returns {Promise<Map<string, Model>>}
 */
export async function loadModels (urisOrRefs) {
  const uris = [...new Set(
    (urisOrRefs ?? []).map(toUri).filter(Boolean)
  )];

  const result = new Map();
  const missing = [];

  for (const uri of uris) {
    const model = new Model(uri);
    if (model.isLoaded()) {
      result.set(uri, model);
    } else {
      missing.push(uri);
    }
  }

  if (missing.length === 0) return result;

  const data = await Backend.get_individuals(missing);
  for (const json of data ?? []) {
    if (!json?.['@']) continue;
    const model = new Model(json);
    result.set(model.id, model);
  }

  for (const uri of missing) {
    if (!result.has(uri)) result.set(uri, new Model(uri));
  }

  return result;
}

/**
 * Like loadModels but preserves input order (duplicates allowed).
 * @param {Array<string|{id?: string, '@'?: string}>} urisOrRefs
 * @returns {Promise<Model[]>}
 */
export async function loadModelsOrdered (urisOrRefs) {
  const ids = (urisOrRefs ?? []).map(toUri).filter(Boolean);
  const map = await loadModels(ids);
  return ids.map((id) => map.get(id)).filter(Boolean);
}
