gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const footer = document.querySelector('.footer');
const canvas = document.querySelector('#ascii-canvas');
const ctx = canvas.getContext('2d');
const leftImage = document.querySelector('#left-hand');
const rightImage = document.querySelector('#right-hand');
const mouse = { x: -9999, y: -9999, tx: 0, ty: 0 };
const handProgress = { left: 0, right: 0 };
const charset = ' .·:+*#%@';
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let width = 0;
let height = 0;
let grid = 12;
let leftPoints = [];
let rightPoints = [];
let rafId;

const lenis = reduceMotion ? null : new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function resizeCanvas() {
  const rect = footer.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  grid = width < 760 ? 9 : 11;
  buildHands();
}

function sampleImage(img, side) {
  if (!img.complete || !img.naturalWidth) return [];
  const sample = document.createElement('canvas');
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  const targetW = Math.max(30, Math.floor((width * 0.67) / grid));
  const ratio = img.naturalHeight / img.naturalWidth;
  const targetH = Math.max(20, Math.floor(targetW * ratio * 0.82));
  sample.width = targetW;
  sample.height = targetH;
  sampleCtx.drawImage(img, 0, 0, targetW, targetH);
  const pixels = sampleCtx.getImageData(0, 0, targetW, targetH).data;
  const points = [];

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4;
      const lum = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
      const alpha = pixels[i + 3] / 255;
      // The supplied assets may be transparent or black-backed; luminance handles both.
      if (alpha > 0.08 && lum > 0.115) {
        points.push({
          x: x * grid,
          y: y * grid,
          lum,
          char: charset[Math.min(charset.length - 1, Math.floor(lum * charset.length))],
          seed: Math.random() * Math.PI * 2,
          side
        });
      }
    }
  }
  return points;
}

function buildHands() {
  leftPoints = sampleImage(leftImage, -1);
  rightPoints = sampleImage(rightImage, 1);
}

function drawHand(points, side, time) {
  if (!points.length) return;
  const imageWidth = Math.max(...points.map(p => p.x));
  const imageHeight = Math.max(...points.map(p => p.y));
  const baseX = side < 0 ? -imageWidth * 0.16 : width - imageWidth * 0.84;
  const baseY = height * (side < 0 ? 0.03 : 0.09);
  const progress = side < 0 ? handProgress.left : handProgress.right;
  const slide = (1 - progress) * (imageWidth * 0.8) * side;
  const parallaxX = mouse.tx * (side < 0 ? 22 : -18);
  const parallaxY = mouse.ty * (side < 0 ? 13 : 19);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = baseX + p.x + slide + parallaxX;
    const y = baseY + p.y + parallaxY;
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wobble = Math.sin(p.seed + time * 0.002 + p.x * 0.03) * 28;
    const active = dist < 105 + wobble;

    ctx.font = `${active ? 700 : 500} ${active ? grid + 2 : grid}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle = active ? `rgba(255,90,31,${0.72 + p.lum * 0.28})` : `rgba(233,231,223,${0.28 + p.lum * 0.62})`;
    ctx.fillText(active && p.lum > .52 ? '@' : p.char, x, y);
  }
}

function render(time = 0) {
  ctx.clearRect(0, 0, width, height);
  mouse.tx += (((mouse.x / Math.max(width, 1)) - 0.5) * 2 - mouse.tx) * 0.045;
  mouse.ty += (((mouse.y / Math.max(height, 1)) - 0.5) * 2 - mouse.ty) * 0.045;
  drawHand(leftPoints, -1, time);
  drawHand(rightPoints, 1, time);
  rafId = requestAnimationFrame(render);
}

footer.addEventListener('pointermove', (event) => {
  const rect = footer.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});
footer.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });

function initMotion() {
  gsap.from('.hero-line', { yPercent: 115, opacity: 0, rotate: 2, stagger: 0.12, duration: 1.2, ease: 'power4.out' });
  gsap.from('.hero-kicker, .hero-foot', { opacity: 0, y: 20, stagger: .16, delay: .35, duration: .8, ease: 'power2.out' });

  gsap.from('.manifesto-copy', {
    scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'center center', scrub: 1 },
    y: 100, opacity: .05, ease: 'none'
  });

  gsap.from('.work-list a', {
    scrollTrigger: { trigger: '.work-list', start: 'top 75%' },
    x: 80, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out'
  });

  const introSplit = new SplitText('.footer-intro', { type: 'lines', linesClass: 'line' });
  const titleSplit = new SplitText('.title-row', { type: 'chars', charsClass: 'char' });
  gsap.set([introSplit.lines, titleSplit.chars, '.footer-top nav a', '.footer-bottom'], { opacity: 0 });

  const footerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#footer-trigger',
      start: 'top 76%',
      end: 'top 5%',
      scrub: 1.15,
      onEnter: () => footer.classList.add('is-visible'),
      onLeaveBack: () => footer.classList.remove('is-visible')
    }
  });

  footerTimeline
    .to('.topbar', { opacity: 0, duration: .25 }, 0)
    .to(handProgress, { left: 1, right: 1, duration: 1, ease: 'power3.out' }, 0)
    .fromTo(introSplit.lines, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .08, duration: .7, ease: 'power3.out' }, .15)
    .fromTo('.footer-top nav a', { x: 24, opacity: 0 }, { x: 0, opacity: 1, stagger: .05, duration: .5 }, .25)
    .fromTo(titleSplit.chars, { yPercent: 130, rotate: 5, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: .012, duration: .85, ease: 'power4.out' }, .35)
    .to('.footer-bottom', { opacity: 1, duration: .3 }, .72);
}

function init() {
  resizeCanvas();
  render();
  if (reduceMotion) {
    handProgress.left = handProgress.right = 1;
    gsap.set('.footer-intro, .title-row, .footer-top nav a, .footer-bottom', { opacity: 1 });
  } else {
    initMotion();
  }
  ScrollTrigger.refresh();
}

Promise.all([
  leftImage.decode().catch(() => {}),
  rightImage.decode().catch(() => {}),
  document.fonts?.ready || Promise.resolve()
]).then(init);

window.addEventListener('resize', () => {
  clearTimeout(window.__asciiResize);
  window.__asciiResize = setTimeout(resizeCanvas, 120);
});

document.querySelector('#back-top').addEventListener('click', () => {
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
