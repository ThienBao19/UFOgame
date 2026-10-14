// Pre-rendered night street: sky, shophouses, sidewalks, road and school yard.
(function () {
  'use strict';
  const NS = window.UFO;
  const { W, H, TAU, FONT, LAYOUT: L, seeded, makeCanvas, rr, shade, glow } = NS.util;

  const PALETTE = ['#f4d58d', '#9ad0c2', '#f2a7a7', '#a7c5eb', '#f6e7cb', '#e8a87c', '#c3aed6', '#b8e0a8', '#ffd6a5', '#cde7f0'];
  const SIGN_COLORS = ['#d7263d', '#1b998b', '#2e86de', '#f46036', '#8e44ad', '#c0392b', '#16a085', '#e67e22'];
  const SHOPS = ['PHỞ BÒ', 'BÁNH MÌ', 'CÀ PHÊ', 'TẠP HÓA', 'NHÀ SÁCH', 'CƠM TẤM', 'TRÀ SỮA', 'BÚN CHẢ', 'KEM', 'PHOTO', 'HỚT TÓC', 'SỬA XE', 'VĂN PHÒNG PHẨM', 'BÁNH CUỐN'];
  const UPPER_LAMPS = [140, 560, 980, 1400];
  const UPPER_TREES = [345, 770, 1190, 1560];
  const LOWER_LAMPS = [250, 800, 1350];
  const PLANTERS = [70, 470, 1020, 1520];
  const NIGHT_TINT = 'rgba(22,16,70,0.5)';

  function drawSky(ctx, rng) {
    const g = ctx.createLinearGradient(0, 0, 0, L.buildingBase);
    g.addColorStop(0, '#0a0f2e');
    g.addColorStop(0.6, '#241f55');
    g.addColorStop(1, '#4b3170');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, L.buildingBase + 2);
    for (let i = 0; i < 170; i++) {
      const size = rng() < 0.85 ? 1.3 : 2.4;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + rng() * 0.6})`;
      ctx.fillRect(rng() * W, rng() * 230, size, size);
    }
    glow(ctx, 1390, 78, 120, '255,240,200', 0.3);
    ctx.fillStyle = '#fff5d6';
    ctx.beginPath();
    ctx.arc(1390, 78, 30, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(214,198,160,0.55)';
    [[1379, 70, 6], [1400, 89, 4], [1398, 66, 3], [1384, 92, 3]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    });
  }

  function drawSkyline(ctx, rng) {
    let x = -20;
    let i = 0;
    while (x < W + 20) {
      const w = 60 + rng() * 70;
      const h = 170 + rng() * 110;
      const top = L.buildingBase - h;
      ctx.fillStyle = i % 2 ? '#2a2456' : '#312a62';
      ctx.fillRect(x, top, w, h);
      for (let wy = top + 10; wy < L.buildingBase - 20; wy += 12) {
        for (let wx = x + 6; wx < x + w - 6; wx += 10) {
          if (rng() < 0.18) {
            ctx.fillStyle = 'rgba(255,214,120,0.55)';
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
      x += w;
      i += 1;
    }
  }

  function litWindow(ctx, x, y, w, h, warm, curtain) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, warm ? '#ffe7a3' : '#d4ebff');
    g.addColorStop(1, warm ? '#ffb85c' : '#8fb8ff');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (curtain < 0.5) {
      ctx.fillStyle = warm ? 'rgba(214,90,60,0.55)' : 'rgba(60,90,160,0.5)';
      ctx.fillRect(x, y, w * 0.22, h);
      ctx.fillRect(x + w * 0.78, y, w * 0.22, h);
    }
    ctx.fillStyle = 'rgba(90,60,30,0.35)';
    ctx.fillRect(x + w / 2 - 1, y, 2, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x + w / 2, y + h / 2, w * 0.95, warm ? '255,190,90' : '140,180,255', 0.2);
    ctx.restore();
  }

  function drawFloor(ctx, rng, b, floorTop, lights) {
    const wy = floorTop + 10;
    const n = b.w >= 150 ? 2 : 1;
    const margin = 18;
    const ww = (b.w - margin * 2 - (n - 1) * 16) / n;
    for (let i = 0; i < n; i++) {
      const wx = b.x + margin + i * (ww + 16);
      ctx.fillStyle = shade(b.color, -0.35);
      ctx.fillRect(wx - 3, wy - 3, ww + 6, 42);
      ctx.fillStyle = '#28304d';
      ctx.fillRect(wx, wy, ww, 36);
      const lit = rng() < 0.55;
      const warm = rng() < 0.75;
      const curtain = rng();
      if (lit) lights.push(() => litWindow(ctx, wx, wy, ww, 36, warm, curtain));
    }
    if (rng() < 0.55) {
      ctx.fillStyle = shade(b.color, -0.18);
      ctx.fillRect(b.x + 6, wy + 36, b.w - 12, 6);
      ctx.strokeStyle = shade(b.color, -0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x + 8, wy + 18);
      ctx.lineTo(b.x + b.w - 8, wy + 18);
      for (let rx = b.x + 10; rx < b.x + b.w - 8; rx += 7) {
        ctx.moveTo(rx, wy + 18);
        ctx.lineTo(rx, wy + 36);
      }
      ctx.stroke();
      const pots = 1 + Math.floor(rng() * 3);
      for (let p = 0; p < pots; p++) {
        const px = b.x + 14 + rng() * (b.w - 28);
        ctx.fillStyle = '#9c5a2c';
        ctx.fillRect(px - 4, wy + 28, 8, 8);
        ctx.fillStyle = rng() < 0.5 ? '#3f8f4f' : '#4fa65c';
        ctx.beginPath();
        ctx.arc(px, wy + 24, 7, 0, TAU);
        ctx.fill();
      }
    } else if (rng() < 0.45) {
      const ax = b.x + b.w - 32;
      ctx.fillStyle = '#e3e6ee';
      ctx.fillRect(ax, wy + 20, 22, 14);
      ctx.fillStyle = '#aab0c0';
      for (let gy = wy + 23; gy < wy + 33; gy += 3) ctx.fillRect(ax + 3, gy, 16, 1);
    }
  }

  function shopInterior(ctx, x, y, w, h, seed) {
    const rng = seeded(seed);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffe2a0');
    g.addColorStop(1, '#ffad55');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(120,70,30,0.45)';
    for (let sy = y + 10; sy < y + h - 14; sy += 12) ctx.fillRect(x + 4, sy, w - 8, 2);
    for (let i = 0; i < w / 6; i++) {
      ctx.fillStyle = `hsl(${Math.floor(rng() * 360)},70%,55%)`;
      const sy = y + 2 + Math.floor(rng() * 3) * 12;
      ctx.fillRect(x + 4 + rng() * (w - 12), sy, 4, 8);
    }
    ctx.fillStyle = 'rgba(110,60,25,0.6)';
    ctx.fillRect(x + w * 0.55, y + h - 16, w * 0.4, 16);
    if (rng() < 0.6) {
      ctx.fillStyle = 'rgba(60,30,20,0.55)';
      const px = x + w * (0.2 + rng() * 0.3);
      ctx.beginPath();
      ctx.arc(px, y + h - 30, 6, 0, TAU);
      ctx.fill();
      rr(ctx, px - 7, y + h - 24, 14, 24, 5);
      ctx.fill();
    }
  }

  function signBoard(ctx, x, y, w, h, color, text) {
    ctx.fillStyle = color;
    rr(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff6d0';
    ctx.font = `800 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 1, w - 10);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x + w / 2, y + h / 2, w * 0.6, '255,200,150', 0.12, 0.4);
    ctx.restore();
  }

  function drawShopFront(ctx, rng, b, gTop, lights, spills) {
    const signText = SHOPS[Math.floor(rng() * SHOPS.length)];
    const signColor = SIGN_COLORS[Math.floor(rng() * SIGN_COLORS.length)];
    const ay = gTop + 27;
    let i = 0;
    for (let sx = b.x + 6; sx < b.x + b.w - 6; sx += 14) {
      ctx.fillStyle = i % 2 ? '#f4f4f4' : signColor;
      ctx.fillRect(sx, ay, Math.min(14, b.x + b.w - 6 - sx), 11);
      ctx.beginPath();
      ctx.arc(sx + 7, ay + 11, 7, 0, Math.PI);
      ctx.fill();
      i += 1;
    }
    const oy = ay + 19;
    const ox = b.x + 12;
    const ow = b.w - 24;
    const oh = L.buildingBase - oy;
    if (rng() < 0.78) {
      const seed = Math.floor(rng() * 1e9);
      lights.push(() => shopInterior(ctx, ox, oy, ow, oh, seed));
      spills.push({ x: ox + ow / 2, w: ow });
    } else {
      ctx.fillStyle = '#8c93a6';
      ctx.fillRect(ox, oy, ow, oh);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let sy = oy + 3; sy < oy + oh; sy += 5) ctx.fillRect(ox, sy, ow, 1);
    }
    lights.push(() => signBoard(ctx, b.x + 8, gTop + 3, b.w - 16, 21, signColor, signText));
  }

  function drawBuilding(ctx, rng, b, lights, spills) {
    const top = L.buildingBase - b.h;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, top, b.w, b.h);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.fillRect(b.x + b.w - 7, top, 7, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(b.x, top, 4, b.h);
    ctx.fillStyle = shade(b.color, -0.25);
    ctx.fillRect(b.x - 3, top - 9, b.w + 6, 11);
    if (rng() < 0.45) {
      const tx = b.x + b.w * (0.2 + rng() * 0.5);
      ctx.fillStyle = '#c9ced8';
      rr(ctx, tx, top - 32, 28, 22, 7);
      ctx.fill();
      ctx.fillStyle = '#8d93a3';
      ctx.fillRect(tx + 3, top - 11, 3, 4);
      ctx.fillRect(tx + 22, top - 11, 3, 4);
    } else if (rng() < 0.5) {
      ctx.strokeStyle = '#59607a';
      ctx.lineWidth = 2;
      const ax = b.x + b.w * 0.3;
      ctx.beginPath();
      ctx.moveTo(ax, top - 9);
      ctx.lineTo(ax, top - 42);
      ctx.moveTo(ax - 10, top - 36);
      ctx.lineTo(ax + 10, top - 36);
      ctx.moveTo(ax - 7, top - 28);
      ctx.lineTo(ax + 7, top - 28);
      ctx.stroke();
    }
    const gTop = L.buildingBase - 76;
    for (let floorTop = gTop - 60; floorTop >= top + 4; floorTop -= 60) {
      drawFloor(ctx, rng, b, floorTop, lights);
    }
    drawShopFront(ctx, rng, b, gTop, lights, spills);
  }

  function buildStreetRow(rng) {
    const canvas = makeCanvas(W, L.buildingBase + 2);
    const ctx = canvas.getContext('2d');
    const lights = [];
    const spills = [];
    let x = -30;
    while (x < W + 30) {
      const b = { x, w: 120 + Math.floor(rng() * 80), h: 150 + Math.floor(rng() * 110), color: PALETTE[Math.floor(rng() * PALETTE.length)] };
      drawBuilding(ctx, rng, b, lights, spills);
      x += b.w;
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = NIGHT_TINT;
    ctx.fillRect(0, 0, W, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    lights.forEach((fn) => fn());
    return { canvas, spills };
  }

  function drawGround(ctx, rng) {
    ctx.fillStyle = '#7a7592';
    ctx.fillRect(0, L.buildingBase, W, L.roadTop - L.buildingBase);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 40) {
      ctx.moveTo(x, L.buildingBase);
      ctx.lineTo(x - 10, L.roadTop - 8);
    }
    ctx.moveTo(0, L.buildingBase + 34);
    ctx.lineTo(W, L.buildingBase + 34);
    ctx.stroke();
    for (let x = 0; x < W; x += 40) {
      ctx.fillStyle = (x / 40) % 2 ? '#d9d4e8' : '#c0485a';
      ctx.fillRect(x, L.roadTop - 8, 40, 8);
    }

    ctx.fillStyle = '#2c2f3d';
    ctx.fillRect(0, L.roadTop, W, L.roadBottom - L.roadTop);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(rng() * W, L.roadTop + rng() * (L.roadBottom - L.roadTop), 2, 2);
    }
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(0, 466, W, 2);
    ctx.fillRect(0, 471, W, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = 0; x < W; x += 70) {
      ctx.fillRect(x, 436, 40, 3);
      ctx.fillRect(x + 30, 503, 40, 3);
    }
    ctx.fillStyle = 'rgba(240,240,240,0.7)';
    for (let y = L.roadTop + 8; y < L.roadBottom - 8; y += 18) ctx.fillRect(1180, y, 92, 9);

    ctx.fillStyle = '#b3aec8';
    ctx.fillRect(0, L.roadBottom, W, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, L.roadBottom, W, 2);

    const top = L.roadBottom + 16;
    ctx.fillStyle = '#c4b89c';
    ctx.fillRect(0, top, W, H - top);
    let row = 0;
    for (let y = top; y < H; y += 44) {
      const off = row % 2 ? 44 : 0;
      let col = 0;
      for (let x = -88 + off; x < W; x += 88) {
        col += 1;
        ctx.fillStyle = (col + row) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(x + 2, y + 2, 84, 40);
      }
      row += 1;
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(W / 2, 748, 250, 78, 0, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, 748, 210, 62, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = `800 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SÂN TRƯỜNG', W / 2, 750);

    ctx.fillStyle = 'rgba(18,14,60,0.42)';
    ctx.fillRect(0, L.buildingBase, W, H - L.buildingBase);
  }

  function drawTree(ctx, rng, x, baseY) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, baseY, 22, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3d2b2b';
    rr(ctx, x - 5, baseY - 86, 10, 86, 3);
    ctx.fill();
    const tones = ['#163d30', '#1f4d3a', '#28604a', '#33735a'];
    tones.forEach((tone, layer) => {
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.arc(x + (rng() - 0.5) * (70 - layer * 12), baseY - 108 + (rng() - 0.5) * 40 - layer * 4, 26 - layer * 3 + rng() * 10, 0, TAU);
        ctx.fill();
      }
    });
  }

  function drawLampPost(ctx, x, baseY, height, armDir) {
    const topY = baseY - height;
    const hx = x + armDir * 34;
    ctx.strokeStyle = '#3c4058';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, topY);
    ctx.quadraticCurveTo(x, topY - 8, hx, topY - 2);
    ctx.stroke();
    ctx.fillStyle = '#4b506b';
    rr(ctx, hx - 13, topY - 4, 26, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(hx - 9, topY + 4, 18, 3);
    return { hx, hy: topY + 6 };
  }

  function drawUpperProps(ctx, rng) {
    UPPER_TREES.forEach((x) => drawTree(ctx, rng, x, 352));
    const heads = UPPER_LAMPS.map((x) => drawLampPost(ctx, x, 356, 150, 1));
    return heads;
  }

  function drawGlows(ctx, upperHeads, spills) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    spills.forEach((s) => glow(ctx, s.x, L.buildingBase + 6, s.w * 0.9, '255,190,110', 0.28, 0.35));
    upperHeads.forEach((h) => {
      glow(ctx, h.hx, h.hy, 60, '255,220,150', 0.55);
      glow(ctx, h.hx, 375, 170, '255,214,140', 0.22, 0.32);
    });
    LOWER_LAMPS.forEach((x) => glow(ctx, x + 34, 600, 240, '255,214,140', 0.2, 0.3));
    ctx.restore();
  }

  function drawPlanter(ctx, rng, x) {
    ctx.fillStyle = '#5d5873';
    rr(ctx, x, 552, 130, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#726c8c';
    ctx.fillRect(x + 2, 552, 126, 5);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#1f5a3d' : '#2a6d4a';
      ctx.beginPath();
      ctx.arc(x + 10 + i * 14, 548 - rng() * 6, 11, 0, TAU);
      ctx.fill();
    }
    const flowers = ['#ff7eb6', '#ffd23f', '#ffffff', '#ff6b6b'];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = flowers[Math.floor(rng() * flowers.length)];
      ctx.beginPath();
      ctx.arc(x + 8 + rng() * 114, 538 + rng() * 14, 2.6, 0, TAU);
      ctx.fill();
    }
  }

  // Foreground strip (in front of traffic, behind students).
  function buildFront(rng) {
    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext('2d');
    PLANTERS.forEach((x) => drawPlanter(ctx, rng, x));
    const heads = LOWER_LAMPS.map((x) => drawLampPost(ctx, x, 572, 175, 1));
    ctx.globalCompositeOperation = 'lighter';
    heads.forEach((h) => glow(ctx, h.hx, h.hy, 64, '255,220,150', 0.6));
    return canvas;
  }

  function build() {
    const rng = seeded(20261014);
    const back = makeCanvas(W, H);
    const ctx = back.getContext('2d');
    drawSky(ctx, rng);
    drawSkyline(ctx, rng);
    const row = buildStreetRow(rng);
    ctx.drawImage(row.canvas, 0, 0);
    drawGround(ctx, rng);
    const heads = drawUpperProps(ctx, rng);
    drawGlows(ctx, heads, row.spills);
    return { back, front: buildFront(rng) };
  }

  NS.background = { build };
})();