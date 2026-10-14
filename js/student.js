// Chibi students in Vietnamese school uniform, with wandering / panic AI.
(function () {
  'use strict';
  const NS = window.UFO;
  const { TAU, FONT, LAYOUT: L, rand, clamp, seeded, hashString, rr, shade } = NS.util;

  const NAVY = '#26315f';
  const SHIRT = '#f6f7fc';
  const SHIRT_SHADE = '#cfd5e6';
  const SCARF = '#e3342f';
  const SHOE = '#2a2530';
  const SKINS = ['#ffdcbc', '#f7cba3', '#ecb98e', '#ffe3cc'];
  const HAIRS = ['#1c1a22', '#2b1d16', '#3b2719', '#15121a', '#4a2f1f'];
  const BAGS = ['#ef4f5a', '#4f8ff0', '#f5b83d', '#3fbf7f', '#9b6be0', '#ff7aa8', '#21b5c9', '#ff8a3d'];
  const MALE_STYLES = ['short', 'spiky', 'side', 'short'];
  const FEMALE_STYLES = ['long', 'ponytail', 'bob', 'twin'];
  const FEMALE_GIVEN = new Set([
    'linh', 'trang', 'hương', 'lan', 'mai', 'ngọc', 'thảo', 'hà', 'vy', 'nhi', 'hoa', 'hằng', 'yến',
    'trâm', 'như', 'uyên', 'thư', 'hân', 'ngân', 'quỳnh', 'châu', 'my', 'phương', 'diệp', 'giang',
    'thủy', 'nga', 'hạnh', 'hiền', 'dung', 'loan', 'oanh', 'huyền', 'vân', 'xuân', 'chi', 'thúy',
    'thùy', 'tuyết', 'nhung', 'duyên', 'ly', 'trinh', 'hồng', 'đào', 'cúc', 'liên', 'mỹ', 'tiên',
    'thơ', 'hậu', 'diễm', 'kiều', 'ánh', 'nguyệt', 'thanh', 'trúc', 'nhàn', 'hoài', 'vi',
  ]);

  function isFemale(name) {
    const words = name.toLowerCase().normalize('NFC').split(/\s+/).filter(Boolean);
    if (words.includes('thị')) return true;
    return FEMALE_GIVEN.has(words[words.length - 1] || '');
  }

  function makeLook(name) {
    const rng = seeded(hashString(name));
    const female = isFemale(name);
    const from = (arr) => arr[Math.floor(rng() * arr.length)];
    return {
      female,
      skin: from(SKINS),
      hair: from(HAIRS),
      bag: from(BAGS),
      style: from(female ? FEMALE_STYLES : MALE_STYLES),
      glasses: rng() < 0.2,
    };
  }

  function stroke(ctx, color, width, pts) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.stroke();
  }

  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function drawLegs(ctx, lk, swing) {
    const leg = lk.female ? lk.skin : NAVY;
    const back = [-2, -20, -2 - swing * 6, -3];
    const front = [3, -20, 3 + swing * 6, -3];
    stroke(ctx, shade(leg, -0.15), 6.5, back);
    stroke(ctx, leg, 6.5, front);
    [back, front].forEach((p) => {
      ctx.fillStyle = SHOE;
      ctx.beginPath();
      ctx.ellipse(p[2] + 2, p[3], 5, 3, 0, 0, TAU);
      ctx.fill();
    });
  }

  function armTarget(pose, swing, front) {
    if (pose.mood === 'panic') {
      const w = Math.sin(pose.t * 18 + (front ? 0 : 1.5)) * 3;
      return front ? [14, -66 + w] : [-11, -64 - w];
    }
    if (pose.mood === 'shock') return front ? [15, -33] : [-13, -33];
    if (pose.mood === 'happy') return front ? [6, -27] : [-14, -66 + Math.sin(pose.t * 10) * 3];
    return front ? [3 - swing * 7, -27] : [-4 + swing * 7, -27];
  }

  function drawArm(ctx, lk, pose, swing, front) {
    const [sx, sy] = front ? [3, -42] : [-4, -42];
    const [hx, hy] = armTarget(pose, swing, front);
    const mx = (sx + hx) / 2;
    const my = (sy + hy) / 2;
    stroke(ctx, front ? SHIRT : SHIRT_SHADE, 6.5, [sx, sy, mx, my]);
    stroke(ctx, front ? lk.skin : shade(lk.skin, -0.12), 5, [mx, my, hx, hy]);
  }

  function drawTorso(ctx, lk) {
    ctx.fillStyle = lk.bag;
    rr(ctx, -18, -46, 10, 22, 4);
    ctx.fill();
    ctx.fillStyle = shade(lk.bag, -0.22);
    rr(ctx, -18, -36, 10, 8, 3);
    ctx.fill();
    ctx.fillStyle = NAVY;
    if (lk.female) {
      ctx.beginPath();
      ctx.moveTo(-9, -26);
      ctx.lineTo(9, -26);
      ctx.lineTo(13, -13);
      ctx.lineTo(-13, -13);
      ctx.closePath();
      ctx.fill();
    } else {
      rr(ctx, -9.5, -26, 19, 8, 3);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(-10, 0, 10, 0);
    g.addColorStop(0, SHIRT_SHADE);
    g.addColorStop(0.5, SHIRT);
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    rr(ctx, -10, -46, 20, 24, 7);
    ctx.fill();
    stroke(ctx, shade(lk.bag, -0.3), 2.5, [-8, -45, -3, -30]);
    ctx.fillStyle = SCARF;
    ctx.beginPath();
    ctx.moveTo(1, -45);
    ctx.lineTo(10, -45);
    ctx.lineTo(6, -33);
    ctx.closePath();
    ctx.fill();
    dot(ctx, 5.5, -44, 2.6, SCARF);
    ctx.fillStyle = '#7aa2ff';
    ctx.fillRect(-6, -40, 4, 3);
  }

  function drawHairBack(ctx, lk, pose) {
    const sway = pose.moving ? Math.sin(pose.phase) * 2 : 0;
    ctx.fillStyle = lk.hair;
    if (lk.style === 'long') {
      rr(ctx, -16, -66, 23, 38, 9);
      ctx.fill();
    } else if (lk.style === 'bob') {
      rr(ctx, -16, -68, 31, 22, 10);
      ctx.fill();
    } else if (lk.style === 'ponytail') {
      ctx.beginPath();
      ctx.ellipse(-19 + sway * 0.5, -57, 6, 12, 0.5 + sway * 0.05, 0, TAU);
      ctx.fill();
    } else if (lk.style === 'twin') {
      ctx.beginPath();
      ctx.ellipse(-17, -51 + sway * 0.3, 5, 10, 0.3, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(14, -49 - sway * 0.3, 4.5, 9, -0.25, 0, TAU);
      ctx.fill();
    }
  }

  function drawHairFront(ctx, lk) {
    ctx.fillStyle = lk.hair;
    ctx.beginPath();
    ctx.moveTo(-14.5, -52);
    ctx.lineTo(-15.2, -61);
    ctx.arc(1, -61, 16.2, Math.PI, 0);
    ctx.lineTo(16.6, -58);
    ctx.quadraticCurveTo(11, -61.5, 5, -64);
    ctx.quadraticCurveTo(-3, -61, -6, -53);
    ctx.closePath();
    ctx.fill();
    if (lk.style === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(-10, -72);
      ctx.lineTo(-7, -82);
      ctx.lineTo(-2, -75);
      ctx.lineTo(3, -84);
      ctx.lineTo(7, -75);
      ctx.lineTo(13, -80);
      ctx.lineTo(14, -69);
      ctx.closePath();
      ctx.fill();
    } else if (lk.style === 'side') {
      ctx.beginPath();
      ctx.moveTo(-4, -76);
      ctx.quadraticCurveTo(16, -77, 18, -60);
      ctx.lineTo(13, -62);
      ctx.quadraticCurveTo(8, -70, -4, -70);
      ctx.closePath();
      ctx.fill();
    }
    if (lk.female) dot(ctx, 9, -71, 3, lk.bag);
    if (lk.style === 'ponytail') dot(ctx, -14, -60, 2.6, lk.bag);
  }

  function drawEyes(ctx, pose) {
    const ex = [4.8, 12];
    const ey = -58;
    const ink = '#1d1a26';
    if (pose.mood === 'panic') {
      stroke(ctx, ink, 1.8, [ex[0] - 2, ey - 2, ex[0] + 1.5, ey, ex[0] - 2, ey + 2]);
      stroke(ctx, ink, 1.8, [ex[1] + 2, ey - 2, ex[1] - 1.5, ey, ex[1] + 2, ey + 2]);
      return;
    }
    if (pose.mood === 'shock') {
      ex.forEach((x) => {
        dot(ctx, x, ey, 3.1, '#ffffff');
        dot(ctx, x + 0.5, ey, 1.4, ink);
      });
      return;
    }
    if (pose.mood === 'happy') {
      ex.forEach((x) => {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, ey + 1.2, 2.4, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
      return;
    }
    if (pose.t % 3.6 < 0.12) {
      ex.forEach((x) => stroke(ctx, ink, 1.6, [x - 2, ey, x + 2, ey]));
      return;
    }
    ex.forEach((x) => {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(x, ey, 1.8, 2.6, 0, 0, TAU);
      ctx.fill();
      dot(ctx, x + 0.6, ey - 0.9, 0.7, '#ffffff');
    });
  }

  function drawFace(ctx, lk, pose) {
    ctx.fillStyle = 'rgba(255,120,130,0.35)';
    ctx.beginPath();
    ctx.ellipse(3, -52.5, 3, 2, 0, 0, TAU);
    ctx.ellipse(14, -52.5, 2.3, 1.8, 0, 0, TAU);
    ctx.fill();
    drawEyes(ctx, pose);
    if (pose.mood === 'panic' || pose.mood === 'shock') {
      ctx.fillStyle = '#7a2b35';
      ctx.beginPath();
      ctx.ellipse(9, -50, 2.4, pose.mood === 'panic' ? 3.4 : 2.4, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7a2b35';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(9, -52, pose.mood === 'happy' ? 3.2 : 2.3, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    if (lk.glasses) {
      ctx.strokeStyle = '#2b2f45';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(4.8, -58, 3.6, 0, TAU);
      ctx.moveTo(15.6, -58);
      ctx.arc(12, -58, 3.6, 0, TAU);
      ctx.moveTo(8.4, -58.5);
      ctx.lineTo(8.4, -58.5);
      ctx.moveTo(1.2, -58);
      ctx.lineTo(-3, -59);
      ctx.stroke();
    }
  }

  function drawSweat(ctx, t) {
    const y = -70 + ((t * 30) % 10);
    ctx.fillStyle = '#8fd3ff';
    ctx.beginPath();
    ctx.moveTo(19, y - 5);
    ctx.quadraticCurveTo(23, y + 1, 19, y + 2);
    ctx.quadraticCurveTo(15, y + 1, 19, y - 5);
    ctx.fill();
  }

  // Draws a student with feet at (0,0), facing +x.
  function drawFigure(ctx, lk, pose) {
    const swing = pose.moving ? Math.sin(pose.phase) : 0;
    const bob = pose.moving ? Math.abs(Math.cos(pose.phase)) * 2.2 : Math.sin(pose.t * 2.4) * 0.7;
    drawLegs(ctx, lk, swing);
    ctx.save();
    ctx.translate(0, -bob);
    drawArm(ctx, lk, pose, swing, false);
    drawHairBack(ctx, lk, pose);
    drawTorso(ctx, lk);
    dot(ctx, 1, -59, 14.5, lk.skin);
    drawHairFront(ctx, lk);
    dot(ctx, -3, -57, 3.4, shade(lk.skin, -0.08));
    drawFace(ctx, lk, pose);
    drawArm(ctx, lk, pose, swing, true);
    if (pose.mood === 'panic') drawSweat(ctx, pose.t);
    ctx.restore();
  }

  function drawBubble(ctx, x, y, urgent) {
    ctx.fillStyle = urgent ? '#ff4f64' : '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = urgent ? '#ffffff' : '#3a2a00';
    ctx.font = `800 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(urgent ? '!!' : '!', x, y + 1);
  }

  class Student {
    constructor(name, short, called) {
      this.name = name;
      this.short = short;
      this.called = called;
      this.look = makeLook(name);
      this.x = rand(L.walkLeft, L.walkRight);
      this.y = rand(L.walkTop, L.walkBottom);
      this.tx = this.x;
      this.ty = this.y;
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.speed = rand(32, 52);
      this.phase = rand(0, TAU);
      this.t = rand(0, 10);
      this.wait = rand(0, 3);
      this.moving = false;
      this.state = 'free';
      this.lift = 0;
      this.scale = 1;
      this.rot = 0;
      this.bubble = 0;
      this.happy = 0;
      this.panicTimer = 0;
      this.tagW = 0;
    }

    clampTarget() {
      this.tx = clamp(this.tx, L.walkLeft, L.walkRight);
      this.ty = clamp(this.ty, L.walkTop, L.walkBottom);
    }

    chooseTarget(world, panic) {
      const th = world.threat;
      if (panic && th) {
        const ang = Math.atan2((this.y - th.y) * 1.5, this.x - th.x) + rand(-0.6, 0.6);
        const dist = rand(150, 300);
        this.tx = this.x + Math.cos(ang) * dist;
        this.ty = this.y + Math.sin(ang) * dist * 0.5;
      } else {
        const r = panic ? 260 : 220;
        this.tx = this.x + rand(-r, r);
        this.ty = this.y + rand(-r * 0.4, r * 0.4);
      }
      this.clampTarget();
    }

    // Spread back across the whole yard after the panic is over.
    scatter() {
      if (this.state !== 'free') return;
      this.tx = rand(L.walkLeft, L.walkRight);
      this.ty = rand(L.walkTop, L.walkBottom);
      this.wait = rand(0, 0.6);
    }

    land() {
      this.state = 'free';
      this.lift = 0;
      this.scale = 1;
      this.rot = 0;
      this.happy = 3.5;
      this.wait = 0.4;
      this.tx = this.x + rand(-160, 160);
      this.ty = this.y + rand(-60, 60);
      this.clampTarget();
    }

    mood(world) {
      if (this.state === 'frozen' || this.state === 'lifted') return 'shock';
      if (world.panic) return 'panic';
      if (this.happy > 0) return 'happy';
      return 'calm';
    }

    update(dt, world) {
      this.t += dt;
      this.bubble = Math.max(0, this.bubble - dt);
      this.happy = Math.max(0, this.happy - dt);
      if (this.state !== 'free') {
        this.moving = false;
        return;
      }
      const panic = world.panic;
      if (panic) {
        if (this.bubble <= 0 && Math.random() < dt * 0.3) this.bubble = 0.9;
        this.panicTimer -= dt;
        if (this.panicTimer <= 0) {
          this.panicTimer = rand(0.6, 1.4);
          this.chooseTarget(world, true);
          this.wait = 0;
        }
      }
      if (this.wait > 0) {
        this.wait -= dt;
        this.moving = false;
        return;
      }
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) {
        this.wait = panic ? 0 : rand(0.8, 4);
        this.chooseTarget(world, panic);
        this.moving = false;
        return;
      }
      const sp = this.speed * (panic ? 3 : 1);
      const step = Math.min(d, sp * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      if (Math.abs(dx) > 1) this.dir = dx > 0 ? 1 : -1;
      this.moving = true;
      this.phase += dt * sp * 0.2;
    }

    draw(ctx, world) {
      if (this.state === 'gone') return;
      const shadowK = 1 - Math.min(1, this.lift / 320) * 0.6;
      ctx.fillStyle = `rgba(0,0,0,${0.28 * shadowK})`;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 15 * shadowK, 4.5 * shadowK, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      const shake = this.state === 'frozen' ? Math.sin(this.t * 60) * 1.2 : 0;
      ctx.translate(this.x + shake, this.y - this.lift);
      ctx.translate(0, -35 * this.scale);
      ctx.rotate(this.rot);
      ctx.translate(0, 35 * this.scale);
      ctx.scale(this.dir * this.scale, this.scale);
      if (this.state === 'lifted') {
        ctx.shadowColor = 'rgba(140,255,230,0.95)';
        ctx.shadowBlur = 18;
      }
      drawFigure(ctx, this.look, { phase: this.phase, moving: this.moving, t: this.t, mood: this.mood(world) });
      ctx.restore();
    }

    drawTag(ctx) {
      if (this.state !== 'free' && this.state !== 'frozen') return;
      ctx.font = `700 15px ${FONT}`;
      if (!this.tagW) this.tagW = ctx.measureText(this.short).width;
      const w = this.tagW + 28 + (this.called ? 14 : 0);
      const x = this.x - w / 2;
      const y = this.y - 108;
      ctx.globalAlpha = this.called && this.state === 'free' ? 0.62 : 0.96;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      rr(ctx, x + 1, y + 2, w, 22, 11);
      ctx.fill();
      ctx.fillStyle = this.state === 'frozen' ? '#fff1a8' : '#ffffff';
      rr(ctx, x, y, w, 22, 11);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x - 5, y + 21);
      ctx.lineTo(this.x + 5, y + 21);
      ctx.lineTo(this.x, y + 27);
      ctx.closePath();
      ctx.fill();
      dot(ctx, x + 11, y + 11, 4.5, this.look.bag);
      ctx.fillStyle = '#1d2142';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.short, x + 19, y + 12);
      if (this.called) stroke(ctx, '#22a06b', 2.2, [x + w - 18, y + 11, x + w - 14, y + 15, x + w - 8, y + 7]);
      ctx.globalAlpha = 1;
      if (this.state === 'frozen') drawBubble(ctx, this.x + w / 2 + 6, y - 6, true);
      else if (this.bubble > 0) drawBubble(ctx, this.x + w / 2 + 4, y - 4, false);
    }
  }

  // Shortest unique display name: given name, else last two words, else full name.
  function shortNames(names) {
    const words = names.map((n) => n.trim().split(/\s+/));
    const last1 = words.map((w) => w[w.length - 1]);
    const last2 = words.map((w) => w.slice(-2).join(' '));
    const count = (arr, v) => arr.filter((x) => x === v).length;
    return words.map((w, i) => {
      if (count(last1, last1[i]) === 1) return last1[i];
      if (count(last2, last2[i]) === 1) return last2[i];
      return names[i];
    });
  }

  function drawAvatar(canvas, look) {
    const ctx = canvas.getContext('2d');
    const s = canvas.width;
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, TAU);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, shade(look.bag, 0.55));
    g.addColorStop(1, shade(look.bag, 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const k = s / 52;
    ctx.translate(s / 2 - 5 * k, s * 0.44 + 59 * k);
    ctx.scale(k, k);
    drawFigure(ctx, look, { phase: 0, moving: false, t: 1, mood: 'happy' });
    ctx.restore();
  }

  NS.Student = Student;
  NS.shortNames = shortNames;
  NS.drawAvatar = drawAvatar;
})();