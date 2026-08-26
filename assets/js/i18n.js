/**
 * i18n.js
 * Loads per-language UI dictionaries from /i18n/*.json and applies them
 * to any element carrying a data-i18n="section.key" attribute.
 * Exposes window.i18n so other scripts (main.js) can read the active
 * language and re-render language-dependent data (team, projects).
 */
(function () {
  'use strict';

  const SUPPORTED_LANGS = ['es', 'en', 'val'];
  const DEFAULT_LANG = 'es';

  const state = {
    currentLang: DEFAULT_LANG,
    dictionaries: {},
  };

  function getPath(obj, path) {
    return path
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  async function loadDictionary(lang) {
    if (state.dictionaries[lang]) {
      return state.dictionaries[lang];
    }
    const response = await fetch(`i18n/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Could not load dictionary for "${lang}"`);
    }
    const data = await response.json();
    state.dictionaries[lang] = data;
    return data;
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = getPath(dict, key);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      // Format: data-i18n-attr="aria-label:some.key"
      const pairs = el.getAttribute('data-i18n-attr').split(',');
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const value = getPath(dict, key);
        if (attr && value !== undefined) {
          el.setAttribute(attr, value);
        }
      });
    });

    document.querySelectorAll('.lang-switch button[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === dict.meta.lang);
    });

    document.documentElement.setAttribute('lang', dict.meta.lang === 'val' ? 'ca-valencia' : dict.meta.lang);
  }

  async function setLanguage(lang) {
    const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    const dict = await loadDictionary(safeLang);
    state.currentLang = safeLang;
    applyTranslations(dict);

    const url = new URL(window.location.href);
    url.searchParams.set('lang', safeLang);
    window.history.replaceState({}, '', url);

    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: safeLang, dict } }));
  }

  function detectInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('lang');
    if (fromUrl && SUPPORTED_LANGS.includes(fromUrl)) return fromUrl;

    const nav = (navigator.language || DEFAULT_LANG).toLowerCase();
    if (nav.startsWith('ca') || nav.startsWith('val')) return 'val';
    if (nav.startsWith('en')) return 'en';
    if (nav.startsWith('es')) return 'es';
    return DEFAULT_LANG;
  }

  window.i18n = {
    setLanguage,
    getLang: () => state.currentLang,
    getDict: () => state.dictionaries[state.currentLang],
    supportedLangs: SUPPORTED_LANGS,
  };

  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(detectInitialLang());

    const switchEl = document.getElementById('langSwitch');
    if (switchEl) {
      switchEl.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-lang]');
        if (!btn) return;
        setLanguage(btn.getAttribute('data-lang'));
      });
    }
  });
})();
