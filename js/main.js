// Boot, world state, game loop and layered rendering.
(function () {
  'use strict';
  const NS = window.UFO;
  const { W, H, LAYOUT: L, clamp } = NS.util;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  const SEPARATION = 28;

  const world = {
    students: [],
    ufo: new NS.Ufo(),
    traffic: NS.createTraffic(),
    dark: 0,
    panic: false,
    threat: null,
    trafficSlow: false,
    confetti: [],
    bg: null,
    vignette: null,
    setRoster(names, calledSet) {
      const shorts = NS.shortNames(names);
      this.students = names.map((n, i) => new NS.Student(n, shorts[i], calledSet.has(n)));
    },
  };
  NS.world = world;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const scale = Math.min(cw / W, ch / H);
    Object.assign(view, { scale, dpr, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2 });
  }

  function separate(students) {
    const act = students.filter((s) => s.state === 'free');
    for (let i = 0; i < act.length; i++) {
      for (let j = i + 1; j < act.length; j++) {
        const a = act[i];
        const b = act[j];
        const dx = b.x - a.x;
        const dy = (b.y - a.y) * 1.6;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01 && d2 < SEPARATION * SEPARATION) {
          const d = Math.sqrt(d2);
          const push = (SEPARATION - d) * 0.25;
          a.x -= (dx / d) * push;
          b.x += (dx / d) * push;
          a.y -= (dy / d) * push * 0.4;
          b.y += (dy / d) * push * 0.4;
        }
      }
    }
    act.forEach((s) => {
      s.x = clamp(s.x, L.walkLeft, L.walkRight);
      s.y = clamp(s.y, L.walkTop, L.walkBottom);
    });
  }

  function updateConfetti(dt) {
    world.confetti = world.confetti
      .map((p) => ({
        ...p,
        x: p.x + (p.vx + Math.sin(p.y * 0.02 + p.sway) * 40) * dt,
        y: p.y + p.vy * dt,
        rot: p.rot + p.vr * dt,
      }))
      .filter((p) => p.y < H + 30);
  }

  function update(dt) {
    NS.tweens.update(dt);
    world.traffic.update(dt, world.trafficSlow);
    world.students.forEach((s) => s.update(dt, world));
    separate(world.students);
    world.ufo.update(dt);
    updateConfetti(dt);
  }

  function makeVignette() {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.4, W / 2, H * 0.55, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,20,0)');
    g.addColorStop(1, 'rgba(0,0,20,0.45)');
    return g;
  }

  function drawConfetti() {
    world.confetti.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.rot * 1.7));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = view.scale * view.dpr;
    ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    ctx.drawImage(world.bg.back, 0, 0);
    world.traffic.draw(ctx);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    world.traffic.drawLights(ctx);
    ctx.restore();
    ctx.drawImage(world.bg.front, 0, 0);

    const byDepth = world.students.slice().sort((a, b) => a.y - b.y);
    byDepth.filter((s) => s.state === 'free').forEach((s) => s.draw(ctx, world));
    if (world.dark > 0.001) {
      ctx.fillStyle = `rgba(6,8,30,${world.dark})`;
      ctx.fillRect(0, 0, W, H);
    }
    world.ufo.drawSpot(ctx);
    world.ufo.drawBeam(ctx);
    byDepth.filter((s) => s.state === 'frozen' || s.state === 'lifted').forEach((s) => s.draw(ctx, world));
    byDepth.forEach((s) => s.drawTag(ctx));
    world.ufo.draw(ctx);
    ctx.fillStyle = world.vignette;
    ctx.fillRect(0, 0, W, H);
    drawConfetti();
    ctx.restore();
  }

  function waitFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const load = Promise.all([
      document.fonts.load('700 16px "Baloo 2"'),
      document.fonts.load('800 16px "Baloo 2"'),
    ]).catch(() => null);
    const timeout = new Promise((r) => setTimeout(r, 2500));
    return Promise.race([load, timeout]);
  }

  async function init() {
    await waitFonts();
    world.bg = NS.background.build();
    world.vignette = makeVignette();
    NS.ui.init();
    resize();
    window.addEventListener('resize', resize);
    document.body.classList.add('ready');
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  init();
})();