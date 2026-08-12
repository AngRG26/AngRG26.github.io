/* CURSOR */
/**
 * True on touch devices (no mouse); gates the whole custom-cursor setup below
 * so the rAF loop never starts. Same capability check as cursor.css - see docs/notes/input-and-responsive.md.
 * @type {boolean}
 */
const isTouch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

if (!isTouch) {
  const cur  = document.getElementById('cur');
  const curO = document.getElementById('cur-o');
  let mx=0, my=0, ox=0, oy=0;

  /**
   * Tracks the raw pointer position for the lead cursor dot.
   * The trailing dot follows this position via the loop() rAF below.
   * @param {MouseEvent} e - the mousemove event
   * @returns {void}
   */
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx+'px'; cur.style.top = my+'px';
  });

  /**
   * Eases the trailing cursor ring toward the pointer at 10% per frame,
   * re-scheduling itself via requestAnimationFrame(loop) — hence the name.
   * @returns {void}
   */
  (function loop() {
    ox += (mx-ox)*.1; oy += (my-oy)*.1;
    curO.style.left = ox+'px'; curO.style.top = oy+'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .nav-logo').forEach(el => {
    /**
     * Grows the cursor dot and switches it to solid orange on hover targets.
     * @returns {void}
     */
    el.addEventListener('mouseenter', () => {
      cur.style.width = '12px'; cur.style.height = '12px';
      cur.style.background = 'var(--orange)';
      cur.style.mixBlendMode = 'normal';
    });
    /**
     * Restores the cursor dot to its default size and blend mode.
     * @returns {void}
     */
    el.addEventListener('mouseleave', () => {
      cur.style.width = '7px'; cur.style.height = '7px';
      cur.style.background = '';
      cur.style.mixBlendMode = '';
    });
  });
}
