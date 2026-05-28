import * as esbuild from 'esbuild';
import * as fs from 'fs';
import { buildCss } from './cssBuild.mjs';
import options from './options.mjs';
import { buildServiceWorker } from './swBuild.mjs';

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Copy static files
fs.copyFileSync('src/index.html', 'dist/index.html');
await buildCss({ minify: true });

// Copy favicon from site files
const faviconDst = 'dist/css/img';
if (!fs.existsSync(faviconDst)) fs.mkdirSync(faviconDst, { recursive: true });
const faviconSrc = 'files/site/favicon.svg';
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, `${faviconDst}/favicon.svg`);
}

// Copy doc assets (images alongside .md files)
fs.cpSync('src/doc', 'dist/doc', { recursive: true });

// Build JS
await esbuild.build({
  ...options,
  minify: true,
});

buildServiceWorker({ bustCache: true });

console.log('Build complete!');
console.log('Run "node deploy.mjs" to copy dist/ to public/site/');
