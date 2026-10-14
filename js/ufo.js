// The flying saucer: metallic disc, alien pilot, spotlight and tractor beam.
(function () {
  'use strict';
  const NS = window.UFO;
  const { TAU, clamp, lerp, rand, glow, ease } = NS.util;

  function trapezoid(ctx, sx, sy, topW, tx, ty, botW) {
    ctx.beginPath();
    ctx.moveTo(sx - topW / 2, sy);
    ctx.lineTo(sx + topW / 2, sy);
    ctx.lineTo(tx + botW / 2, ty);
    ctx.lineTo(tx - botW / 2, ty);
    ctx.closePath();
  }

  class Ufo {
    constructor() {
      this.x = -300;
      this.y = 120;
      this.prevX = this.x;
      this.visible = false;
      this.t = 0;
      this.tilt = 0;
      this.beam = 0;
      this.beamX = 0;
      this.beamY = 0;
      this.spot = 0;
      this.spotX = 0;
      this.spotY = 0;
      this.spotTarget = null;
      this.lookX = 0;
      this.flashA = 0;
      this.sparks = [];
    }

    get bob() {
      return Math.sin(this.t * 2.3) * 6;
    }

    get hullY() {
      return this.y + this.bob + 26;
    }

    flyTo(x, y, dur, easeFn) {
      const sx = this.x;
      const sy = this.y;
      return NS.tweens.add(dur, (k) => {
        this.x = lerp(sx, x, k);
        this.y = lerp(sy, y, k);
      }, easeFn || ease.inOut);
    }

    flash() {
      NS.tweens.add(0.5, (k) => {
        this.flashA = 1 - k;
      }, ease.out);
    }

    update(dt) {
      this.t += dt;
      const vx = dt > 0 ? (this.x - this.prevX) / dt : 0;
      this.prevX = this.x;
      this.tilt = lerp(this.tilt, clamp(vx * 0.0006, -0.28, 0.28), Math.min(1, dt * 5));
      if (this.spotTarget) {
        const k = Math.min(1, dt * 7);
        this.spotX = lerp(this.spotX, this.spotTarget.x, k);
        this.spotY = lerp(this.spotY, this.spotTarget.y, k);
      }
      const focus = this.beam > 0 ? this.beamX : this.spotX;
      this.lookX = lerp(this.lookX, clamp((focus - this.x) / 40, -5, 5), Math.min(1, dt * 6));
      this.updateSparks(dt);
    }

    updateSparks(dt) {
      const spawn = this.beam > 0.3 ? Math.floor(dt * 50 + Math.random()) : 0;
      const fresh = Array.from({ length: spawn }, () => ({
        f: 0, u: rand(-0.45, 0.45), v: rand(0.5, 0.95), size: rand(2, 4),
      }));
      this.sparks = [...this.sparks, ...fresh]
        .map((p) => ({ ...p, f: p.f + dt * p.v }))
        .filter((p) => p.f < 1);
    }

    drawSpot(ctx) {
      if (!this.visible || this.spot <= 0.01) return;
      const k = this.spot;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, this.hullY, 0, this.spotY);
      g.addColorStop(0, `rgba(255,244,190,${0.4 * k})`);
      g.addColorStop(1, `rgba(255,244,190,${0.12 * k})`);
      ctx.fillStyle = g;
      trapezoid(ctx, this.x, this.hullY, 14, this.spotX, this.spotY, 90);
      ctx.fill();
      glow(ctx, this.spotX, this.spotY, 70, '255,240,180', 0.55 * k, 0.3);
      ctx.restore();
    }

    drawBeam(ctx) {
      if (!this.visible || this.beam <= 0.01) return;
      const k = this.beam;
      const sx = this.x;
      const sy = this.hullY;
      const tx = this.beamX;
      const ty = this.beamY;
      const topW = 50 * k;
      const botW = 130 * k;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, sy, 0, ty);
      g.addColorStop(0, `rgba(140,255,230,${0.55 * k})`);
      g.addColorStop(1, `rgba(140,255,230,${0.16 * k})`);
      ctx.fillStyle = g;
      trapezoid(ctx, sx, sy, topW, tx, ty, botW);
      ctx.fill();
      ctx.fillStyle = `rgba(220,255,250,${0.18 * k})`;
      trapezoid(ctx, sx, sy, topW * 0.35, tx, ty, botW * 0.35);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const f = (this.t * 0.9 + i / 5) % 1;
        const w = lerp(botW, topW, f);
        ctx.strokeStyle = `rgba(200,255,245,${0.5 * k * (1 - f)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(lerp(tx, sx, f), lerp(ty, sy, f), w / 2, Math.max(1, w * 0.12), 0, 0, TAU);
        ctx.stroke();
      }
      glow(ctx, tx, ty, 95 * k, '140,255,230', 0.65 * k, 0.28);
      this.sparks.forEach((p) => {
        const w = lerp(botW, topW, p.f);
        ctx.fillStyle = `rgba(225,255,250,${(1 - p.f) * k})`;
        ctx.fillRect(lerp(tx, sx, p.f) + p.u * w, lerp(ty, sy, p.f), p.size, p.size);
      });
      ctx.restore();
    }

    drawAlien(ctx) {
      const look = this.lookX;
      ctx.fillStyle = '#7ee08a';
      ctx.beginPath();
      ctx.ellipse(0, -18, 15, 12, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(look * 0.4, -38, 17, 15, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#7ee08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6 + look * 0.4, -51);
      ctx.lineTo(-11 + look * 0.4, -62);
      ctx.moveTo(6 + look * 0.4, -51);
      ctx.lineTo(11 + look * 0.4, -62);
      ctx.stroke();
      ctx.fillStyle = '#ff6fb5';
      [-11, 11].forEach((ax) => {
        ctx.beginPath();
        ctx.arc(ax + look * 0.4, -63, 3, 0, TAU);
        ctx.fill();
      });
      ctx.fillStyle = '#10131f';
      [[-7, 0.35], [7, -0.35]].forEach(([ex, rot]) => {
        ctx.beginPath();
        ctx.ellipse(ex + look, -39, 5, 7, rot, 0, TAU);
        ctx.fill();
      });
      ctx.fillStyle = '#ffffff';
      [-7, 7].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex + look + 1.5, -42, 1.6, 0, TAU);
        ctx.fill();
      });
    }

    drawDome(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -14, 54, 44, 0, Math.PI, 0);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = 'rgba(18,36,66,0.95)';
      ctx.fillRect(-60, -70, 120, 60);
      this.drawAlien(ctx);
      ctx.restore();
      const gg = ctx.createRadialGradient(-18, -42, 4, 0, -20, 62);
      gg.addColorStop(0, 'rgba(255,255,255,0.6)');
      gg.addColorStop(0.3, 'rgba(160,240,255,0.22)');
      gg.addColorStop(1, 'rgba(90,170,255,0.14)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.ellipse(0, -14, 54, 44, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,250,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    drawLights(ctx) {
      for (let i = 0; i < 12; i++) {
        const a = this.t * 1.6 + (i * TAU) / 12;
        const front = Math.sin(a) > 0;
        const lx = Math.cos(a) * 104;
        const ly = Math.sin(a) * 12 + 7;
        const hue = Math.floor(i * 30 + this.t * 120) % 360;
        ctx.fillStyle = `hsl(${hue},100%,${front ? 68 : 38}%)`;
        ctx.beginPath();
        ctx.arc(lx, ly, front ? 6 : 4, 0, TAU);
        ctx.fill();
        if (front) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          glow(ctx, lx, ly, 20, '255,255,255', 0.35);
          ctx.restore();
        }
      }
    }

    draw(ctx) {
      if (!this.visible) return;
      ctx.save();
      ctx.translate(this.x, this.y + this.bob);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0, 26, 130, '120,255,220', 0.22 + this.flashA * 0.5, 0.4);
      ctx.restore();
      ctx.rotate(this.tilt);
      this.drawDome(ctx);
      const hull = ctx.createLinearGradient(0, 0, 0, 34);
      hull.addColorStop(0, '#6b7390');
      hull.addColorStop(1, '#2c3045');
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.ellipse(0, 12, 78, 22, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9ffff0';
      ctx.beginPath();
      ctx.ellipse(0, 27, 26, 6, 0, 0, TAU);
      ctx.fill();
      const disc = ctx.createLinearGradient(0, -24, 0, 24);
      disc.addColorStop(0, '#f4f7ff');
      disc.addColorStop(0.45, '#c3cadc');
      disc.addColorStop(0.55, '#8e97b0');
      disc.addColorStop(1, '#5d6680');
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.ellipse(0, 0, 128, 26, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -3, 116, 18, 0, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,34,52,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 124, 17, 0, Math.PI * 0.05, Math.PI * 0.95);
      ctx.stroke();
      this.drawLights(ctx);
      ctx.restore();
    }
  }

  NS.Ufo = Ufo;
})();