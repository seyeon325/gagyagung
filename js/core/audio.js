/* 사운드 — Web Audio 로 직접 합성 (외부 음원 파일 없음)
 * 배경음: 5음 음계(레·미·솔·라·시)의 잔잔한 뜯는 소리. 말빛을 되찾을수록 소리가 한 겹씩 늘어납니다.
 */
(function (GG) {
  'use strict';
  let ctx = null, master = null, sfxBus = null, bgmBus = null;
  let enabled = GG.store.get('sound', 'on') !== 'off';
  let bgmOn = false, timer = null, nextTime = 0, step = 0, layers = 1;

  const N = { D3: 146.83, E3: 164.81, G2: 98.0, A2: 110.0, B2: 123.47, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, B4: 493.88, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0 };
  const SCALE = [N.D4, N.E4, N.G4, N.A4, N.B4, N.D5, N.E5, N.G5, N.A5];
  const _ = null;
  const MELODY = [5, _, 4, 3, 2, _, 3, _, 4, _, 3, 2, 0, _, _, _, 2, _, 3, 4, 5, _, 6, 5, 4, _, 3, _, 2, _, _, _];
  const COUNTER = [_, _, _, _, 7, _, _, _, _, _, _, _, 6, _, _, _, _, _, _, _, 7, _, _, _, 6, _, 5, _, _, _, _, _];
  const HIGH = [_, _, 8, _, _, _, _, _, _, _, 7, _, _, _, _, _, _, _, 8, _, _, _, _, _, _, _, 7, _, _, 6, _, _];
  const BASS = { 0: N.D3, 8: N.A2, 16: N.G2, 24: N.A2 };
  const STEP = 60 / 84 / 2; // 8분음표

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = enabled ? 1 : 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.0; bgmBus.connect(master);
  }

  function tone(freq, t, dur, vol, bus, type, attack) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // 뜯는 현 느낌: 삼각파 + 옥타브 위 사인파 + 아주 살짝 음 떨림
  function pluck(freq, t, dur, vol, bus) {
    tone(freq, t, dur, vol, bus, 'triangle');
    tone(freq * 2, t, dur * 0.5, vol * 0.25, bus, 'sine');
  }

  function schedule() {
    if (!ctx || !bgmOn) return;
    while (nextTime < ctx.currentTime + 0.35) {
      const i = step % 32;
      const m = MELODY[i];
      if (m != null) pluck(SCALE[m], nextTime, 1.6, 0.22, bgmBus);
      if (BASS[i]) pluck(BASS[i], nextTime, 2.4, 0.2, bgmBus);
      if (layers >= 2 && COUNTER[i] != null) pluck(SCALE[COUNTER[i]], nextTime + 0.02, 1.4, 0.12, bgmBus);
      if (layers >= 3 && i % 4 === 2) tone(N.D3 * 0.5, nextTime, 0.18, 0.12, bgmBus, 'sine');
      if (layers >= 4 && HIGH[i] != null) pluck(SCALE[HIGH[i]], nextTime + 0.04, 1.8, 0.09, bgmBus);
      nextTime += STEP;
      step++;
    }
  }

  const SFX = {
    blip() { tone(SCALE[2 + ((Math.random() * 4) | 0)] * 2, ctx.currentTime, 0.05, 0.035, sfxBus, 'square', 0.003); },
    open() { const t = ctx.currentTime; pluck(N.A4, t, 0.4, 0.2, sfxBus); pluck(N.D5, t + 0.07, 0.5, 0.18, sfxBus); },
    select() { pluck(N.E5, ctx.currentTime, 0.25, 0.16, sfxBus); },
    next() { tone(N.D5, ctx.currentTime, 0.08, 0.06, sfxBus, 'triangle'); },
    quest() { const t = ctx.currentTime; [N.D4, N.G4, N.A4, N.D5].forEach((f, k) => pluck(f, t + k * 0.09, 0.7, 0.18, sfxBus)); },
    restore() {
      const t = ctx.currentTime;
      [N.D4, N.E4, N.G4, N.A4, N.B4, N.D5, N.E5, N.G5].forEach((f, k) => pluck(f, t + k * 0.08, 1.4, 0.16, sfxBus));
      tone(N.D3, t, 2.5, 0.12, sfxBus, 'sine', 0.2);
    },
    bump() { tone(N.G2, ctx.currentTime, 0.12, 0.08, sfxBus, 'sine'); },
    step() {
      const t = ctx.currentTime, len = 0.05, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 700 + Math.random() * 300; g.gain.value = 0.09;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
    },
    item() { const t = ctx.currentTime; pluck(N.G4, t, 0.3, 0.16, sfxBus); pluck(N.D5, t + 0.06, 0.4, 0.16, sfxBus); },
    paper() {
      const t = ctx.currentTime, len = 0.18, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2) * 0.5;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = 1800; g.gain.value = 0.25;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
    },
    fanfare() {
      const t = ctx.currentTime;
      [[N.D4, 0], [N.G4, 0.16], [N.A4, 0.32], [N.D5, 0.48], [N.B4, 0.8], [N.D5, 0.96], [N.E5, 1.12], [N.G5, 1.3]]
        .forEach(([f, d]) => pluck(f, t + d, 1.6, 0.17, sfxBus));
      tone(N.G2, t, 3, 0.12, sfxBus, 'sine', 0.3);
    }
  };

  GG.Audio = {
    init,
    get enabled() { return enabled; },
    setEnabled(v) {
      enabled = v;
      GG.store.set('sound', v ? 'on' : 'off');
      if (master) master.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.05);
    },
    sfx(name) { if (!ctx || !enabled || !SFX[name]) return; try { SFX[name](); } catch (e) { /* 무시 */ } },
    startBgm() {
      if (!ctx || bgmOn) return;
      bgmOn = true; nextTime = ctx.currentTime + 0.1; step = 0;
      bgmBus.gain.setTargetAtTime(0.5, ctx.currentTime, 1.5);
      timer = setInterval(schedule, 120);
    },
    setLayers(n) { layers = n; },
    /* 휴대폰 진동 (지원하는 기기만, 소리를 끄면 함께 꺼짐) */
    haptic(ms) {
      try {
        const ua = navigator.userActivation;
        if (enabled && navigator.vibrate && GG.util.isTouch() && (!ua || ua.hasBeenActive)) navigator.vibrate(ms);
      } catch (e) { /* 무시 */ }
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume().then(() => { nextTime = Math.max(nextTime, ctx.currentTime + 0.05); });
  });
})(window.GG);
