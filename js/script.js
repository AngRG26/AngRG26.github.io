/* CURSOR */
const cur  = document.getElementById('cur');
const curO = document.getElementById('cur-o');
let mx=0, my=0, ox=0, oy=0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx+'px'; cur.style.top = my+'px';
});

(function loop() {
  ox += (mx-ox)*.1; oy += (my-oy)*.1;
  curO.style.left = ox+'px'; curO.style.top = oy+'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, .chip, .nav-logo').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cur.style.width = '12px'; cur.style.height = '12px';
    cur.style.background = 'var(--orange)';
  });
  el.addEventListener('mouseleave', () => {
    cur.style.width = '7px'; cur.style.height = '7px';
    cur.style.background = 'var(--ink)';
  });
});

/* SLIDE ENGINE */
const TOTAL = 4;
let current = 0;
let locked  = false;
let pendingTarget = null;

const wrap   = document.getElementById('wrap');
const progEl = document.getElementById('prog');
const navAs  = document.querySelectorAll('.nav-center a');
const navUnderline = document.querySelector('.nav-underline');

const scIds = [
  [],
  ['sc-sdesc','sc-srows','sc-sword'],
  ['sc-eh','sc-el'],
  ['sc-ctag','sc-ch','sc-cl']
];

function goTo(idx) {
  if (idx < 0 || idx >= TOTAL) return;
  if (locked) {
    pendingTarget = Math.max(0, Math.min(TOTAL - 1, idx));
    return;
  }
  locked = true;
  current = idx;
  render();
  setTimeout(() => {
    locked = false;
    if (pendingTarget !== null && pendingTarget !== current) {
      const next = pendingTarget;
      pendingTarget = null;
      goTo(next);
    } else {
      pendingTarget = null;
    }
  }, 550);
}

function render() {
  wrap.style.transform = `translateX(-${current * 100}vw)`;
  progEl.style.width   = `${(current+1)/TOTAL*100}%`;

  navAs.forEach((a,i) =>
    a.classList.toggle('active', parseInt(a.dataset.slide)===current)
  );

  moveNavUnderline();

  scIds[current].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('in');
    setTimeout(() => el.classList.add('in'), 100 + i * 60);
  });
}

function moveNavUnderline() {
  if (!navUnderline) return;
  const activeA = Array.from(navAs).find(a => parseInt(a.dataset.slide) === current);
  if (!activeA) return;
  navUnderline.style.left  = activeA.offsetLeft + 'px';
  navUnderline.style.width = activeA.offsetWidth + 'px';
}

/* NAV LINKS */
navAs.forEach(a =>
  a.addEventListener('click', () => goTo(parseInt(a.dataset.slide)))
);

/* NAV LOGO (go home) */
const navLogo = document.querySelector('.nav-logo');
if (navLogo) {
  navLogo.addEventListener('click', () => goTo(0));
}

/* NAV UNDERLINE (reposition on font load + resize) */
document.fonts.ready.then(moveNavUnderline);
window.addEventListener('resize', moveNavUnderline);

/* INITIAL PAINT (slide-0 state, incl. #prog width) */
render();

/* KEYBOARD */
document.addEventListener('keydown', e => {
  if (e.key==='ArrowRight'||e.key==='ArrowDown') goTo(current+1);
  if (e.key==='ArrowLeft' ||e.key==='ArrowUp')   goTo(current-1);
});

/* TOUCH */
let tx = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
document.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) dx<0 ? goTo(current+1) : goTo(current-1);
});

/* WHEEL */
let wcd = false;
let pendingWheelTarget = null;
document.addEventListener('wheel', e => {
  let target = null;
  if (e.deltaX>30||e.deltaY>30) target = current+1;
  if (e.deltaX<-30||e.deltaY<-30) target = current-1;
  if (target === null) return;
  target = Math.max(0, Math.min(TOTAL - 1, target));

  if (wcd) {
    pendingWheelTarget = target;
    return;
  }
  wcd = true;
  goTo(target);
  setTimeout(() => {
    wcd = false;
    if (pendingWheelTarget !== null && pendingWheelTarget !== current) {
      const next = pendingWheelTarget;
      pendingWheelTarget = null;
      goTo(next);
    } else {
      pendingWheelTarget = null;
    }
  }, 600);
});

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
