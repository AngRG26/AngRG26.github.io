/* CURSOR */
// Touch devices have no mouse, so none of this does anything useful — skip it
// entirely so the rAF loop never starts (not just idles) and the listeners are
// never attached. Same capability check the cursor CSS uses, so JS and CSS
// never disagree about which devices get the custom cursor.
const isTouch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

if (!isTouch) {
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
      cur.style.mixBlendMode = 'normal';
    });
    el.addEventListener('mouseleave', () => {
      cur.style.width = '7px'; cur.style.height = '7px';
      cur.style.background = '';
      cur.style.mixBlendMode = '';
    });
  });
}
