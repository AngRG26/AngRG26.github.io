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

/**
 * Slide indices whose reveal cascade has already played this session.
 * First-impression effect only, not a transition - see docs/notes/motion-and-overlay.md.
 * @type {Set<number>}
 */
const revealed = new Set();

/**
 * Per-slide reveal step in ms; .sc objects are collected in DOM order and fire
 * at 100 + GAP + (i - 1) * step - see docs/notes/motion-and-overlay.md.
 * @type {number[]}
 */
const STAGGER = [0, 140, 120, 60];

/**
 * Delay in ms between a slide's first and second reveal object; defaults to STAGGER.
 * Keep entries equal to their STAGGER twin unless deliberately overridden - see docs/notes/motion-and-overlay.md.
 * @type {number[]}
 */
const GAP = [0, 140, 400, 60];

/**
 * Navigates the deck to a slide index, queuing the request if a transition
 * is already in progress.
 * @param {number} idx - target slide index
 * @returns {void}
 */
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

/**
 * Paints the current slide: transform, progress bar, active nav state,
 * and triggers its one-time reveal cascade if it has not already played.
 * @returns {void}
 */
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

/**
 * Repositions the nav underline beneath the currently active nav link.
 * @returns {void}
 */
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
  /**
   * Navigates to the slide this nav link represents.
   * @returns {void}
   */
  a.addEventListener("click", () => goTo(parseInt(a.dataset.slide))),
);

/* NAV LOGO (go home) */
const navLogo = document.querySelector(".nav-logo");
if (navLogo) {
  /**
   * Returns to the hero slide.
   * @returns {void}
   */
  navLogo.addEventListener("click", () => goTo(0));
}

/* HERO SCROLL CUE (go to skills slide) */
const heroScrollCue = document.querySelector(".hero-scroll-cue");
if (heroScrollCue) {
  /**
   * Advances to the skills slide.
   * @returns {void}
   */
  heroScrollCue.addEventListener("click", () => goTo(1));
}

/* NAV UNDERLINE (reposition on font load + resize) */
document.fonts.ready.then(moveNavUnderline);
window.addEventListener("resize", moveNavUnderline);

/* INITIAL PAINT (slide-0 state, incl. #prog width) */
render();

/**
 * Reports whether the project-list overlay is open; deck listeners are bound on
 * document so they still fire while it's open - touchstart is deliberately not guarded (docs/notes/motion-and-overlay.md).
 * @returns {boolean}
 */
function overlayIsOpen() {
  return document.body.classList.contains("projects-open");
}

/* KEYBOARD */
/**
 * Advances or retreats the deck on arrow keys; ignored while the overlay is open.
 * @param {KeyboardEvent} e - the keydown event
 * @returns {void}
 */
document.addEventListener("keydown", (e) => {
  if (overlayIsOpen()) return;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(current + 1);
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(current - 1);
});

/* TOUCH */
let tx = 0;
let ty = 0;
/**
 * Records the touch start coordinates for later swipe-direction detection.
 * @param {TouchEvent} e - the touchstart event
 * @returns {void}
 */
document.addEventListener("touchstart", (e) => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
});
/**
 * Interprets a completed touch gesture as a horizontal swipe and navigates
 * the deck if the gesture is horizontal-dominant enough.
 * @param {TouchEvent} e - the touchend event
 * @returns {void}
 */
document.addEventListener("touchend", (e) => {
  if (overlayIsOpen()) return;
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  // A finger scrolling the vertical skills list drifts sideways easily; require
  // horizontal dominance or a list scroll gets misread as a slide change (docs/notes/input-and-responsive.md).
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
    dx < 0 ? goTo(current + 1) : goTo(current - 1);
});

/**
 * Finds the nearest scrollable ancestor of a target element, if any.
 * @param {HTMLElement} target - the event target to search upward from
 * @returns {HTMLElement|null}
 */
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
/**
 * Translates wheel/trackpad gestures into slide navigation, deferring to
 * an in-slide scrollable list when one can still scroll toward the gesture.
 * @param {WheelEvent} e - the wheel event
 * @returns {void}
 */
document.addEventListener("wheel", (e) => {
  if (overlayIsOpen()) return;
  // Must run before the wheelLocked state machine below, or a list scroll gets
  // recorded as gesture state and poisons the next real navigation wheel (docs/notes/input-and-responsive.md).
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const scrollEl = findScrollableAncestor(e.target);
    if (scrollEl) {
      const scrollingDown = e.deltaY > 0;
      // 1px tolerance: fractional layout means scrollTop never hits the exact max;
      // do not tidy this back to a strict comparison or it traps the user here (docs/notes/input-and-responsive.md).
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
