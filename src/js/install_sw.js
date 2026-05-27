if ('serviceWorker' in navigator) {
  // First visit: no controller yet — claim() would fire controllerchange but must not reload.
  // After deploy: controller already exists — reload so the tab picks up the new SW/assets.
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;

  navigator.serviceWorker
    .register('ServiceWorker.js', { scope: './' })
    .catch((err) => console.error('Service worker registration failed', err));

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
