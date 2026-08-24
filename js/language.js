/* LANGUAGE TOGGLE */
const LANG_KEY   = 'lang';
const langToggle = document.getElementById('lang-toggle');
const langNodes  = document.querySelectorAll('[data-en]');
const langOptions = document.querySelectorAll('.lang-toggle-option');

/* elements whose translated copy contains inline tags (br/strong/span)
   need innerHTML instead of textContent */
const HTML_LANG_IDS = new Set([
  'sc-sdesc', 'sc-eh', 'sc-ah', 'sc-ch'
]);
const HTML_LANG_CLASSES = new Set([
  'hero-role', 'hero-name', 'hero-info-sub', 'hero-scroll-text', 'exp-heading',
  'exp-year', 'exp-desc', 'contact-headline', 'projects-desc', 'about-body'
]);

/**
 * Checks whether an element's translated copy should be injected as HTML.
 * True for ids/classes known to carry inline tags like br or strong.
 * @param {HTMLElement} el - the element carrying data-en/data-ko attributes
 * @returns {boolean}
 */
function usesInnerHTML(el) {
  if (el.id && HTML_LANG_IDS.has(el.id)) return true;
  for (const cls of HTML_LANG_CLASSES) {
    if (el.classList.contains(cls)) return true;
  }
  return false;
}

/**
 * Swaps every data-en/data-ko string on the page to one language.
 * Rewrites innerHTML for tag-bearing elements, textContent otherwise.
 * @param {string} lang - "en" or "ko"
 * @returns {void}
 */
function applyLanguage(lang) {
  langNodes.forEach(el => {
    const value = lang === 'ko' ? el.dataset.ko : el.dataset.en;
    if (value === undefined) return;
    if (usesInnerHTML(el)) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  langOptions.forEach(opt =>
    opt.classList.toggle('active', opt.dataset.langOption === lang)
  );

  document.documentElement.lang = lang;

  moveNavUnderline();
}

/**
 * Applies a language and persists the choice for future visits.
 * @param {string} lang - "en" or "ko"
 * @returns {void}
 */
function setLanguage(lang) {
  applyLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
}

const savedLang = localStorage.getItem(LANG_KEY) === 'ko' ? 'ko' : 'en';
applyLanguage(savedLang);

if (langToggle) {
  /**
   * Flips the current language and applies the opposite one.
   * @returns {void}
   */
  langToggle.addEventListener('click', () => {
    const isKo = document.documentElement.lang === 'ko';
    setLanguage(isKo ? 'en' : 'ko');
  });
}
