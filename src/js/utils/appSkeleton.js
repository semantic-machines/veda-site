export function markAppReady () {
  document.querySelector('site-app')?.setAttribute('data-ready', '');
  removeAppSkeleton();
}

export function removeAppSkeleton () {
  const el = document.getElementById('app-skeleton');
  if (!el || el.classList.contains('app-skeleton--out')) return;
  el.classList.add('app-skeleton--out');
  const cleanup = () => el.remove();
  el.addEventListener('transitionend', cleanup, { once: true });
  setTimeout(cleanup, 200);
}
