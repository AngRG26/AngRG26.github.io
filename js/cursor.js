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
    cur.style.background = '';
  });
});
