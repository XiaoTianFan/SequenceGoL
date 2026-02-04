// Dynamic dithering-like animated background
// Renders a low-res thresholded value-noise field as pixelated dots
(function () {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.zIndex = '-9999';
  canvas.style.pointerEvents = 'none';
  canvas.style.imageRendering = 'pixelated';
  canvas.style.background = '#000000';
  document.body.prepend(canvas);

  const stage = document.querySelector('.stage');
  if (stage) {
    stage.style.position = 'relative';
    stage.style.zIndex = '0';
  }

  const grid = document.querySelector('.grid');
  if (grid) {
    grid.style.position = 'relative';
    grid.style.zIndex = '10';
  }

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const opts = {
    pixel: 4, // logical cell size in CSS pixels
    freq: 0.4, // spatial frequency
    speedX: 0.01,
    speedY: 0.01,
    threshold: 0.65,
    color: '#3d4b8f99', // blue-ish dots
    bg: '#000000'
  };

  let cols = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let startTime = performance.now();
  const seed = Math.random() * 1000 + 13.37;

  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    cols = Math.ceil(width / opts.pixel);
    rows = Math.ceil(height / opts.pixel);
  }

  function fract(x) { return x - Math.floor(x); }
  function rand2(x, y) {
    // hash to [0,1)
    return fract(Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453123);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function valueNoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const r00 = rand2(xi, yi);
    const r10 = rand2(xi + 1, yi);
    const r01 = rand2(xi, yi + 1);
    const r11 = rand2(xi + 1, yi + 1);
    const u = smooth(xf);
    const v = smooth(yf);
    const a = lerp(r00, r10, u);
    const b = lerp(r01, r11, u);
    return lerp(a, b, v);
  }
  function fbm(x, y) {
    // 2-octave fBm for richer motion
    let v = 0;
    let amp = 0.6;
    let freq = 1.0;
    for (let i = 0; i < 2; i++) {
      v += valueNoise(x * freq, y * freq) * amp;
      freq *= 2.02;
      amp *= 0.5;
    }
    return v;
  }

  let rafId = 0;
  let isRunning = true;

  function drawFrame(time) {
    if (!isRunning) return;

    const t = (time - startTime) / 1000; // seconds
    // paint background
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const px = Math.max(4, Math.floor(opts.pixel * dpr));
    const invPx = 1 / opts.pixel;

    // subtle drift to make cells move
    const ox = t * opts.speedX * (1 / opts.freq);
    const oy = t * opts.speedY * (1 / opts.freq);

    ctx.fillStyle = opts.color;
    for (let gy = 0; gy < rows; gy++) {
      const y = gy * opts.pixel;
      for (let gx = 0; gx < cols; gx++) {
        const x = gx * opts.pixel;
        const nx = gx * opts.freq + ox;
        const ny = gy * opts.freq + oy;
        // value in [0,1]
        const v = fbm(nx, ny);
        // threshold with a little spatial modulation for dot density variance
        const local = opts.threshold + 0.04 * Math.sin((gx + gy + t * 0.6) * 0.25);
        if (v > local) {
          ctx.fillRect(Math.floor(x * dpr), Math.floor(y * dpr), px, px);
        }
      }
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(rafId);
    } else {
      isRunning = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(drawFrame);
    }
  });
  rafId = requestAnimationFrame(drawFrame);

  // Export stop function for cleanup
  window.stopBackgroundAnimation = () => {
    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
})();
