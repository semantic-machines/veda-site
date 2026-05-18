import * as esbuild from 'esbuild';
import * as fs from 'fs';
import options from './options.mjs';

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Copy static files
fs.copyFileSync('src/index.html', 'dist/index.html');
fs.copyFileSync('src/ServiceWorker.js', 'dist/ServiceWorker.js');
fs.cpSync('src/css', 'dist/css', { recursive: true });

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

// Update ServiceWorker version for cache busting on deploy
let swContent = fs.readFileSync('dist/ServiceWorker.js', 'utf8');
swContent = swContent.replace(/const VERSION = \d+/, `const VERSION = ${Date.now()}`);
fs.writeFileSync('dist/ServiceWorker.js', swContent);

console.log('Build complete!');
console.log('Run "node deploy.mjs" to copy dist/ to public/site/');
