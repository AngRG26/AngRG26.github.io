/* FULL PROJECT LIST OVERLAY - open/close route through history so Back and
   the BACK control share one code path. See docs/notes/motion-and-overlay.md. */
const overlay = document.getElementById("projects-overlay");
const overlayOpenBtn = document.getElementById("exp-more");
const overlayCloseBtn = document.getElementById("projects-close");

const OPEN_CLASS = "projects-open";

/**
 * Reveals the full-project-list overlay and moves focus into it.
 * No-ops if the overlay is missing from the DOM or already open.
 * @returns {void}
 */
function openProjects() {
  if (!overlay || overlay.classList.contains("open")) return;
  overlay.hidden = false;
  /* Two frames, not one: removing [hidden] and adding .open in the same frame
     leaves no start state to transition from (docs/notes/motion-and-overlay.md). */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => overlay.classList.add("open")),
  );
  document.body.classList.add(OPEN_CLASS);
  if (overlayCloseBtn) overlayCloseBtn.focus();
}

/**
 * Hides the full-project-list overlay after its fade-out completes.
 * Returns focus to the button that opened it.
 * @returns {void}
 */
function closeProjects() {
  if (!overlay || !overlay.classList.contains("open")) return;
  overlay.classList.remove("open");
  document.body.classList.remove(OPEN_CLASS);
  /* Wait out the fade before re-hiding, or [hidden] kills the transition. */
  setTimeout(() => {
    if (!overlay.classList.contains("open")) overlay.hidden = true;
  }, 300);
  if (overlayOpenBtn) overlayOpenBtn.focus();
}

if (overlayOpenBtn) {
  /**
   * Pushes a history entry for the overlay and opens it.
   * @returns {void}
   */
  overlayOpenBtn.addEventListener("click", () => {
    history.pushState({ overlay: "projects" }, "", "#projects");
    openProjects();
  });
}

if (overlayCloseBtn) {
  /**
   * Closes the overlay by stepping back in history.
   * @returns {void}
   */
  /* Delegates to history so Back and this button cannot diverge. */
  overlayCloseBtn.addEventListener("click", () => history.back());
}

/**
 * Syncs the overlay's open state to the current history entry.
 * @returns {void}
 */
window.addEventListener("popstate", () => {
  if (location.hash === "#projects") {
    openProjects();
  } else {
    closeProjects();
  }
});

/**
 * Closes the overlay via history when Escape is pressed while it is open.
 * @param {KeyboardEvent} e - the keydown event
 * @returns {void}
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains(OPEN_CLASS)) {
    history.back();
  }
});

/* A reload lands on #projects, but the overlay is reachable only via its entrance
   button, so do not auto-open here - strip the hash instead (docs/notes/motion-and-overlay.md). */
if (location.hash === "#projects") {
  history.replaceState(null, "", location.pathname + location.search);
  if (typeof goTo === "function") goTo(2);
}
