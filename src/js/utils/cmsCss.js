let cmsCssLoaded = false;

export function ensureCmsCss () {
  if (cmsCssLoaded) return;
  cmsCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/cms.css';
  document.head.appendChild(link);
}
