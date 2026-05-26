import { reactive } from 'veda-client';

const parts = location.hash.slice(1).split('/').filter(Boolean);

function initialPageFromHash () {
  if (parts[1] === 'p' && parts[2]) return decodeURIComponent(parts[2]);
  return '';
}

const lang = reactive({
  current: parts[0] || (navigator.language.startsWith('ru') ? 'ru' : 'en'),
  page:    initialPageFromHash(),
});

export default lang;
