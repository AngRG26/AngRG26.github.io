/* SLIDE ENGINE */
const TOTAL = 4;
let current = 0;
let locked = false;
let pendingTarget = null;

const wrap = document.getElementById("wrap");
const progEl = document.getElementById("prog");
const navAs = document.querySelectorAll(".nav-center a");
const navUnderline = document.querySelector(".nav-underline");

const slideEls = document.querySelectorAll(".slide");

/* Slides whose reveal has already played. The cascade is a first-impression
   effect, not a transition: replaying it every visit makes the deck feel like
   it is reloading, and on a four-slide deck the visitor crosses the same slide
   several times. Once a slide has revealed, its objects keep .in for the rest
   of the session and re-entry is instant. */
const revealed = new Set();

/* Reveal stagger, in ms, per slide index. Objects marked .sc inside the slide
   are collected in DOM order on arrival and revealed at 100 + i * step.
   Index 0 (hero) has no .sc elements — its four objects animate from CSS
   keyframes with their own delays (css/hero.css) because they play once on
   page load, not on every visit. Index 2 (experience) uses a wider step than
   the rest because its objects are full-width cards; at 60ms the three of them
   read as one block arriving instead of three separate cards.
   Collected by class, not by a hardcoded id list: every .skill-row and
   .exp-item is its own reveal object now (15 across the deck), and keeping
   that many ids in sync between here and index.html by hand is a maintenance
   trap. Anything marked .sc later animates with no change to this file.
   Note .skills-right is deliberately ONE object, not three: .sc sits on the
   wrapper so the three .skill-word lines arrive together. */
const STAGGER = [0, 140, 120, 60];

/* Delay between a slide's FIRST reveal object and its second, in ms.
   Defaults to that slide's STAGGER value, which makes this array inert
   everywhere it is not deliberately overridden: when GAP === STAGGER the
   formula in render() reduces exactly to the original `100 + i * step`.
   Experience (index 2) overrides it to 400. At the old 120ms the heading and
   the first card were 127ms apart (measured) and read as one arrival; 400ms
   lets the heading lead while still overlapping the cards, so the slide
   settles in ~1.3s rather than the ~1.8s a full sequential handoff would
   cost. Keep every other entry equal to its STAGGER twin. */
const GAP = [0, 140, 400, 60];

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
  progEl.style.width = `${((current + 1) / TOTAL) * 100}%`;
  document.body.classList.toggle("on-contact", current === 3);

  navAs.forEach((a, i) =>
    a.classList.toggle("active", parseInt(a.dataset.slide) === current),
  );

  moveNavUnderline();

  if (!revealed.has(current)) {
    revealed.add(current);
    slideEls[current].querySelectorAll(".sc").forEach((el, i) => {
      const delay =
        i === 0 ? 100 : 100 + GAP[current] + (i - 1) * STAGGER[current];
      setTimeout(() => el.classList.add("in"), delay);
    });
  }
}

function moveNavUnderline() {
  if (!navUnderline) return;
  const activeA = Array.from(navAs).find(
    (a) => parseInt(a.dataset.slide) === current,
  );
  if (!activeA) return;
  navUnderline.style.left = activeA.offsetLeft + "px";
  navUnderline.style.width = activeA.offsetWidth + "px";
}

/* NAV LINKS */
navAs.forEach((a) =>
  a.addEventListener("click", () => goTo(parseInt(a.dataset.slide))),
);

/* NAV LOGO (go home) */
const navLogo = document.querySelector(".nav-logo");
if (navLogo) {
  navLogo.addEventListener("click", () => goTo(0));
}

/* HERO SCROLL CUE (go to skills slide) */
const heroScrollCue = document.querySelector(".hero-scroll-cue");
if (heroScrollCue) {
  heroScrollCue.addEventListener("click", () => goTo(1));
}

/* NAV UNDERLINE (reposition on font load + resize) */
document.fonts.ready.then(moveNavUnderline);
window.addEventListener("resize", moveNavUnderline);

/* INITIAL PAINT (slide-0 state, incl. #prog width) */
render();

/* The full-project-list overlay is a sibling of #wrap and covers the whole
   viewport, but the three listeners below are bound on `document`, so they
   still fire while it is open — a wheel gesture over the project list would
   silently flip the deck underneath it. js/projects.js sets this body class;
   reading a class rather than importing a function keeps the two files
   order-independent. touchstart is deliberately NOT guarded: it only records
   coordinates and has no navigation effect. */
function overlayIsOpen() {
  return document.body.classList.contains("projects-open");
}

/* KEYBOARD */
document.addEventListener("keydown", (e) => {
  if (overlayIsOpen()) return;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(current + 1);
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(current - 1);
});

/* TOUCH */
let tx = 0;
let ty = 0;
document.addEventListener("touchstart", (e) => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
});
document.addEventListener("touchend", (e) => {
  if (overlayIsOpen()) return;
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  // Mobile skills slide scrolls vertically now, and a finger scrolling it drifts
  // sideways easily. Require the swipe to actually be horizontal-dominant before
  // treating it as a slide-change gesture, or a list scroll flips the deck.
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
    dx < 0 ? goTo(current + 1) : goTo(current - 1);
});

/* find nearest ancestor (up to body) that is actually scrollable in the Y axis */
function findScrollableAncestor(target) {
  let el =
    target && target.nodeType === 1
      ? target
      : target
        ? target.parentElement
        : null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    ) {
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
document.addEventListener("wheel", (e) => {
  if (overlayIsOpen()) return;
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
        ? scrollEl.scrollHeight - (scrollEl.scrollTop + scrollEl.clientHeight) >
          1
        : scrollEl.scrollTop > 0;
      if (canScrollMore) return;
    }
  }

  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  const absDelta = Math.abs(delta);

  if (wheelLocked) {
    const newGesture =
      absDelta > 30 &&
      (delta > 0 !== lastWheelDelta > 0 ||
        absDelta > Math.abs(lastWheelDelta) * 1.5);
    lastWheelDelta = delta;
    clearTimeout(wheelQuietTimer);
    wheelQuietTimer = setTimeout(() => {
      wheelLocked = false;
      lastWheelDelta = 0;
    }, 150);
    if (newGesture && !locked) {
      goTo(Math.max(0, Math.min(TOTAL - 1, current + (delta > 0 ? 1 : -1))));
    }
    return;
  }

  if (absDelta <= 30) return;
  const target = Math.max(
    0,
    Math.min(TOTAL - 1, current + (delta > 0 ? 1 : -1)),
  );

  wheelLocked = true;
  lastWheelDelta = delta;
  clearTimeout(wheelQuietTimer);
  wheelQuietTimer = setTimeout(() => {
    wheelLocked = false;
    lastWheelDelta = 0;
  }, 150);
  if (locked) return;
  goTo(target);
});
