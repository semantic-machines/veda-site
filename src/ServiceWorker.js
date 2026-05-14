const VERSION = 1;
const FILES = `files-${VERSION}`;
const API = `api-${VERSION}`;

const FILES_TO_CACHE = [
  'index.html',
  'index.js',
  'index.js.map',
  'css/main.css',
  'css/layout.css',
];

const API_FNS = [
  '/authenticate',
  '/get_ticket_trusted',
  '/is_ticket_valid',
  '/logout',
  '/get_rights',
  '/get_rights_origin',
  '/get_membership',
  '/get_operation_state',
  '/query',
  '/stored_query',
  '/get_individual',
  '/get_individuals',
  '/remove_individual',
  '/put_individual',
  '/add_to_individual',
  '/set_in_individual',
  '/remove_from_individual',
  '/put_individuals',
  '/watch',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(FILES).then((cache) => {
      return Promise.all(
        FILES_TO_CACHE.map((file) => {
          return cache.add(file).catch((err) => {
            console.error(`Failed to cache ${file}:`, err);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [FILES, API];
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keyList) =>
        Promise.all(
          keyList.map((key) =>
            cacheWhitelist.includes(key) ? undefined : caches.delete(key)
          )
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  const pathname = url.pathname;
  const isAPI = API_FNS.some((fn) => pathname.endsWith(fn));
  if (event.request.method !== 'GET') return;
  if (isAPI) {
    event.respondWith(handleAPI(event, API));
  } else {
    event.respondWith(handleFetch(event, FILES));
  }
});

function handleFetch (event, CACHE) {
  return caches.match(event.request).then((cached) => {
    return cached || fetch(event.request).then((response) => {
      if (response.ok && !cached) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch((e) => console.warn('Cache put failed', e));
      }
      return response;
    });
  });
}

function handleAPI (event, CACHE) {
  const url = new URL(event.request.url);
  url.searchParams.delete('ticket');
  const fn = url.pathname.split('/').pop();
  switch (fn) {
  case 'get_rights':
  case 'get_rights_origin':
  case 'get_membership':
    return fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(url, clone)).catch((e) => console.warn('Cache put failed', e));
        } else if (response.status === 0 || response.status === 503) {
          return caches.match(url).then((cached) => cached || response);
        }
        return response;
      })
      .catch((err) => caches.match(url).then((cached) => (cached || Promise.reject(err))));

  case 'get_individual': {
    const cacheKey = new URL(url);
    cacheKey.searchParams.delete('vsn');
    const hasVsn = url.searchParams.has('vsn');
    if (hasVsn) {
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(cacheKey, clone)).catch((e) => console.warn('Cache put failed', e));
        }
        return response;
      });
    }
    return caches.match(cacheKey).then((cached) => {
      return cached || fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(cacheKey, clone)).catch((e) => console.warn('Cache put failed', e));
          } else if (response.status === 0 || response.status === 503) {
            return cached || response;
          }
          return response;
        })
        .catch((err) => caches.match(cacheKey).then((c) => (c || Promise.reject(err))));
    });
  }

  case 'authenticate':
  case 'get_ticket_trusted':
  case 'is_ticket_valid':
  case 'logout':
  default:
    return fetch(event.request);
  }
}
