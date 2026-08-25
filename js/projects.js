/* DETAIL OVERLAY CONTROLLER - shared by the full-project-list and about-detail
   overlays. Open/close route through history so Back and the BACK control agree. */
const OVERLAYS = [
  {
    hash: "#projects",
    overlay: "projects-overlay",
    open: "exp-more",
    close: "projects-close",
    slide: 2,
  },
  {
    hash: "#about",
    overlay: "about-overlay",
    open: "about-more",
    close: "about-detail-close",
    slide: 3,
  },
];

const OPEN_CLASS = "overlay-open";

/**
 * Builds runtime state for one overlay entry: resolved DOM elements plus
 * open/close functions bound to that entry's hash and history state.
 * @param {{hash: string, overlay: string, open: string, close: string, slide: number}} entry - registry entry
 * @returns {{entry: object, overlayEl: HTMLElement|null, openBtn: HTMLElement|null, closeBtn: HTMLElement|null, open: Function, close: Function}}
 */
function buildOverlay(entry) {
  const overlayEl = document.getElementById(entry.overlay);
  const openBtn = document.getElementById(entry.open);
  const closeBtn = document.getElementById(entry.close);
  /* Own open/close set this synchronously, same instant as before; the .open
     class itself lands two frames later so it can't be read at call time. */
  const state = { isOpen: false };

  /**
   * Reveals this overlay and moves focus into its close button.
   * No-ops if the overlay is missing from the DOM or already open.
   * @returns {void}
   */
  function open() {
    if (!overlayEl || overlayEl.classList.contains("open")) return;
    overlayEl.hidden = false;
    /* Two frames, not one: removing [hidden] and adding .open in the same
       frame leaves no start state to transition from. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => overlayEl.classList.add("open")),
    );
    state.isOpen = true;
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Hides this overlay after its fade-out completes.
   * Returns focus to the button that opened it.
   * @returns {void}
   */
  function close() {
    if (!overlayEl || !overlayEl.classList.contains("open")) return;
    overlayEl.classList.remove("open");
    state.isOpen = false;
    /* Wait out the fade before re-hiding, or [hidden] kills the transition. */
    setTimeout(() => {
      if (!overlayEl.classList.contains("open")) overlayEl.hidden = true;
    }, 300);
    if (openBtn) openBtn.focus();
  }

  return { entry, overlayEl, openBtn, closeBtn, state, open, close };
}

const overlays = OVERLAYS.map(buildOverlay);

/**
 * Sets the shared body class from actual overlay state, never from whichever
 * entry ran last, so it always reflects "is any overlay open".
 * @returns {void}
 */
function syncOpenClass() {
  const anyOpen = overlays.some(({ state }) => state.isOpen);
  document.body.classList.toggle(OPEN_CLASS, anyOpen);
}

overlays.forEach(({ entry, overlayEl, openBtn, closeBtn, open }) => {
  if (openBtn) {
    /**
     * Pushes a history entry for this overlay and opens it.
     * @returns {void}
     */
    openBtn.addEventListener("click", () => {
      history.pushState({ overlay: entry.overlay }, "", entry.hash);
      open();
      syncOpenClass();
    });
  }

  if (closeBtn) {
    /* Delegates to history so Back and this button cannot diverge. */
    closeBtn.addEventListener("click", () => history.back());
  }
});

/**
 * Syncs every overlay's open state to the current history entry: opens the
 * one whose hash matches location.hash, closes all others.
 * @returns {void}
 */
window.addEventListener("popstate", () => {
  overlays.forEach(({ entry, open, close }) => {
    if (location.hash === entry.hash) {
      open();
    } else {
      close();
    }
  });
  syncOpenClass();
});

/**
 * Closes the currently open overlay via history when Escape is pressed.
 * @param {KeyboardEvent} e - the keydown event
 * @returns {void}
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains(OPEN_CLASS)) {
    history.back();
  }
});

/* A reload can land on an overlay hash, but each overlay is reachable only via
   its entrance button, so do not auto-open here - strip the hash instead. */
overlays.forEach(({ entry }) => {
  if (location.hash === entry.hash) {
    history.replaceState(null, "", location.pathname + location.search);
    if (typeof goTo === "function") goTo(entry.slide);
  }
});
