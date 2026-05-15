/**
 * Single source of truth for all site pages.
 *
 * Adding a new page requires:
 *  1. Add an entry here.
 *  2. Create the component file.
 *
 * Everything else — routing, nav, CMS — picks it up automatically.
 *
 * Fields:
 *  id         — route segment (e.g. "platform" → #/ru/platform)
 *  label      — { ru, en } display name used in NavBar and CMS
 *  showInNav  — true → page appears in the navbar menu
 *  pageUri    — ontology URI managed by PageManager (show/hide in CMS)
 *  load       — dynamic import of the component module
 *  articles   — editable content units shown in ArticleEditor
 */
export const PAGE_REGISTRY = [

  // ── Technical pages: routable, not in nav, not in PageManager ─────────────

  {
    id: 'main',
    load: () => import('./components/MainPage.js'),
    articles: [
      { uri: 'site:AboutMainArticle',        label: 'Главная — О компании (секция)' },
      { uri: 'site:PlatformMainArticle',     label: 'Главная — Платформа (секция)' },
      { uri: 'site:ApplicationsMainArticle', label: 'Главная — Приложения (секция)' },
      { uri: 'site:ServicesMainArticle',     label: 'Главная — Услуги (секция)' },
      { uri: 'site:ContactsMainArticle',     label: 'Главная — Контакты (секция)' },
    ],
  },

  {
    id: 'privacy',
    load: () => import('./components/PrivacyPage.js'),
    articles: [{ uri: 'site:ConfidentialArticle', label: 'Политика конфиденциальности' }],
  },

  // ── Nav pages: shown in NavBar, can be hidden via PageManager ─────────────
  // Order here = order in the navbar menu.

  {
    id: 'platform',
    label: { ru: 'Платформа', en: 'Platform' },
    showInNav: true,
    pageUri: 'site:Platform',
    load: () => import('./components/PlatformPage.js'),
    articles: [{ uri: 'site:PlatformArticle', label: 'Страница: Платформа' }],
  },

  {
    id: 'documentation',
    label: { ru: 'Документация', en: 'Docs' },
    showInNav: true,
    pageUri: 'site:Documentation',
    load: () => import('./components/DocumentationPage.js'),
    articles: [{ uri: 'site:DeveloperGuide', label: 'Страница: Документация' }],
  },

  {
    id: 'applications',
    label: { ru: 'Приложения', en: 'Applications' },
    showInNav: true,
    pageUri: 'site:Applications',
    load: () => import('./components/ApplicationsPage.js'),
    articles: [{ uri: 'site:ApplicationsArticle', label: 'Страница: Приложения' }],
  },

  {
    id: 'services',
    label: { ru: 'Услуги', en: 'Services' },
    showInNav: true,
    pageUri: 'site:Services',
    load: () => import('./components/ServicesPage.js'),
    articles: [{ uri: 'site:ServicesArticle', label: 'Страница: Услуги' }],
  },

  {
    id: 'price',
    label: { ru: 'Цены', en: 'Price' },
    showInNav: true,
    pageUri: 'site:Price',
    load: () => import('./components/PricePage.js'),
    articles: [{ uri: 'site:PriceArticle', label: 'Страница: Цены' }],
  },

  {
    id: 'contacts',
    label: { ru: 'Контакты', en: 'Contacts' },
    showInNav: true,
    pageUri: 'site:Contacts',
    load: () => import('./components/ContactsPage.js'),
    articles: [{ uri: 'site:ContactsArticle', label: 'Страница: Контакты' }],
  },

  // ── Extra pages: routable and in PageManager, but not in NavBar ───────────

  {
    id: 'about',
    label: { ru: 'О компании', en: 'About' },
    pageUri: 'site:About',
    load: () => import('./components/AboutPage.js'),
    articles: [{ uri: 'site:AboutArticle', label: 'Страница: О компании' }],
  },

  {
    id: 'download',
    label: { ru: 'Скачать', en: 'Download' },
    pageUri: 'site:Download',
    load: () => import('./components/DownloadPage.js'),
    articles: [{ uri: 'site:DownloadArticle', label: 'Страница: Скачать' }],
  },

];

// ── Derived lookups (computed once at module load) ─────────────────────────

/** id → lazy loader, used by the router */
export const PAGE_LOADERS = Object.fromEntries(
  PAGE_REGISTRY.map((p) => [p.id, p.load]),
);

/** Pages shown in the NavBar menu, in display order */
export const NAV_PAGES = PAGE_REGISTRY.filter((p) => p.showInNav);

/** Pages manageable in the CMS PageManager (have an ontology individual URI) */
export const CMS_PAGES = PAGE_REGISTRY.filter((p) => p.pageUri);

/** Flat list of all articles editable in ArticleEditor */
export const ALL_ARTICLES = PAGE_REGISTRY.flatMap((p) => p.articles ?? []);
