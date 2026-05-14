import { reactive } from 'veda-client';

const parts = location.hash.slice(1).split('/').filter(Boolean);

const lang = reactive({
  current: parts[0] || (navigator.language.startsWith('ru') ? 'ru' : 'en'),
  page: parts[1] || 'main',
});

export default lang;
