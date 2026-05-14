if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('ServiceWorker.js', { scope: './' })
    .catch((err) => console.error('Service worker registration failed', err));

  // Auto-reload when a new SW activates and claims this client.
  // Works because ServiceWorker.js calls skipWaiting() + clients.claim().
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
