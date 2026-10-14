// Street traffic: scooters, cars, taxis and buses with night headlights.
(function () {
  'use strict';
  const NS = window.UFO;
  const { W, TAU, rand, pick, rr, glow } = NS.util;

  const CAR_COLORS = ['#e8505b', '#3d8bfd', '#f6c445', '#eef1f6', '#38c172', '#9561e2', '#f28c38', '#4a5468'];
  const BIKE_COLORS = ['#e8505b', '#2f3a56', '#eef1f6', '#3d8bfd', '#f6a23c', '#ff7eb6', '#20b2aa'];
  const BUS_COLORS = ['#2fa36b', '#e8505b', '#3d8bfd'];
  const HELMETS = ['#ffd23f', '#e8505b', '#ffffff', '#3d8bfd', '#ff7eb6', '#38c172', '#9561e2'];
  const SHIRTS = ['#5b7cfa', '#f25f5c', '#70c1b3', '#ffe066', '#9d4edd', '#ff9f1c', '#e5e5e5', '#2ec4b6'];
  const SKINS = ['#f5c9a0', '#eab68a', '#ffd9b8'];

  const SPEC = {
    bike: { len: 62, light: 38 },
    car: { len: 150, light: 30 },
    taxi: { len: 150, light: 30 },
    bus: { len: 250, light: 30 },
  };

  const LANES = [
    { y: 420, dir: -1, speed: 150, kinds: ['car', 'taxi', 'car', 'bus'], count: 3 },
    { y: 452, dir: -1, speed: 100, kinds: ['bike'], count: 6 },
    { y: 486, dir: 1, speed: 112, kinds: ['bike'], count: 6 },
    { y: 524, dir: 1, speed: 168, kinds: ['car', 'taxi', 'car', 'bus'], count: 3 },
  ];
  const SPAN = W + 700;
  const START = -350;

  function wheel(ctx, x, y, r) {
    ctx.fillStyle = '#16161d';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9aa0b4';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, TAU);
    ctx.fill();
  }

  function drawRider(ctx, shirt, helmet, skin) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2d3550';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, -36);
    ctx.lineTo(8, -35);
    ctx.lineTo(10, -20);
    ctx.stroke();
    ctx.fillStyle = shirt;
    rr(ctx, -15, -63, 15, 29, 6);
    ctx.fill();
    ctx.strokeStyle = shirt;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-5, -57);
    ctx.lineTo(15, -49);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-5, -70, 7.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = helmet;
    ctx.beginPath();
    ctx.arc(-6, -71, 9.5, Math.PI, 0);
    ctx.lineTo(4, -68);
    ctx.lineTo(-16, -68);
    ctx.closePath();
    ctx.fill();
  }

  function drawMotorbike(ctx, v) {
    wheel(ctx, -22, -9, 9);
    wheel(ctx, 22, -9, 9);
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.moveTo(-30, -12);
    ctx.quadraticCurveTo(-29, -30, -10, -31);
    ctx.lineTo(8, -31);
    ctx.lineTo(14, -17);
    ctx.lineTo(26, -19);
    ctx.lineTo(28, -12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, -17);
    ctx.lineTo(19, -45);
    ctx.lineTo(26, -45);
    ctx.lineTo(28, -19);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, -45);
    ctx.lineTo(15, -51);
    ctx.stroke();
    ctx.fillStyle = '#fff6c2';
    ctx.beginPath();
    ctx.arc(27, -38, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(-32, -24, 3, 4);
    ctx.fillStyle = '#2a2a33';
    rr(ctx, -24, -35, 26, 6, 3);
    ctx.fill();
    if (v.passenger) {
      ctx.save();
      ctx.translate(-14, 3);
      ctx.scale(0.9, 0.9);
      drawRider(ctx, v.shirt2, v.helmet2, v.skin);
      ctx.restore();
    }
    drawRider(ctx, v.shirt, v.helmet, v.skin);
  }

  function drawCar(ctx, v) {
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.moveTo(-50, -38);
    ctx.lineTo(-34, -63);
    ctx.lineTo(28, -63);
    ctx.lineTo(52, -38);
    ctx.closePath();
    ctx.fill();
    rr(ctx, -75, -40, 150, 28, 9);
    ctx.fill();
    ctx.fillStyle = '#34405f';
    ctx.beginPath();
    ctx.moveTo(-44, -40);
    ctx.lineTo(-31, -58);
    ctx.lineTo(-4, -58);
    ctx.lineTo(-4, -40);
    ctx.closePath();
    ctx.moveTo(1, -40);
    ctx.lineTo(1, -58);
    ctx.lineTo(25, -58);
    ctx.lineTo(43, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-28, -56, 6, 14);
    ctx.fillRect(6, -56, 6, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-75, -24, 150, 4);
    if (v.kind === 'taxi') {
      ctx.fillStyle = '#ffd84d';
      rr(ctx, -12, -71, 24, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#2b9c5b';
      ctx.fillRect(-75, -30, 150, 4);
    }
    wheel(ctx, -46, -12, 14);
    wheel(ctx, 46, -12, 14);
    ctx.fillStyle = '#fff6c2';
    rr(ctx, 68, -34, 8, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#ff4d4d';
    rr(ctx, -76, -34, 6, 7, 2);
    ctx.fill();
  }

  function drawBus(ctx, v) {
    ctx.fillStyle = v.color;
    rr(ctx, -125, -96, 250, 84, 12);
    ctx.fill();
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(-125, -46, 250, 6);
    ctx.fillStyle = '#ffe48a';
    for (let x = -112; x < 80; x += 38) ctx.fillRect(x, -84, 30, 28);
    ctx.fillStyle = '#34405f';
    ctx.fillRect(92, -86, 26, 36);
    ctx.fillStyle = '#ffb000';
    rr(ctx, 60, -94, 56, 9, 2);
    ctx.fill();
    wheel(ctx, -82, -12, 16);
    wheel(ctx, 82, -12, 16);
    ctx.fillStyle = '#fff6c2';
    rr(ctx, 118, -32, 8, 8, 2);
    ctx.fill();
    ctx.fillStyle = '#ff4d4d';
    rr(ctx, -126, -32, 6, 8, 2);
    ctx.fill();
  }

  const DRAW = { bike: drawMotorbike, car: drawCar, taxi: drawCar, bus: drawBus };

  function colorFor(kind) {
    if (kind === 'taxi') return '#f6f7fb';
    if (kind === 'bus') return pick(BUS_COLORS);
    return pick(kind === 'bike' ? BIKE_COLORS : CAR_COLORS);
  }

  function makeVehicle(kind, x) {
    return {
      kind,
      x,
      len: SPEC[kind].len,
      color: colorFor(kind),
      helmet: pick(HELMETS),
      helmet2: pick(HELMETS),
      shirt: pick(SHIRTS),
      shirt2: pick(SHIRTS),
      skin: pick(SKINS),
      passenger: Math.random() < 0.3,
    };
  }

  function createLane(lane) {
    const gap = SPAN / lane.count;
    const vehicles = Array.from({ length: lane.count }, (_, i) =>
      makeVehicle(pick(lane.kinds), START + i * gap + rand(-gap * 0.2, gap * 0.2)));
    return { ...lane, vehicles };
  }

  function createTraffic() {
    return {
      lanes: LANES.map(createLane),
      mul: 1,
      update(dt, slow) {
        const target = slow ? 0.18 : 1;
        this.mul += (target - this.mul) * Math.min(1, dt * 1.5);
        this.lanes = this.lanes.map((lane) => ({
          ...lane,
          vehicles: lane.vehicles.map((v) => {
            const x = v.x + lane.dir * lane.speed * this.mul * dt;
            if (lane.dir > 0 && x > START + SPAN) return makeVehicle(pick(lane.kinds), x - SPAN);
            if (lane.dir < 0 && x < START) return makeVehicle(pick(lane.kinds), x + SPAN);
            return { ...v, x };
          }),
        }));
      },
      draw(ctx) {
        this.lanes.forEach((lane) => {
          lane.vehicles.forEach((v) => {
            if (v.x < -320 || v.x > W + 320) return;
            ctx.save();
            ctx.translate(v.x, lane.y);
            ctx.scale(lane.dir, 1);
            DRAW[v.kind](ctx, v);
            ctx.restore();
          });
        });
      },
      // Call with globalCompositeOperation = 'lighter'.
      drawLights(ctx) {
        this.lanes.forEach((lane) => {
          lane.vehicles.forEach((v) => {
            if (v.x < -500 || v.x > W + 500) return;
            const fx = v.x + lane.dir * (v.len / 2);
            const fy = lane.y - SPEC[v.kind].light;
            ctx.save();
            ctx.translate(fx, fy);
            ctx.scale(lane.dir, 1);
            const g = ctx.createLinearGradient(0, 0, 190, 0);
            g.addColorStop(0, 'rgba(255,236,170,0.30)');
            g.addColorStop(1, 'rgba(255,236,170,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(190, -16);
            ctx.lineTo(190, SPEC[v.kind].light * 0.9);
            ctx.lineTo(0, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            glow(ctx, fx, fy, 16, '255,240,190', 0.9);
            glow(ctx, v.x - lane.dir * (v.len / 2), fy + 6, 12, '255,60,60', 0.7);
          });
        });
      },
    };
  }

  NS.createTraffic = createTraffic;
  NS.vehicles = { drawMotorbike, makeVehicle };
})();