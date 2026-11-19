/* 입력 — 키보드 · 마우스 · 터치(가상 조이스틱 + 탭) */
(function (GG) {
  'use strict';
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyE: 'act', Space: 'act', Enter: 'act', NumpadEnter: 'act',
    Escape: 'menu', KeyC: 'debugC', Digit1: 'd1', Digit2: 'd2', Digit3: 'd3', Digit0: 'd0'
  };
  const JOY_R = 46;   // 조이스틱 반경 (CSS px)
  const DRAG = 12;    // 이 거리 이상 움직이면 드래그(조이스틱)

  const I = GG.Input = {
    held: {}, pressed: {}, taps: [],
    joy: { active: false, x: 0, y: 0, ox: 0, oy: 0 },
    pointer: null,
    lastKind: 'mouse',
    lastInputAt: performance.now(),   // 행사 모드: 오래 입력이 없으면 처음으로

    init(canvas) {
      window.addEventListener('keydown', e => {
        const k = KEYMAP[e.code];
        if (!k) return;
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (['up', 'down', 'left', 'right', 'act'].includes(k)) e.preventDefault();
        if (!e.repeat) I.pressed[k] = true;
        I.held[k] = true;
        I.lastKind = 'key';
        I.lastInputAt = performance.now();
      });
      window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) I.held[k] = false; });
      window.addEventListener('blur', () => { I.held = {}; I.endPointer(); });

      canvas.addEventListener('pointerdown', e => {
        if (I.pointer) return;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        I.pointer = { id: e.pointerId, sx: e.clientX, sy: e.clientY, t: performance.now(), drag: false, kind: e.pointerType };
        I.lastKind = e.pointerType === 'touch' ? 'touch' : 'mouse';
        I.lastInputAt = performance.now();
      });
      // 화면 어디를 눌러도(대화창·버튼 포함) 입력으로 침
      window.addEventListener('pointerdown', () => { I.lastInputAt = performance.now(); }, true);
      window.addEventListener('keydown', () => { I.lastInputAt = performance.now(); }, true);   // 이름 입력 중 타자도 포함
      canvas.addEventListener('pointermove', e => {
        const p = I.pointer;
        if (!p || p.id !== e.pointerId) return;
        const dx = e.clientX - p.sx, dy = e.clientY - p.sy;
        const d = Math.hypot(dx, dy);
        if (!p.drag && d > DRAG) { p.drag = true; I.joy.active = true; I.joy.ox = p.sx; I.joy.oy = p.sy; }
        if (p.drag) {
          const m = Math.min(1, d / JOY_R);
          I.joy.x = d > 0 ? (dx / d) * m : 0;
          I.joy.y = d > 0 ? (dy / d) * m : 0;
          I.joy.kx = d > 0 ? (dx / d) * Math.min(d, JOY_R) : 0;
          I.joy.ky = d > 0 ? (dy / d) * Math.min(d, JOY_R) : 0;
        }
      });
      const up = e => {
        const p = I.pointer;
        if (!p || p.id !== e.pointerId) return;
        if (!p.drag && performance.now() - p.t < 600) I.taps.push({ x: e.clientX, y: e.clientY });
        I.endPointer();
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', () => I.endPointer());
      canvas.addEventListener('contextmenu', e => e.preventDefault());
    },

    endPointer() {
      I.pointer = null;
      I.joy.active = false; I.joy.x = 0; I.joy.y = 0; I.joy.kx = 0; I.joy.ky = 0;
    },

    /* 이동 벡터 (-1..1) */
    axis() {
      let x = 0, y = 0;
      if (I.held.left) x -= 1;
      if (I.held.right) x += 1;
      if (I.held.up) y -= 1;
      if (I.held.down) y += 1;
      if (x || y) { const l = Math.hypot(x, y); return { x: x / l, y: y / l, src: 'key' }; }
      if (I.joy.active && Math.hypot(I.joy.x, I.joy.y) > 0.18) return { x: I.joy.x, y: I.joy.y, src: 'joy' };
      return { x: 0, y: 0, src: null };
    },

    take(k) { const v = !!I.pressed[k]; I.pressed[k] = false; return v; },
    takeTap() { return I.taps.shift() || null; },
    endFrame() { I.pressed = {}; I.taps.length = 0; },
    press(k) { I.pressed[k] = true; } // UI 버튼에서 호출
  };
})(window.GG);
