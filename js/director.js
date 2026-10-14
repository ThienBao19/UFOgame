// Choreography of one "call": arrive -> search -> abduct -> reveal -> release -> depart.
(function () {
  'use strict';
  const NS = window.UFO;
  const { W, LAYOUT: L, clamp, lerp, rand, pick, ease } = NS.util;
  const T = NS.tweens;
  const CONFETTI = ['#ff4f64', '#ffd23f', '#6af2c5', '#45c7ff', '#b78cff', '#ff9f43', '#ffffff'];
  let busy = false;

  function fadeDark(world, target, dur) {
    const from = world.dark;
    return T.add(dur, (k) => {
      world.dark = lerp(from, target, k);
    });
  }

  function freeStudents(world) {
    return world.students.filter((s) => s.state === 'free');
  }

  function spawnConfetti(world) {
    const pieces = Array.from({ length: 170 }, () => ({
      x: rand(0, W),
      y: rand(-260, -10),
      vx: rand(-60, 60),
      vy: rand(140, 280),
      rot: rand(0, Math.PI),
      vr: rand(-8, 8),
      w: rand(7, 12),
      h: rand(10, 16),
      sway: rand(0, 6),
      color: pick(CONFETTI),
    }));
    world.confetti = [...world.confetti, ...pieces];
  }

  async function arrive(world, ufo) {
    NS.audio.humStart();
    world.panic = true;
    world.trafficSlow = true;
    fadeDark(world, 0.5, 1.4);
    ufo.visible = true;
    ufo.x = -260;
    ufo.y = 80;
    ufo.prevX = ufo.x;
    await ufo.flyTo(W * 0.5, 200, 1.9, ease.out);
  }

  async function search(world, ufo) {
    NS.audio.drumroll(2.9);
    ufo.spotX = ufo.x;
    ufo.spotY = L.walkTop + 100;
    T.add(0.3, (k) => {
      ufo.spot = k;
    });
    for (let i = 0; i < 4; i++) {
      const pool = freeStudents(world);
      if (!pool.length) break;
      const s = pick(pool);
      ufo.spotTarget = s;
      await ufo.flyTo(clamp(s.x + rand(-80, 80), 160, W - 160), rand(180, 240), 0.62);
      await T.wait(0.08);
    }
    ufo.spotTarget = null;
    await T.add(0.25, (k) => {
      ufo.spot = 1 - k;
    });
  }

  async function abduct(world, ufo, v) {
    v.state = 'frozen';
    world.threat = { x: v.x, y: v.y };
    NS.audio.alert();
    await ufo.flyTo(clamp(v.x, 140, W - 140), clamp(v.y - 360, 170, 420), 0.85);
    ufo.beamX = v.x;
    ufo.beamY = v.y;
    NS.audio.beam();
    await T.add(0.35, (k) => {
      ufo.beam = k;
    }, ease.out);
    v.state = 'lifted';
    const rise = v.y - ufo.hullY;
    await T.add(1.45, (k) => {
      v.lift = rise * k;
      v.scale = 1 - 0.78 * k;
      v.rot = Math.sin(k * 9) * 0.35 * (1 - k) + k * k * Math.PI * 2;
    });
    v.state = 'gone';
    ufo.flash();
    NS.audio.pop();
    await T.add(0.3, (k) => {
      ufo.beam = 1 - k;
    });
  }

  async function release(world, ufo, victims) {
    const cx = clamp(ufo.x, 320, W - 320);
    const gy = 742;
    await ufo.flyTo(cx, 250, 0.7);
    ufo.beamX = cx;
    ufo.beamY = gy;
    NS.audio.beamDown();
    await T.add(0.3, (k) => {
      ufo.beam = k;
    });
    const top = gy - ufo.hullY;
    const n = victims.length;
    victims.forEach((v, i) => {
      v.x = cx + (i - (n - 1) / 2) * 34;
      v.y = gy + (i % 2) * 14 - 7;
      v.state = 'lifted';
      v.lift = top;
      v.scale = 0.22;
      v.rot = 0;
    });
    await T.add(1.2, (k) => {
      victims.forEach((v) => {
        v.lift = top * (1 - k);
        v.scale = 0.22 + 0.78 * k;
        v.rot = (1 - k) * Math.PI * 2;
      });
    }, ease.out);
    victims.forEach((v) => v.land());
    await T.add(0.3, (k) => {
      ufo.beam = 1 - k;
    });
  }

  async function depart(world, ufo) {
    world.panic = false;
    world.threat = null;
    world.trafficSlow = false;
    fadeDark(world, 0, 1.4);
    NS.audio.humStop();
    await ufo.flyTo(W + 320, -80, 1.6, ease.in);
    ufo.visible = false;
  }

  async function revealRound(world, ufo, victims) {
    world.panic = false;
    world.threat = null;
    world.students.forEach((s) => s.scatter());
    fadeDark(world, 0.28, 0.6);
    await ufo.flyTo(W * 0.5, 190, 0.8);
    NS.ui.recordCall(victims);
    NS.audio.reveal();
    spawnConfetti(world);
    return NS.ui.showResult(victims);
  }

  function recover(world) {
    world.students.forEach((s) => {
      if (s.state !== 'free') s.land();
    });
    world.panic = false;
    world.threat = null;
    world.trafficSlow = false;
    world.dark = 0;
    world.ufo.visible = false;
    world.ufo.beam = 0;
    world.ufo.spot = 0;
    NS.audio.humStop();
  }

  async function run() {
    if (busy) return;
    const world = NS.world;
    const ufo = world.ufo;
    const ui = NS.ui;
    let victims = ui.drawVictims();
    if (!victims.length) {
      ui.toast('Danh sách lớp đang trống — thêm tên trong phần Danh sách lớp nhé!');
      return;
    }
    busy = true;
    ui.setBusy(true);
    try {
      await arrive(world, ufo);
      while (victims.length) {
        await search(world, ufo);
        for (const v of victims) await abduct(world, ufo, v);
        const choice = await revealRound(world, ufo, victims);
        await release(world, ufo, victims);
        if (choice !== 'again') break;
        victims = ui.drawVictims();
        world.panic = true;
        fadeDark(world, 0.5, 0.6);
      }
      await depart(world, ufo);
    } catch (err) {
      console.error('UFO sequence failed', err);
      recover(world);
      ui.toast('Ôi, UFO gặp sự cố. Thử lại nhé!');
    } finally {
      busy = false;
      ui.setBusy(false);
    }
  }

  NS.director = { run, isBusy: () => busy };
})();