import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const CSS_SRC = 'src/css';

/** @param {{ minify?: boolean }} opts */
export async function buildCss ({ minify = false } = {}) {
  const outDir = 'dist/css';
  fs.mkdirSync(outDir, { recursive: true });

  const entries = fs.readdirSync(CSS_SRC)
    .filter((name) => name.endsWith('.css'))
    .map((name) => path.join(CSS_SRC, name));

  await esbuild.build({
    entryPoints: entries,
    outdir: outDir,
    minify,
    logLevel: 'silent',
  });

  const imgSrc = path.join(CSS_SRC, 'img');
  if (fs.existsSync(imgSrc)) {
    fs.cpSync(imgSrc, path.join(outDir, 'img'), { recursive: true });
  }
}
