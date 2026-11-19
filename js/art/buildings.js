/* 한옥 건축 — 기와지붕(팔작) · 초가지붕 · 기둥 · 창호 · 기단 · 단청 · 돌담 */
(function (GG) {
  'use strict';
  const A = GG.art, H = GG.util.hash;

  const ROOF = { base: '#58616e', dark: '#444b57', light: '#6e7887', ridge: '#2d333b', ridgeL: '#8c96a5', maksae: '#808a99' };
  const WOOD = { l: '#a8744a', m: '#8b5a36', d: '#6e4429', dd: '#4f301d' };
  const RED = { l: '#c45a43', m: '#a5432f', d: '#7f3122' };
  const DAN = { g: '#3f8a74', gd: '#2c5f52', r: '#c0492f', w: '#efe4c6' };

  /* 팔작 기와지붕. 처마 끝이 살짝 들려 올라가는 곡선을 줍니다. */
  function giwaRoof(p, x0, y0, W, R, palace) {
    const C = ROOF, ridgeY = y0 + 3;
    const inset = Math.round(W * 0.2), xr0 = x0 + inset, xr1 = x0 + W - 1 - inset;
    const eave = [], top = [];
    const slope = (R - 9) / inset;
    for (let i = 0; i < W; i++) {
      const e = Math.min(i, W - 1 - i);
      const lift = e < 12 ? Math.round((12 - e) * (12 - e) / 30) : 0;
      eave[i] = y0 + R - 1 - lift;
      const x = x0 + i;
      let t = ridgeY + 2;
      if (x < xr0) t += Math.round((xr0 - x) * slope);
      else if (x > xr1) t += Math.round((x - xr1) * slope);
      top[i] = Math.min(t, eave[i] - 3);
    }
    for (let i = 0; i < W; i++) {
      const x = x0 + i, m = i % 3, span = eave[i] - top[i];
      for (let y = top[i]; y <= eave[i]; y++) {
        const fb = eave[i] - y;
        let c;
        if (fb === 0) c = C.dark;
        else if (fb === 1) c = m === 0 ? C.dark : C.maksae;
        else if (m === 0) c = C.dark;
        else if (m === 1 && y < top[i] + span * 0.55) c = C.light;
        else c = C.base;
        if (fb > 2 && fb % 7 === 0 && m !== 0) c = A.shade(c, -0.07);
        p.px(x, y, c);
      }
    }
    // 내림마루 (경사진 윗선)
    for (let i = 0; i < W; i++) {
      const x = x0 + i;
      if (x >= xr0 && x <= xr1) continue;
      const nb = x < xr0 ? top[i + 1] : top[i - 1];
      const len = Math.max(2, Math.abs(top[i] - nb) + 1);
      for (let k = 0; k < len; k++) p.px(x, top[i] - 1 + k, k === 0 ? C.ridgeL : C.ridge);
    }
    // 용마루
    for (let x = xr0 - 2; x <= xr1 + 2; x++) {
      p.px(x, ridgeY - 1, C.ridgeL); p.px(x, ridgeY, C.ridge); p.px(x, ridgeY + 1, C.ridge); p.px(x, ridgeY + 2, C.dark);
    }
    // 용마루 끝 장식(취두)
    for (const ex of [xr0 - 4, xr1 + 2]) {
      p.rect(ex, ridgeY - 3, 3, 6, C.ridge);
      p.px(ex + (ex < xr0 ? 0 : 2), ridgeY - 4, C.ridge);
      p.px(ex + 1, ridgeY - 3, C.ridgeL);
    }
    // 처마 아래: 궁궐은 단청, 민가는 서까래 끝
    for (let i = 0; i < W; i++) {
      const x = x0 + i, y = eave[i] + 1;
      if (palace) { p.px(x, y, i % 6 === 0 ? DAN.r : i % 6 === 3 ? DAN.w : DAN.g); p.px(x, y + 1, DAN.gd); }
      else { p.px(x, y, i % 2 === 0 ? WOOD.l : WOOD.d); p.px(x, y + 1, WOOD.dd); }
    }
    return y0 + R + 2;
  }

  /* 초가지붕: 둥근 볏짚 지붕과 새끼줄 무늬 */
  function chogaRoof(p, x0, y0, W, R) {
    for (let i = 0; i < W; i++) {
      const x = x0 + i, u = (i - (W - 1) / 2) / ((W - 1) / 2);
      const t = y0 + 1 + Math.round(11 * u * u);
      const b = y0 + R - 1 + (H(i, 3) % 3 === 0 ? 1 : 0) - (Math.abs(u) > 0.94 ? 2 : 0);
      for (let y = t; y <= b; y++) {
        const n = H(x, y * 7) % 100;
        let c = '#c9a55c';
        if (n < 14) c = '#b08a45'; else if (n < 22) c = '#dcbf78';
        if (y > t + 1 && y < b - 2 && ((x + y) % 10 === 0 || (x - y + 400) % 10 === 0)) c = '#9c7a3c';
        if (y === t || (y === t + 1 && n < 50)) c = '#e6cd90';
        if (y >= b - 1) c = '#8d6c33';
        p.px(x, y, c);
      }
    }
    return y0 + R + 1;
  }

  function panel(p, x0, y0, x1, y1, kind, o) {
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w <= 0 || h <= 0) return;
    const frame = o.palace ? RED.m : WOOD.d, lat = o.palace ? '#93402c' : WOOD.m;
    const plaster = (x, y) => (H(x, y) % 9 === 0 ? '#e2d8c2' : '#ece3cf');
    if (kind === 'wall' || kind === 'window') {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p.px(x, y, plaster(x, y));
      const mid = y0 + Math.floor(h * 0.62);
      p.hline(x0, x1, mid, WOOD.d);
      if (kind === 'window') {
        const wx0 = x0 + Math.floor(w * 0.22), wx1 = x1 - Math.floor(w * 0.22), wy0 = y0 + Math.floor(h * 0.18), wy1 = mid - 3;
        for (let y = wy0; y <= wy1; y++) for (let x = wx0; x <= wx1; x++) {
          const edge = x === wx0 || x === wx1 || y === wy0 || y === wy1;
          p.px(x, y, edge ? frame : ((x - wx0) % 3 === 0 || (y - wy0) % 3 === 0) ? lat : '#f2e7c9');
        }
      }
      return;
    }
    if (kind === 'earth') {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p.px(x, y, H(x, y) % 7 === 0 ? '#bea078' : '#cfb48c');
      p.hline(x0, x1, y0 + Math.floor(h * 0.55), WOOD.d);
      return;
    }
    if (kind === 'open') {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const t = (y - y0) / h;
        p.px(x, y, t < 0.55 ? '#2f2621' : A.mix('#3a2f28', '#7d705c', (t - 0.55) / 0.45));
      }
      return;
    }
    if (kind === 'gateDoor') {
      const mid = x0 + Math.floor(w / 2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        let c = (x - x0) % 4 === 0 ? RED.d : RED.m;
        if (x === mid || x === mid - 1) c = '#5e2418';
        if ((y - y0) % 6 === 3 && (x - x0) % 4 === 2) c = '#e2b84f';
        p.px(x, y, c);
      }
      return;
    }
    // door: 창호 (격자 창살 + 한지) · 아래는 궁판
    const split = x0 + Math.floor(w / 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || x === split;
      let c = edge ? frame : ((x - x0) % 3 === 0 || (y - y0) % 4 === 0) ? lat : '#efe3c3';
      if (y > y1 - 4) c = y === y1 - 3 ? frame : A.shade(frame, -0.15);
      p.px(x, y, c);
    }
  }

  function foundation(p, x0, y0, W, Hh, o) {
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      let c = '#b4ac9a';
      if (y === 0) c = '#d6cfbf';
      else if (y === Hh - 1) c = '#8e8676';
      else if (o.tiers && y === Math.floor(Hh / 2)) c = '#d0c9b8';
      else if ((x + Math.floor(y / 3) * 5) % 9 === 0) c = '#968e7d';
      p.px(x0 + x, y0 + y, c);
    }
    if (o.stairs) {
      const sw = o.stairs, sx = x0 + Math.floor((W - sw) / 2);
      for (let y = 0; y < Hh; y++) for (let x = 0; x < sw; x++) {
        const c = x === 0 || x === sw - 1 ? '#9a927f' : y % 2 === 0 ? '#e0d9c9' : '#aaa291';
        p.px(sx + x, y0 + y, c);
      }
    }
  }

  /* 현판: 짙은 나무판에 금빛 글씨(장식) */
  function board(p, x, y, w, h, seed) {
    p.rect(x, y, w, h, '#3b2a20');
    p.hline(x, x + w - 1, y, '#c9a24a'); p.hline(x, x + w - 1, y + h - 1, '#c9a24a');
    p.vline(x, y, y + h - 1, '#c9a24a'); p.vline(x + w - 1, y, y + h - 1, '#c9a24a');
    const glyphs = Math.max(2, Math.floor((w - 4) / 5));
    for (let g = 0; g < glyphs; g++) {
      const gx = x + 3 + g * Math.floor((w - 5) / glyphs);
      for (let k = 0; k < 4; k++) {
        const hh = H(seed + g, k);
        if (hh % 3 !== 0) p.px(gx + (k % 2), y + 2 + Math.floor(k / 2) * Math.max(1, h - 5), '#e8c766');
        p.px(gx + 1, y + 2 + (k % (h - 3)), hh % 2 ? '#e8c766' : '#3b2a20');
      }
    }
  }

  /* 한옥 몸체: 기둥 · 창방 · 벽/창호 · 기단 */
  function hanokBody(p, x0, y0, W, y1, o) {
    const baseH = o.baseH || 5, inset = o.inset || 6;
    const wy1 = y1 - baseH;
    const xa = x0 + inset, xb = x0 + W - 1 - inset;
    const posts = o.posts || (() => {
      const arr = [];
      for (let k = 0; k <= o.bays; k++) arr.push(Math.round(xa + k * (xb - xa - 2) / o.bays));
      return arr;
    })();
    const bays = posts.length - 1;
    for (let x = xa; x <= xb; x++) {
      p.px(x, y0, o.palace ? DAN.g : '#7a4d30');
      p.px(x, y0 + 1, o.palace ? DAN.gd : '#5e3a23');
    }
    for (let k = 0; k < bays; k++) panel(p, posts[k] + 3, y0 + 2, posts[k + 1] - 1, wy1, o.panels[k] || 'wall', o);
    posts.forEach(px => {
      for (let y = y0; y <= wy1; y++) {
        p.px(px, y, o.palace ? RED.l : WOOD.l); p.px(px + 1, y, o.palace ? RED.m : WOOD.m); p.px(px + 2, y, o.palace ? RED.d : WOOD.d);
      }
    });
    p.darken(xa, y0, xb - xa + 3, 3, 0.28);
    if (o.porch) p.hline(xa - 1, xb + 3, wy1, '#b07c48');
    foundation(p, x0 + 2, wy1 + 1, W - 4, baseH, o);
    return { posts, wy1 };
  }

  const S = A.SPRITES = A.SPRITES || {};

  S.palaceHall = () => A.sprite(192, 128, p => {
    const by = giwaRoof(p, 0, 0, 192, 60, true);
    hanokBody(p, 0, by, 192, 127, { palace: true, bays: 5, baseH: 12, inset: 12, tiers: true, stairs: 30, panels: ['door', 'door', 'door', 'door', 'door'] });
    board(p, 84, by + 3, 24, 9, 7);
  }, true);

  S.palaceGate = () => A.sprite(128, 48, p => {
    const by = giwaRoof(p, 0, 0, 128, 22, true);
    hanokBody(p, 0, by, 128, 47, { palace: true, posts: [6, 45, 80, 119], baseH: 3, inset: 6, panels: ['gateDoor', 'open', 'gateDoor'] });
    // 가운데 통로는 기단 없이 바닥으로
    for (let y = 44; y < 48; y++) for (let x = 48; x < 80; x++) p.px(x, y, y === 44 ? '#9d9583' : '#c4bca9');
    board(p, 56, by + 2, 16, 6, 3);
  }, true);

  S.southGate = () => A.sprite(96, 48, p => {
    const by = giwaRoof(p, 0, 0, 96, 22, false);
    hanokBody(p, 0, by, 96, 47, { posts: [6, 29, 64, 87], baseH: 3, inset: 6, panels: ['wall', 'gateDoor', 'wall'] });
  }, true);

  S.hanokPost = () => A.sprite(96, 80, p => {
    const by = giwaRoof(p, 0, 0, 96, 34, false);
    hanokBody(p, 0, by, 96, 79, { bays: 4, baseH: 6, inset: 7, porch: true, panels: ['window', 'door', 'door', 'window'] });
    board(p, 38, by + 2, 20, 7, 11);
  }, true);

  S.hanokGuide = () => A.sprite(80, 64, p => {
    const by = giwaRoof(p, 0, 0, 80, 28, false);
    hanokBody(p, 0, by, 80, 63, { bays: 3, baseH: 5, inset: 6, porch: true, panels: ['window', 'door', 'wall'] });
    board(p, 31, by + 2, 18, 6, 19);
  }, true);

  S.hanokHouse = () => A.sprite(80, 64, p => {
    const by = giwaRoof(p, 0, 0, 80, 28, false);
    hanokBody(p, 0, by, 80, 63, { bays: 3, baseH: 5, inset: 6, porch: true, panels: ['wall', 'door', 'window'] });
  }, true);

  S.choga = () => A.sprite(80, 60, p => {
    const by = chogaRoof(p, 0, 0, 80, 30);
    for (let x = 8; x < 72; x++) { p.px(x, by - 1, '#4a3620'); }
    hanokBody(p, 0, by, 80, 59, { bays: 3, baseH: 4, inset: 8, porch: true, panels: ['earth', 'door', 'earth'] });
  }, true);

  /* 돌담 — 가로 구간: 기와 지붕돌 + 돌 쌓은 면 (높이 24, 위로 8px 솟음) */
  function wallFace(p, x, y0, y1, ox) {
    for (let y = y0; y <= y1; y++) {
      const r = Math.floor((y - y0) / 5), ly = (y - y0) % 5;
      const local = x + ox + r * 3 + (H(r, 9) % 4);
      const sid = H(Math.floor(local / 7), r), lx = local % 7;
      let c = ['#a29a8a', '#968e7d', '#aea697', '#8b8373'][sid % 4];
      if (lx === 6 || ly === 4) c = '#7b6f5a';
      else if (lx === 0 || ly === 0) c = A.shade(c, 0.12);
      p.px(x, y, c);
    }
  }
  function wallCap(p, x, y0) {
    const m = x % 3;
    p.px(x, y0, ROOF.ridgeL); p.px(x, y0 + 1, ROOF.ridge);
    for (let y = y0 + 2; y <= y0 + 4; y++) p.px(x, y, m === 0 ? ROOF.dark : m === 1 ? ROOF.light : ROOF.base);
    p.px(x, y0 + 5, m === 0 ? ROOF.dark : ROOF.maksae);
    p.px(x, y0 + 6, ROOF.dark);
  }
  S.hwall = len => A.sprite(16 * len, 24, p => {
    const W = 16 * len;
    for (let x = 0; x < W; x++) {
      wallCap(p, x, 0);
      wallFace(p, x, 7, 23, 0);
      p.px(x, 7, '#5f574a');
    }
  });
  S.vwall = len => A.sprite(16, 16 * len + 8, p => {
    const Hh = 16 * len + 8, faceTop = Hh - 17;
    for (let y = 0; y < faceTop; y++) {
      for (let x = 0; x < 16; x++) {
        let c;
        if (x <= 1 || x >= 14) c = (H(x, y >> 2) % 3) ? '#968e7d' : '#aea697';
        else if (x === 7 || x === 8) c = y % 3 === 0 ? ROOF.ridgeL : ROOF.ridge;
        else c = y % 3 === 0 ? ROOF.dark : x < 7 ? ROOF.light : ROOF.base;
        p.px(x, y, c);
      }
    }
    for (let x = 0; x < 16; x++) { wallCap(p, x, faceTop - 6); wallFace(p, x, faceTop + 1, Hh - 1, 3); p.px(x, faceTop + 1, '#5f574a'); }
  });

  A.build = { giwaRoof, chogaRoof, hanokBody, board, WOOD, RED, ROOF };
})(window.GG);
