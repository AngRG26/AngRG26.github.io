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
  ['sc-ch','sc-cl']
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
  document.body.classList.toggle('on-contact', current === 3);

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

/* HERO SCROLL CUE (go to skills slide) */
const heroScrollCue = document.querySelector('.hero-scroll-cue');
if (heroScrollCue) {
  heroScrollCue.addEventListener('click', () => goTo(1));
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
let ty = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; });
document.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  // Mobile skills slide scrolls vertically now, and a finger scrolling it drifts
  // sideways easily. Require the swipe to actually be horizontal-dominant before
  // treating it as a slide-change gesture, or a list scroll flips the deck.
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx<0 ? goTo(current+1) : goTo(current-1);
});

/* find nearest ancestor (up to body) that is actually scrollable in the Y axis */
function findScrollableAncestor(target) {
  let el = target && target.nodeType === 1 ? target : (target ? target.parentElement : null);
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/* WHEEL */
let wheelLocked = false;
let wheelQuietTimer = null;
let lastWheelDelta = 0;
document.addEventListener('wheel', e => {
  // On mobile-width layouts (<=768px, which also includes a narrowed desktop
  // window) .skills-inner is its own scroll container. If the wheel is over it
  // and it still has room to scroll toward the gesture's direction, let the
  // browser scroll the list instead of hijacking the event for deck navigation.
  // Must run before the wheelLocked state machine below, so a list scroll never
  // gets recorded as gesture state and poison the next real navigation wheel.
  // Only guard vertical-dominant gestures: the deck also navigates on horizontal
  // wheel/trackpad deltas (see the `delta` calc below), and those have nothing to
  // do with the list's vertical scroll position.
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const scrollEl = findScrollableAncestor(e.target);
    if (scrollEl) {
      const scrollingDown = e.deltaY > 0;
      // 1px tolerance: fractional layout means scrollTop never reaches the exact
      // scrollHeight - clientHeight maximum (e.g. 72.8 vs 73), so a strict "<"
      // check here never releases the wheel and traps the user on this slide.
      // Do not "tidy" this back to a strict comparison.
      const canScrollMore = scrollingDown
        ? scrollEl.scrollHeight - (scrollEl.scrollTop + scrollEl.clientHeight) > 1
        : scrollEl.scrollTop > 0;
      if (canScrollMore) return;
    }
  }

  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  const absDelta = Math.abs(delta);

  if (wheelLocked) {
    const newGesture = absDelta > 30 && (
      (delta > 0) !== (lastWheelDelta > 0) || absDelta > Math.abs(lastWheelDelta) * 1.5
    );
    lastWheelDelta = delta;
    clearTimeout(wheelQuietTimer);
    wheelQuietTimer = setTimeout(() => { wheelLocked = false; lastWheelDelta = 0; }, 150);
    if (newGesture && !locked) {
      goTo(Math.max(0, Math.min(TOTAL - 1, current + (delta > 0 ? 1 : -1))));
    }
    return;
  }

  if (absDelta <= 30) return;
  const target = Math.max(0, Math.min(TOTAL - 1, current + (delta > 0 ? 1 : -1)));

  wheelLocked = true;
  lastWheelDelta = delta;
  clearTimeout(wheelQuietTimer);
  wheelQuietTimer = setTimeout(() => { wheelLocked = false; lastWheelDelta = 0; }, 150);
  if (locked) return;
  goTo(target);
});
