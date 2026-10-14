// Shared helpers, layout constants and a tiny promise-based tween engine.
(function () {
  'use strict';
  const NS = (window.UFO = window.UFO || {});

  const W = 1600;
  const H = 900;
  const TAU = Math.PI * 2;
  const FONT = '"Baloo 2", "Segoe UI", system-ui, sans-serif';

  // Logical scene layout (canvas is always drawn at 1600x900 and scaled to fit).
  const LAYOUT = {
    buildingBase: 300,
    roadTop: 372,
    roadBottom: 532,
    plazaTop: 548,
    walkTop: 615,
    walkBottom: 872,
    walkLeft: 50,
    walkRight: W - 50,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const ease = {
    linear: (t) => t,
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
  };

  // Deterministic PRNG (mulberry32) so the city and each kid's look are stable.
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Fair randomness for picking students.
  function secureRandom() {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }

  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(secureRandom() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Rounded-rect path (caller fills/strokes).
  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  // Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour.
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const v = amt < 0 ? c * (1 + amt) : c + (255 - c) * amt;
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    });
    return `#${ch.join('')}`;
  }

  // Soft radial glow; rgb is "r,g,b". sy squashes it into an ellipse.
  function glow(ctx, x, y, r, rgb, alpha, sy = 1) {
    if (r <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Promise-based tweens, advanced by the main loop.
  const tweens = {
    list: [],
    add(dur, onUpdate, easeFn = ease.inOut) {
      return new Promise((resolve) => {
        this.list = [...this.list, { t: 0, dur: Math.max(0.0001, dur), onUpdate, easeFn, resolve }];
      });
    },
    wait(dur) {
      return this.add(dur, () => {}, ease.linear);
    },
    update(dt) {
      const active = this.list;
      this.list = [];
      const keep = active.filter((tw) => {
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        tw.onUpdate(tw.easeFn(k), k);
        if (k >= 1) {
          tw.resolve();
          return false;
        }
        return true;
      });
      this.list = [...keep, ...this.list];
    },
  };

  NS.W = W;
  NS.H = H;
  NS.tweens = tweens;
  NS.util = {
    W, H, TAU, FONT, LAYOUT, clamp, lerp, rand, pick, ease, seeded, hashString,
    secureRandom, shuffle, makeCanvas, rr, shade, glow,
  };
})();
