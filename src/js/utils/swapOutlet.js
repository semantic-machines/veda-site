const SPINNER_DELAY_MS = 200;

let swapGeneration = 0;
let prerenderRoot = null;

/**
 * Pre-render a new outlet view off-screen, then swap it in after `rendered`.
 * Shows a spinner over the current content while waiting.
 */
export async function swapOutlet (outlet, createView) {
  const generation = ++swapGeneration;
  const timer = setTimeout(() => {
    if (generation === swapGeneration) outlet.classList.add('is-pending');
  }, SPINNER_DELAY_MS);
  const spinner = { generation, cancel () { clearTimeout(timer); } };

  if (prerenderRoot?.isConnected) prerenderRoot.remove();

  const prerender = document.createElement('div');
  prerender.className = 'outlet-prerender';
  prerender.setAttribute('aria-hidden', 'true');

  const view = createView();
  prerender.appendChild(view);
  outlet.appendChild(prerender);
  prerenderRoot = prerender;

  try {
    await view.rendered;
    if (generation !== swapGeneration) return;
    prerenderRoot = null;
    outlet.replaceChildren(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } finally {
    if (prerender.isConnected) prerender.remove();
    if (prerenderRoot === prerender) prerenderRoot = null;
    spinner.cancel();
    if (generation === swapGeneration) outlet.classList.remove('is-pending');
  }
}
