/* 소품 — 나무 · 장터 가판 · 장독대 · 한지 등불 · 석등 · 우물 · 안내판 · 서찰함 · 평상 … */
(function (GG) {
  'use strict';
  const A = GG.art, H = GG.util.hash, S = A.SPRITES, W = A.build.WOOD;

  /* 나뭇잎 덩어리: 왼쪽 위에서 빛이 드는 음영 */
  function canopy(p, cx, cy, rx, ry, pal, seed) {
    p.ellipse(cx, cy, rx, ry, (x, y, nx, ny) => {
      const n = (H(x + seed, y * 3) % 100) / 100;
      const l = -(nx * 0.55 + ny * 0.85) + (n - 0.5) * 0.55;
      if (l > 0.55) return pal[3];
      if (l > 0.05) return pal[2];
      if (l > -0.55) return pal[1];
      return pal[0];
    });
  }
  const PINE = ['#24432c', '#2f5537', '#3f6b45', '#5a8a58'];
  const LEAF = ['#39602f', '#4a763c', '#5f8f4a', '#7eab5f'];
  const ZEL = ['#355a2e', '#467139', '#5b8946', '#79a65a'];

  function trunk(p, x0, y0, y1, w, bend) {
    for (let y = y0; y <= y1; y++) {
      const off = bend && y < y0 + (y1 - y0) * 0.5 ? bend : 0;
      for (let i = 0; i < w; i++) p.px(x0 + i + off, y, i === 0 ? '#a26d48' : i === w - 1 ? '#5c3a26' : '#83563a');
    }
  }

  S.pine = () => A.sprite(32, 48, p => {
    trunk(p, 14, 18, 46, 4, -1);
    p.px(12, 46, '#5c3a26'); p.px(19, 46, '#5c3a26');
    canopy(p, 16, 22, 14, 6, PINE, 1);
    canopy(p, 10, 13, 9, 5, PINE, 2);
    canopy(p, 21, 11, 9, 5, PINE, 3);
    canopy(p, 16, 5, 7, 4, PINE, 4);
  }, true);

  S.tree = () => A.sprite(32, 40, p => {
    trunk(p, 14, 24, 38, 4, 0);
    canopy(p, 16, 16, 14, 12, LEAF, 5);
    canopy(p, 9, 19, 7, 6, LEAF, 6);
    canopy(p, 23, 18, 7, 6, LEAF, 7);
    canopy(p, 15, 8, 8, 6, LEAF, 8);
  }, true);

  S.zelkova = () => A.sprite(60, 68, p => {
    trunk(p, 25, 34, 66, 8, 0);
    p.px(23, 66, '#5c3a26'); p.px(24, 65, '#83563a'); p.px(34, 66, '#5c3a26'); p.px(33, 65, '#83563a');
    canopy(p, 30, 26, 27, 17, ZEL, 9);
    canopy(p, 14, 28, 12, 10, ZEL, 10);
    canopy(p, 46, 27, 12, 10, ZEL, 11);
    canopy(p, 30, 13, 17, 10, ZEL, 12);
  }, true);

  /* 장터 가판 */
  const AWN = { indigo: ['#4c5f8a', '#3d4d73'], red: ['#b4533f', '#934232'], ochre: ['#c99a3e', '#a87f30'] };
  const PRODUCE = {
    cabbage: ['#5f8f45', '#7fae5a', '#a9cf7f'],
    radish: ['#efeadb', '#d8d1bd', '#6f9a48'],
    apple: ['#a8352c', '#c9453a', '#e77a6a'],
    persimmon: ['#c06a1f', '#e08a2e', '#f2b25c'],
    potato: ['#6e3a48', '#8a4a5a', '#a86476'],
    beans: ['#b89a62', '#d9c08a', '#efdcaa'],
    chili: ['#9a2a20', '#c0392b', '#e0604c'],
    chive: ['#3f7a35', '#5f9f45', '#8cc865'],
    eggplant: ['#3e2350', '#5b3473', '#8a5aa6']
  };
  function basket(p, x, y, kind) {
    const c = PRODUCE[kind];
    if (kind === 'chive') {
      // 부추: 가늘고 긴 잎 다발
      for (let k = 0; k < 10; k++) {
        const bx = x + 1 + k, top = y - 5 - (k % 3);
        for (let yy = top; yy < y; yy++) p.px(bx, yy, k % 2 ? c[1] : c[0]);
        p.px(bx, top, c[2]);
      }
    }
    for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) {
      if ((j === 4 && (i === 0 || i === 11))) continue;
      p.px(x + i, y + j, (i + j) % 3 === 0 ? '#9c7a45' : '#b8925a');
    }
    p.hline(x, x + 11, y, '#d1ad72');
    if (kind === 'chive') return;
    if (kind === 'eggplant') {
      for (let k = 0; k < 3; k++) { const ex = x + 1 + k * 4; p.rect(ex, y - 2, 3, 2, c[1]); p.px(ex, y - 2, c[2]); p.px(ex + 2, y - 3, '#5f8f45'); }
      return;
    }
    for (let k = 0; k < 7; k++) {
      const px = x + 1 + (k * 3) % 10, py = y - 2 + (k % 2);
      p.px(px, py, c[1]); p.px(px + 1, py, c[1]); p.px(px, py - 1, c[2]); p.px(px + 1, py + 1, c[0]);
    }
    if (kind === 'radish') { p.px(x + 3, y - 4, c[2]); p.px(x + 7, y - 4, c[2]); p.px(x + 5, y - 5, c[2]); }
  }
  S.stall = v => A.sprite(48, 44, p => {
    const [a, aD] = AWN[v.color];
    p.rect(4, 10, 2, 30, W.d); p.rect(42, 10, 2, 30, W.d);
    for (let y = 2; y <= 13; y++) {
      const ins = Math.max(0, 5 - Math.floor((y - 2) / 2));
      for (let x = 1 + ins; x <= 46 - ins; x++) {
        const stripe = Math.floor((x - 1) / 6) % 2 === 0;
        let c = stripe ? a : '#efe3c6';
        if (y === 2) c = A.shade(c, 0.15);
        if (y >= 12) c = A.shade(c, -0.15);
        p.px(x, y, c);
      }
    }
    for (let x = 1; x <= 46; x++) {
      const m = (x - 1) % 6;
      if (m >= 1 && m <= 4) p.px(x, 14, Math.floor((x - 1) / 6) % 2 === 0 ? aD : '#d8caa8');
    }
    // 걸린 간판
    p.vline(20, 14, 15, W.dd); p.vline(27, 14, 15, W.dd);
    A.build.board(p, 17, 16, 14, 5, v.seed || 1);
    // 판매대
    for (let x = 2; x <= 45; x++) { p.px(x, 26, '#d0a26a'); p.px(x, 27, '#b07c48'); p.px(x, 28, '#9a6a3c'); }
    for (let y = 29; y <= 38; y++) for (let x = 3; x <= 44; x++) p.px(x, y, (x - 3) % 7 === 0 ? W.d : y === 38 ? W.dd : W.m);
    p.rect(4, 39, 2, 4, W.dd); p.rect(42, 39, 2, 4, W.dd);
    v.goods.forEach((g, k) => basket(p, 5 + k * 13, 21, g));
  }, true);

  /* 장독대: 돌 단 위의 크고 작은 옹기 */
  function onggi(p, cx, by, rx, h) {
    for (let j = 0; j <= h; j++) {
      const t = j / h;
      const w = Math.round(rx * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.12))));
      const y = by - h + j;
      for (let x = -w; x <= w; x++) {
        const u = x / (w || 1);
        let c = u < -0.45 ? '#94603a' : u > 0.5 ? '#55311c' : '#764829';
        if (j === h) c = '#4a2a18';
        if (u < -0.6 && t > 0.2 && t < 0.6) c = '#b07a50';
        p.px(cx + x, y, c);
      }
    }
    const rw = Math.round(rx * 0.62);
    p.hline(cx - rw, cx + rw, by - h - 1, '#8a5532');
    p.hline(cx - rw + 1, cx + rw - 1, by - h - 2, '#5a331d');
    p.hline(cx - rw + 2, cx + rw - 2, by - h - 3, '#6b3f25');
    p.px(cx, by - h - 4, '#6b3f25');
  }
  S.jangdok = () => A.sprite(42, 30, p => {
    for (let y = 21; y <= 29; y++) for (let x = 1; x <= 40; x++) {
      const sid = H(Math.floor((x + (y > 24 ? 3 : 0)) / 6), y > 24 ? 1 : 0);
      let c = ['#a29a8a', '#968e7d', '#aea697'][sid % 3];
      if (y === 21) c = '#c8c1b1';
      if (y === 29) c = '#7d7566';
      if ((x + (y > 24 ? 3 : 0)) % 6 === 0 && y > 21) c = '#857d6d';
      p.px(x, y, c);
    }
    onggi(p, 10, 21, 7, 13);
    onggi(p, 24, 20, 9, 16);
    onggi(p, 35, 21, 6, 11);
    onggi(p, 16, 25, 4, 7);
    onggi(p, 30, 26, 5, 8);
  }, true);

  /* 한지 등불 (기둥에 매단 등) */
  S.lantern = v => A.sprite(14, 32, p => {
    const lit = v && v.lit;
    p.rect(1, 28, 6, 3, '#9a927f'); p.hline(1, 6, 28, '#bdb6a6');
    for (let y = 4; y <= 28; y++) { p.px(3, y, W.l); p.px(4, y, W.d); }
    p.hline(3, 11, 3, W.m); p.hline(3, 11, 4, W.dd);
    p.px(10, 5, '#3a2a20');
    const body = lit ? '#ffe7a3' : '#cbbf9f', rib = lit ? '#f0b85a' : '#a49878', core = lit ? '#fff6d2' : '#d8cdb0';
    p.hline(9, 11, 6, '#7a3a22');
    for (let y = 7; y <= 14; y++) {
      const w = y === 7 || y === 14 ? 1 : 2;
      for (let x = 10 - w; x <= 10 + w; x++) p.px(x, y, x === 10 ? rib : (lit && y > 8 && y < 13 && Math.abs(x - 10) < 2 ? core : body));
    }
    p.hline(9, 11, 15, '#7a3a22');
    p.px(10, 16, '#c0392b'); p.px(10, 17, '#c0392b'); p.px(9, 18, '#a8322a'); p.px(11, 18, '#a8322a');
  }, true);

  /* 석등 — 말빛 등 */
  S.stoneLantern = v => A.sprite(20, 38, p => {
    const lit = v && v.lit;
    const st = ['#8d8778', '#a9a395', '#c4beb0'];
    const sp = (x, y, u) => p.px(x, y, u < 0.3 ? st[2] : u > 0.7 ? st[0] : st[1]);
    for (let y = 32; y <= 37; y++) for (let x = 2; x <= 17; x++) sp(x, y, (x - 2) / 15);
    p.hline(2, 17, 32, '#d3cdc0');
    for (let y = 21; y <= 31; y++) for (let x = 8; x <= 11; x++) sp(x, y, (x - 8) / 3);
    for (let y = 19; y <= 20; y++) for (let x = 4; x <= 15; x++) sp(x, y, (x - 4) / 11);
    for (let y = 11; y <= 18; y++) for (let x = 6; x <= 13; x++) sp(x, y, (x - 6) / 7);
    for (let y = 12; y <= 17; y++) for (let x = 8; x <= 11; x++) {
      p.px(x, y, lit ? (y > 13 && y < 16 && x > 8 && x < 11 ? '#fff4c0' : '#ffcf62') : (y < 14 ? '#2a2622' : '#3a3530'));
    }
    for (let y = 7; y <= 10; y++) {
      const ins = 10 - y;
      for (let x = 1 + ins; x <= 18 - ins; x++) sp(x, y, (x - 1) / 17);
    }
    p.px(1, 6, st[1]); p.px(18, 6, st[0]);
    p.hline(2, 17, 10, st[0]);
    p.rect(8, 3, 4, 4, st[1]); p.px(8, 3, st[2]); p.rect(9, 1, 2, 2, st[1]);
  }, true);

  /* 우물 */
  S.well = () => A.sprite(26, 24, p => {
    for (let y = 11; y <= 22; y++) for (let x = 1; x <= 24; x++) {
      const r = Math.floor((y - 11) / 4), lx = (x + r * 3) % 6;
      let c = ['#a29a8a', '#968e7d', '#aea697'][H(Math.floor((x + r * 3) / 6), r) % 3];
      if (lx === 5 || (y - 11) % 4 === 3) c = '#7b6f5a';
      if (y === 22) c = '#6e6556';
      p.px(x, y, c);
    }
    p.ellipse(12.5, 11, 11.5, 5, (x, y, nx, ny) => (nx * nx + ny * ny > 0.45 ? (ny < 0 ? '#c8c1b1' : '#aea697') : (ny < -0.1 ? '#22363c' : '#2f4a52')));
    p.px(10, 10, '#6f97a0'); p.px(11, 10, '#6f97a0');
    p.rect(19, 4, 5, 5, W.m); p.hline(19, 23, 4, W.l); p.vline(23, 4, 8, W.dd);
    p.vline(21, 1, 3, '#cdb88a');
  }, true);

  /* 안내판 — old: 빽빽한 어려운 글 / new: 쉬운 글 */
  S.sign = v => A.sprite(36, 32, p => {
    const fresh = v && v.fresh;
    p.rect(4, 16, 2, 15, W.d); p.rect(30, 16, 2, 15, W.d);
    for (let x = 0; x <= 35; x++) { p.px(x, 0, A.build.ROOF.ridge); p.px(x, 1, x % 3 ? A.build.ROOF.base : A.build.ROOF.dark); p.px(x, 2, A.build.ROOF.dark); }
    p.rect(1, 3, 34, 16, W.m);
    p.rect(2, 4, 32, 14, fresh ? '#f7f0dc' : '#d8ceb3');
    if (fresh) {
      p.rect(3, 5, 30, 3, '#3f6a5c');
      for (let r = 0; r < 2; r++) for (let x = 5; x < 31; x++) if (H(x >> 1, r + 40) % 5) p.px(x, 10 + r * 3, '#3a2a1e');
    } else {
      for (let r = 0; r < 6; r++) for (let x = 4; x < 32; x++) if (H(x, r) % 4) p.px(x, 5 + r * 2, '#4d3e31');
    }
  }, true);

  S.signpost = () => A.sprite(20, 30, p => {
    p.rect(9, 10, 2, 19, W.d);
    p.rect(1, 2, 18, 10, '#b98a55');
    p.hline(1, 18, 2, '#d6aa72'); p.hline(1, 18, 11, W.d);
    p.vline(1, 2, 11, W.d); p.vline(18, 2, 11, W.d);
    for (let g = 0; g < 2; g++) { p.rect(5 + g * 6, 5, 3, 1, '#7a2e22'); p.rect(6 + g * 6, 4, 1, 4, '#7a2e22'); p.px(5 + g * 6, 8, '#7a2e22'); p.px(7 + g * 6, 8, '#7a2e22'); }
  }, true);

  /* 서찰함 (색 표식으로 구분) */
  S.mailbox = v => A.sprite(14, 22, p => {
    p.rect(6, 12, 2, 10, W.d);
    for (let x = 0; x <= 13; x++) { p.px(x, 2, A.build.ROOF.ridge); p.px(x, 3, x % 3 ? A.build.ROOF.base : A.build.ROOF.dark); }
    p.rect(1, 4, 12, 9, W.l);
    p.rect(1, 9, 12, 4, W.m);
    p.hline(3, 10, 6, '#3b2a20');
    p.rect(5, 9, 4, 3, v.color);
    p.px(5, 9, A.shade(v.color, 0.3));
    p.hline(1, 12, 12, W.dd);
  }, true);

  S.pyeongsang = () => A.sprite(34, 18, p => {
    for (let y = 3; y <= 9; y++) for (let x = 1; x <= 32; x++) p.px(x, y, (x - 1) % 5 === 0 ? '#9c6f40' : y === 3 ? '#d4a670' : '#bb8c56');
    p.hline(1, 32, 10, W.m); p.hline(1, 32, 11, W.d);
    p.rect(2, 12, 3, 5, W.dd); p.rect(29, 12, 3, 5, W.dd);
  }, true);

  S.crate = () => A.sprite(14, 13, p => {
    p.rect(1, 1, 12, 11, W.m);
    p.hline(1, 12, 1, W.l); p.hline(1, 12, 6, W.d); p.hline(1, 12, 11, W.dd);
    p.vline(1, 1, 11, W.d); p.vline(12, 1, 11, W.dd);
  }, true);

  S.basket = v => A.sprite(14, 13, p => basket(p, 1, 7, v.goods), true);

  /* 들고 있는 물건 아이콘 (HUD) */
  S.itemIcon = v => A.sprite(16, 16, p => {
    const k = v.id;
    if (k === 'letter') {
      p.rect(2, 4, 12, 9, '#f3e7c6'); p.hline(2, 13, 4, '#fff6dc');
      p.line(2, 4, 8, 9, '#c9b48a'); p.line(13, 4, 8, 9, '#c9b48a');
      p.rect(7, 8, 3, 3, '#b8402f'); p.px(7, 8, '#e06a52');
      return;
    }
    const c = PRODUCE[k];
    if (k === 'chive') { for (let i = 0; i < 7; i++) { p.vline(4 + i, 2 + (i % 3), 13, i % 2 ? c[1] : c[0]); p.px(4 + i, 2 + (i % 3), c[2]); } p.hline(4, 10, 10, '#d9b24a'); }
    else if (k === 'radish') { p.ellipse(8, 10, 3.5, 4, (x, y, nx) => (nx < -0.3 ? '#ffffff' : nx > 0.5 ? '#cfc8b4' : c[0])); p.rect(6, 4, 4, 2, '#b9d38a'); p.vline(6, 1, 4, '#6f9a48'); p.vline(9, 1, 4, '#6f9a48'); p.vline(8, 2, 4, '#87b45a'); p.px(8, 14, '#cfc8b4'); }
    else if (k === 'cabbage') { p.ellipse(8, 9, 6, 5, (x, y, nx, ny) => (ny < -0.3 ? c[2] : nx > 0.4 ? c[0] : c[1])); p.vline(8, 5, 13, '#d9ecb8'); }
    else if (k === 'chili') { p.line(4, 12, 11, 5, c[1]); p.line(5, 12, 12, 5, c[1]); p.line(5, 13, 12, 6, c[0]); p.px(12, 4, '#5f8f45'); p.px(13, 3, '#5f8f45'); p.px(6, 11, c[2]); }
    else if (k === 'eggplant') { p.ellipse(8, 9, 3.5, 5, (x, y, nx) => (nx < -0.3 ? c[2] : nx > 0.4 ? c[0] : c[1])); p.rect(6, 2, 5, 2, '#5f8f45'); p.px(8, 1, '#5f8f45'); }
  }, true);

  S.flowers = v => A.sprite(16, 9, p => {
    const cols = [['#eaa6a5', '#d4787a'], ['#f2d36b', '#d9a23a'], ['#f1e7c9', '#d6c9a0'], ['#c9b4e0', '#a88cc6']];
    for (let k = 0; k < 6; k++) {
      const x = 2 + (H(k, v.seed) % 12), y = 3 + (H(v.seed, k) % 5), c = cols[(k + v.seed) % 4];
      p.px(x, y + 1, '#5d7a3c'); p.px(x, y + 2, '#5d7a3c');
      p.px(x - 1, y, c[0]); p.px(x + 1, y, c[0]); p.px(x, y - 1, c[0]); p.px(x, y, c[1]);
    }
  });

  S.rock = () => A.sprite(13, 9, p => {
    p.ellipse(6, 5, 5, 3, (x, y, nx, ny) => (nx + ny < -0.5 ? '#c4beb0' : nx + ny > 0.6 ? '#7d7768' : '#a29b8b'));
  }, true);

  S.reeds = () => A.sprite(12, 16, p => {
    for (let k = 0; k < 5; k++) {
      const x = 2 + k * 2, top = 2 + (H(k, 5) % 5);
      p.vline(x, top, 15, k % 2 ? '#6f8f45' : '#87a85a');
      p.px(x, top - 1, '#8a6a3c'); p.px(x, top, '#8a6a3c');
    }
  });

  S.lotus = () => A.sprite(10, 6, p => {
    p.ellipse(4, 3, 4, 2, (x, y, nx) => (nx < -0.3 ? '#7fae5a' : '#5f8f45'));
    p.px(5, 2, '#5d97a3');
    p.px(7, 1, '#f0a8b8'); p.px(8, 1, '#e88aa0'); p.px(7, 0, '#f7c8d2');
  });

  /* 말 표시 아이콘 (월드 위에 그림) */
  S.iconTalk = () => A.sprite(13, 11, p => {
    p.rect(1, 0, 11, 7, '#fbf5e6'); p.hline(0, 12, 1, '#fbf5e6'); p.hline(0, 12, 5, '#fbf5e6');
    p.rect(0, 1, 13, 5, '#fbf5e6');
    p.px(4, 7, '#fbf5e6'); p.px(5, 7, '#fbf5e6'); p.px(4, 8, '#fbf5e6');
    p.px(3, 3, '#3a2a1e'); p.px(6, 3, '#3a2a1e'); p.px(9, 3, '#3a2a1e');
  }, true);
  S.iconQuest = () => A.sprite(7, 12, p => {
    p.rect(2, 0, 3, 7, '#ffd25e'); p.vline(2, 0, 6, '#fff0b0');
    p.rect(2, 8, 3, 3, '#ffd25e'); p.px(2, 8, '#fff0b0');
  }, '#5a3410');
  S.iconActive = () => A.sprite(11, 7, p => {
    p.rect(0, 0, 11, 6, '#ffd25e');
    p.px(2, 2, '#7a4a12'); p.px(5, 2, '#7a4a12'); p.px(8, 2, '#7a4a12');
    p.px(3, 6, '#ffd25e');
  }, '#5a3410');

  /* 감정 말풍선: heart · note · sweat · surprise */
  S.emote = v => A.sprite(11, 11, p => {
    p.rect(1, 0, 9, 8, '#fbf5e6'); p.rect(0, 1, 11, 6, '#fbf5e6');
    p.px(3, 8, '#fbf5e6'); p.px(4, 8, '#fbf5e6'); p.px(3, 9, '#fbf5e6');
    const k = v.kind;
    if (k === 'heart') { const c = '#d9534a'; p.px(3, 2, c); p.px(4, 2, c); p.px(6, 2, c); p.px(7, 2, c); p.hline(2, 8, 3, c); p.hline(3, 7, 4, c); p.hline(4, 6, 5, c); p.px(5, 6, c); p.px(3, 3, '#f29a8e'); }
    else if (k === 'note') { const c = '#3f6a5c'; p.vline(6, 1, 5, c); p.px(7, 1, c); p.px(8, 2, c); p.rect(4, 5, 2, 2, c); p.px(3, 6, c); }
    else if (k === 'sweat') { const c = '#5b8fc7'; p.px(5, 1, c); p.vline(4, 2, 3, c); p.vline(6, 2, 3, c); p.hline(4, 6, 4, c); p.px(5, 5, '#2f5f96'); p.px(5, 3, '#cfe3f7'); }
    else { const c = '#e08a2e'; p.vline(5, 1, 4, c); p.px(5, 6, c); }
  }, true);
  S.butterfly = v => A.sprite(5, 3, p => {
    const c = v.color, d = A.shade(v.color, -0.3);
    if (v.f) { p.px(0, 0, c); p.px(1, 1, d); p.px(2, 1, '#3a2a1e'); p.px(3, 1, d); p.px(4, 0, c); p.px(0, 1, c); p.px(4, 1, c); }
    else { p.px(1, 0, c); p.px(2, 1, '#3a2a1e'); p.px(3, 0, c); p.px(1, 1, d); p.px(3, 1, d); }
  });

  /* 등불 빛 (계단식 원 — 픽셀 아트 느낌) */
  A.makeGlow = function (r, color) {
    const size = r * 2;
    const p = new A.Painter(size, size);
    const [cr, cg, cb] = A.parse(color);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
      if (d >= 1) continue;
      const dither = ((x + y) & 1) * 0.06;
      const lv = d + dither < 0.3 ? 0.55 : d + dither < 0.55 ? 0.32 : d + dither < 0.8 ? 0.16 : 0.06;
      p.px(x, y, [cr, cg, cb, Math.round(lv * 255)]);
    }
    return p.toCanvas();
  };
})(window.GG);
