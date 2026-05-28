import * as fs from 'fs';
import * as path from 'path';

const SW_NAME = 'ServiceWorker.js';
const DIST = 'dist';

/** @param {string} dir @param {string} [base] */
function listDistFiles (dir, base = '') {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      files.push(...listDistFiles(full, rel));
    } else if (rel !== SW_NAME && !rel.endsWith('.map')) {
      files.push(rel);
    }
  }
  return files.sort();
}

/** @param {{ bustCache?: boolean }} opts */
export function buildServiceWorker ({ bustCache = false } = {}) {
  const files = listDistFiles(DIST);
  const arrayStr = files.map((file) => `  '${file}',`).join('\n');

  let content = fs.readFileSync(`src/${SW_NAME}`, 'utf8');
  if (bustCache) {
    content = content.replace(/const VERSION = \d+/, `const VERSION = ${Date.now()}`);
  }
  content = content.replace(
    /const FILES_TO_CACHE = \[[\s\S]*?\];/,
    `const FILES_TO_CACHE = [\n${arrayStr}\n];`,
  );
  fs.writeFileSync(`${DIST}/${SW_NAME}`, content);
}
