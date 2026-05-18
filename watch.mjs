import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as http from 'http';
import options from './options.mjs';

const BACKEND_HOST = process.env.BACKEND_HOST || 'localhost';
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '8080', 10);

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Copy static files
fs.copyFileSync('src/index.html', 'dist/index.html');
fs.copyFileSync('src/ServiceWorker.js', 'dist/ServiceWorker.js');
fs.cpSync('src/css', 'dist/css', { recursive: true });

// Copy favicon
const faviconDst = 'dist/css/img';
if (!fs.existsSync(faviconDst)) fs.mkdirSync(faviconDst, { recursive: true });
if (fs.existsSync('files/site/favicon.png')) {
  fs.copyFileSync('files/site/favicon.png', `${faviconDst}/favicon.png`);
}

// Copy doc assets (markdown files + images)
fs.cpSync('src/doc', 'dist/doc', { recursive: true });

// Watch for changes in static files
fs.watch('src', { recursive: true }, (eventType, filename) => {
  if (filename?.endsWith('.html')) {
    fs.copyFileSync('src/index.html', 'dist/index.html');
    console.log('Copied index.html');
  }
  if (filename === 'ServiceWorker.js') {
    fs.copyFileSync('src/ServiceWorker.js', 'dist/ServiceWorker.js');
    console.log('Copied ServiceWorker.js');
  }
  if (filename?.endsWith('.css')) {
    fs.cpSync('src/css', 'dist/css', { recursive: true });
    console.log('Copied CSS');
  }
  if (filename?.startsWith('doc/')) {
    fs.cpSync('src/doc', 'dist/doc', { recursive: true });
    console.log('Copied doc assets');
  }
});

// Start esbuild with watch
const ctx = await esbuild.context({
  ...options,
  sourcemap: true,
});

await ctx.watch();

// Simple dev server with SPA fallback and backend proxy
const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] ?? '/';

  // Proxy API and file requests to the Veda backend
  const proxyPrefixes = ['/files/', '/get_individual', '/put_individual', '/authenticate',
                         '/logout', '/query', '/get_rights', '/get_individual'];
  if (proxyPrefixes.some((p) => urlPath.startsWith(p))) {
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxy.on('error', () => { res.writeHead(502); res.end('Bad Gateway'); });
    req.pipe(proxy, { end: true });
    return;
  }

  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  filePath = 'dist' + filePath;

  const ext = filePath.split('.').pop();
  const contentTypes = {
    html:  'text/html',
    js:    'application/javascript',
    css:   'text/css',
    json:  'application/json',
    svg:   'image/svg+xml',
    png:   'image/png',
    jpg:   'image/jpeg',
    webp:  'image/webp',
    woff2: 'font/woff2',
    md:    'text/plain',
  };

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  } catch {
    // SPA fallback
    try {
      const content = fs.readFileSync('dist/index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log('Watching for changes...');
});
