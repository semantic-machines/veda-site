if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('ServiceWorker.js', { scope: './' })
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('Доступна новая версия сайта. Обновить сейчас?')) {
              window.location.reload();
            }
          }
        });
      });
    })
    .catch((err) => console.error('Service worker registration failed', err));
}
