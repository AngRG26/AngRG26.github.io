/* LANGUAGE TOGGLE */
const LANG_KEY   = 'lang';
const langToggle = document.getElementById('lang-toggle');
const langNodes  = document.querySelectorAll('[data-en]');
const langOptions = document.querySelectorAll('.lang-toggle-option');

/* elements whose translated copy contains inline tags (br/strong/span)
   need innerHTML instead of textContent */
const HTML_LANG_IDS = new Set([
  'sc-sdesc', 'sc-eh', 'sc-ch'
]);
const HTML_LANG_CLASSES = new Set([
  'hero-role', 'hero-info-sub', 'hero-location-text', 'exp-heading',
  'exp-year', 'exp-desc', 'contact-headline'
]);

function usesInnerHTML(el) {
  if (el.id && HTML_LANG_IDS.has(el.id)) return true;
  for (const cls of HTML_LANG_CLASSES) {
    if (el.classList.contains(cls)) return true;
  }
  return false;
}

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

function setLanguage(lang) {
  applyLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
}

const savedLang = localStorage.getItem(LANG_KEY) === 'ko' ? 'ko' : 'en';
applyLanguage(savedLang);

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const isKo = document.documentElement.lang === 'ko';
    setLanguage(isKo ? 'en' : 'ko');
  });
}
