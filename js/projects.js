/* FULL PROJECT LIST OVERLAY
   Reachable only from the experience slide's entrance button. Open and close
   both run through history so the browser Back button and the BACK control
   are the same code path: the button calls history.back(), and popstate is
   the single place that closes. */
const overlay = document.getElementById("projects-overlay");
const overlayOpenBtn = document.getElementById("exp-more");
const overlayCloseBtn = document.getElementById("projects-close");

const OPEN_CLASS = "projects-open";

function openProjects() {
  if (!overlay || overlay.classList.contains("open")) return;
  overlay.hidden = false;
  /* Two frames, not one. Removing [hidden] and adding .open in the same frame
     gives the browser a single style resolution, so there is no start state to
     transition from and the panel appears instantly. */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => overlay.classList.add("open")),
  );
  document.body.classList.add(OPEN_CLASS);
  if (overlayCloseBtn) overlayCloseBtn.focus();
}

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
  overlayOpenBtn.addEventListener("click", () => {
    history.pushState({ overlay: "projects" }, "", "#projects");
    openProjects();
  });
}

if (overlayCloseBtn) {
  /* Delegates to history so Back and this button cannot diverge. */
  overlayCloseBtn.addEventListener("click", () => history.back());
}

window.addEventListener("popstate", () => {
  if (location.hash === "#projects") {
    openProjects();
  } else {
    closeProjects();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains(OPEN_CLASS)) {
    history.back();
  }
});

/* A reload while the overlay was open lands on #projects. The overlay is
   specified as reachable only through the entrance point, so do not auto-open:
   strip the hash and put the visitor on the experience slide instead. */
if (location.hash === "#projects") {
  history.replaceState(null, "", location.pathname + location.search);
  if (typeof goTo === "function") goTo(2);
}
