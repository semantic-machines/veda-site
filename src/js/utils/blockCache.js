/** Module-level cache for loaded block Models, keyed by URI. */
const _cache = new Map();

export const blockCache = {
  set: (id, model) => _cache.set(id, model),
  get: (id) => _cache.get(id) ?? null,
  clear: () => _cache.clear(),
};
