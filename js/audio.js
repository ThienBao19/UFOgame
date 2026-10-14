// Synthesised sound effects (Web Audio) — no audio files needed.
(function () {
  'use strict';
  const NS = window.UFO;
  const A = { ctx: null, master: null, enabled: true, hum: null, noiseBuf: null };

  function getCtx() {
    if (!A.enabled) return null;
    if (!A.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      A.ctx = new Ctor();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.6;
      A.master.connect(A.ctx.destination);
    }
    if (A.ctx.state === 'suspended') A.ctx.resume();
    return A.ctx;
  }

  function tone(o) {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.attack || 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(A.master);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  function noiseBuffer(c) {
    if (A.noiseBuf) return A.noiseBuf;
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    A.noiseBuf = buf;
    return buf;
  }

  function noise(o) {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.value = o.freq || 1000;
    f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(A.master);
    src.start(t);
    src.stop(t + o.dur + 0.05);
  }

  // Eerie UFO drone: wobbling low saw + theremin-like whistle.
  function humStart() {
    const c = getCtx();
    if (!c || A.hum) return;
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16, t + 1.2);
    out.connect(A.master);

    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.connect(out);

    const low = c.createOscillator();
    low.type = 'sawtooth';
    low.frequency.value = 62;
    const sub = c.createOscillator();
    sub.frequency.value = 124;
    const wobble = c.createOscillator();
    wobble.frequency.value = 6;
    const wobbleDepth = c.createGain();
    wobbleDepth.gain.value = 6;
    wobble.connect(wobbleDepth);
    wobbleDepth.connect(low.frequency);
    wobbleDepth.connect(sub.frequency);
    low.connect(lp);
    sub.connect(lp);

    const whistle = c.createOscillator();
    whistle.frequency.value = 720;
    const slow = c.createOscillator();
    slow.frequency.value = 0.35;
    const slowDepth = c.createGain();
    slowDepth.gain.value = 240;
    slow.connect(slowDepth);
    slowDepth.connect(whistle.frequency);
    const whistleOut = c.createGain();
    whistleOut.gain.value = 0.05;
    whistle.connect(whistleOut);
    whistleOut.connect(out);

    const oscs = [low, sub, wobble, whistle, slow];
    oscs.forEach((o) => o.start(t));
    A.hum = { out, oscs };
  }

  function humStop() {
    if (!A.hum || !A.ctx) return;
    const { out, oscs } = A.hum;
    A.hum = null;
    const t = A.ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    oscs.forEach((o) => o.stop(t + 0.9));
  }

  function drumroll(dur) {
    const steps = Math.floor(dur / 0.05);
    for (let i = 0; i < steps; i++) {
      noise({ delay: i * 0.05, dur: 0.045, vol: 0.04 + 0.2 * (i / steps), freq: 900, q: 0.8 });
    }
  }

  const sfx = {
    beam() {
      tone({ type: 'sine', f0: 180, f1: 1300, dur: 1.7, vol: 0.14, attack: 0.1 });
      tone({ type: 'triangle', f0: 186, f1: 1320, dur: 1.7, vol: 0.07, attack: 0.1 });
      noise({ dur: 1.6, vol: 0.05, freq: 3000, q: 0.6 });
    },
    beamDown() {
      tone({ type: 'sine', f0: 1300, f1: 200, dur: 1.3, vol: 0.13, attack: 0.05 });
      tone({ type: 'triangle', f0: 1320, f1: 206, dur: 1.3, vol: 0.06, attack: 0.05 });
    },
    alert() {
      tone({ type: 'square', f0: 988, dur: 0.1, vol: 0.06 });
      tone({ type: 'square', f0: 740, dur: 0.14, vol: 0.06, delay: 0.12 });
    },
    pop() {
      tone({ type: 'sine', f0: 500, f1: 1800, dur: 0.16, vol: 0.2 });
    },
    reveal() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ type: 'triangle', f0: f, dur: 0.4, vol: 0.15, delay: i * 0.1 });
      });
      tone({ type: 'sine', f0: 1046.5, dur: 1.1, vol: 0.08, delay: 0.42 });
      tone({ type: 'sine', f0: 1318.5, dur: 1.1, vol: 0.06, delay: 0.42 });
      noise({ delay: 0.4, dur: 0.7, vol: 0.12, freq: 6000, filter: 'highpass' });
    },
    click() {
      tone({ type: 'sine', f0: 900, dur: 0.05, vol: 0.05 });
    },
  };

  NS.audio = {
    ...sfx,
    humStart,
    humStop,
    drumroll,
    setEnabled(on) {
      if (!on) humStop();
      A.enabled = on;
    },
    isEnabled: () => A.enabled,
    unlock: () => getCtx(),
  };
})();
