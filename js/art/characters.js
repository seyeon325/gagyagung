/* 캐릭터 — 16×22 프레임, 4방향 × 3프레임(서기·왼발·오른발)
 * 외형(LOOKS)만 바꾸면 새 주민을 만들 수 있습니다.
 */
(function (GG) {
  'use strict';
  const A = GG.art, sh = A.shade;
  const FW = 16, FH = 22, DIRS = ['down', 'up', 'left', 'right'];
  const EYE = '#2a1f1a', BLUSH = '#eba08e';

  const LOOKS = {
    player:   { skin: '#f2c9a0', hair: '#2b211c', style: 'braid', ribbon: '#c9452f', top: '#f3ead2', goreum: '#e0892e', bottom: '#3f6a5c', shoes: '#5a3d2b', bundle: '#d88a3a' },
    child:    { small: true, skin: '#f4cda6', hair: '#3a2a20', style: 'short', top: '#e9b44c', goreum: '#c9452f', bottom: '#7d5a9a', shoes: '#4a3326', mouth: true },
    keeper:   { skin: '#eac09a', hair: '#8c857c', style: 'gat', beard: true, top: '#e9e3d3', skirt: '#e1dacb', belt: '#4f5f8f', collar: '#ffffff' },
    merchant: { skin: '#eebf96', hair: '#2b211c', style: 'kerchief', kerchief: '#efe6d0', top: '#a8603c', goreum: '#3f6a5c', skirt: '#44608a' },
    postman:  { skin: '#e8b98f', hair: '#2b211c', style: 'paeraengi', top: '#7d8a5e', collar: '#efe6d0', bottom: '#d9cdb0', belt: '#5a3d2b', shoes: '#4a3326', bag: true },
    grandpa:  { skin: '#e6b48a', hair: '#d8d3ca', style: 'topknot', beard: true, top: '#b9c9b0', bottom: '#8a7a5a', belt: '#5a6f8a', shoes: '#4a3326' },
    grandma:  { skin: '#eebf9a', hair: '#c9c4bb', style: 'bun', top: '#e3b0a8', goreum: '#8a3a4a', skirt: '#5a5f7a' },
    villager: { skin: '#e6b48a', hair: '#2b211c', style: 'topknot', top: '#d8cdb5', bottom: '#9b8b6b', belt: '#6b5a3a', shoes: '#4a3326' },
    customer: { skin: '#f2c9a0', hair: '#3a2a20', style: 'ponytail', ribbon: '#3f6a5c', top: '#8fb3c9', goreum: '#d9a23a', skirt: '#c98a8a' }
  };

  function drawChar(p, L, dir, frame) {
    const small = !!L.small;
    const hy = small ? 7 : 3, by = hy + 9;
    const side = dir === 'left', back = dir === 'up';
    const skin = L.skin, hair = L.hair, hairS = sh(hair, -0.25), hairL = sh(hair, 0.25);
    const top = L.top, topS = sh(top, -0.18), shoe = L.shoes || '#4a3326';
    const bodyRows = L.skirt ? 3 : small ? 3 : 5;
    const bEnd = by + bodyRows - 1;

    /* ── 다리 / 치마 ── */
    if (L.skirt) {
      const sk = L.skirt, skS = sh(sk, -0.2);
      for (let y = by + 3; y <= 20; y++) {
        const wd = y >= 19 ? 1 : 0;
        const xa = (side ? 5 : 4) - wd, xb = (side ? 10 : 11) + wd;
        for (let x = xa; x <= xb; x++) p.px(x, y, x === xb || y === 20 ? skS : (x === xa ? sh(sk, 0.08) : sk));
      }
      const feet = side ? [[4, 1], [8, 2]] : [[5, 1], [9, 2]];
      feet.forEach(([fx, hideOn]) => { if (frame !== hideOn) { p.px(fx, 21, shoe); p.px(fx + 1, 21, shoe); } });
    } else {
      const bot = L.bottom, botS = sh(bot, -0.2);
      const legTop = bEnd + 1;
      const legs = side
        ? (frame === 0 ? [[6, 0, 1], [8, 0, 0]] : frame === 1 ? [[9, 0, 1], [4, 1, 0]] : [[9, 1, 1], [4, 0, 0]])
        : [[5, frame === 1 ? 1 : 0, 0], [9, frame === 2 ? 1 : 0, 0]];
      legs.forEach(([lx, lift, dark]) => {
        for (let y = legTop; y <= 19 - lift; y++) { p.px(lx, y, dark ? botS : bot); p.px(lx + 1, y, botS); }
        const sy = 20 - lift;
        p.rect(lx, sy, 2, 2, shoe);
        if (side) p.px(lx - 1, sy + 1, shoe);
      });
    }

    /* ── 몸통 (저고리) ── */
    const bx0 = side ? 5 : 4, bx1 = side ? 10 : 11;
    for (let y = by; y <= bEnd; y++) for (let x = bx0; x <= bx1; x++) p.px(x, y, x === bx1 ? topS : x === bx0 ? sh(top, 0.06) : top);
    const col = L.collar || '#f8f3e6';
    if (!back && !side) {
      p.px(6, by, col); p.px(9, by, col); p.px(7, by + 1, col); p.px(8, by + 1, col);
      if (L.goreum) { p.px(8, by + 2, L.goreum); p.px(9, by + 2, L.goreum); if (bodyRows > 3) { p.px(8, by + 3, L.goreum); p.px(9, by + 4, L.goreum); } else p.px(9, by + 3, L.goreum); }
    } else if (side) {
      p.px(5, by, col); p.px(6, by + 1, col);
      if (L.goreum) { p.px(5, by + 2, L.goreum); p.px(5, by + 3, L.goreum); }
    } else {
      p.hline(6, 9, by, col);
    }
    if (L.belt) { const bl = L.skirt ? by + 2 : bEnd; for (let x = bx0; x <= bx1; x++) p.px(x, bl, L.belt); }

    /* ── 팔 ── */
    const armLen = small ? 2 : 3;
    if (!side) {
      const sw = frame === 1 ? [1, 0] : frame === 2 ? [0, 1] : [0, 0];
      [[3, sw[0]], [12, sw[1]]].forEach(([ax, o]) => {
        for (let y = by + o; y < by + o + armLen; y++) p.px(ax, y, ax === 12 ? topS : top);
        p.px(ax, by + o + armLen, skin);
      });
    } else {
      const ax = frame === 1 ? 6 : frame === 2 ? 9 : 7;
      for (let y = by + 1; y < by + 1 + armLen; y++) { p.px(ax, y, topS); p.px(ax + 1, y, sh(top, -0.28)); }
      p.px(ax, by + 1 + armLen, skin); p.px(ax + 1, by + 1 + armLen, skin);
    }

    /* ── 가방·보따리 ── */
    if (L.bag) {
      const strap = '#6b4428', bag = '#8b5a36', flap = '#a8744a';
      if (!side) {
        const flip = back;
        for (let k = 0; k < 4; k++) p.px(flip ? 10 - k : 5 + k, by + k, strap);
        const bx = flip ? 2 : 11;
        p.rect(bx, by + 3, 3, 3, bag); p.hline(bx, bx + 2, by + 3, flap);
      } else { p.rect(7, by + 2, 4, 3, bag); p.hline(7, 10, by + 2, flap); }
    }
    if (L.bundle) {
      if (back) { p.rect(5, by, 6, 4, L.bundle); p.hline(5, 10, by, sh(L.bundle, 0.2)); p.px(7, by - 1, L.bundle); p.px(8, by - 1, L.bundle); }
      else if (side) { p.rect(10, by, 3, 4, L.bundle); p.px(10, by, sh(L.bundle, 0.2)); }
    }

    /* ── 머리 ── */
    const RD = [[5, 10], [4, 11], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [4, 11], [5, 10]];
    const RS = [[6, 10], [5, 11], [4, 11], [4, 11], [4, 11], [4, 11], [4, 11], [4, 10], [5, 9]];
    const R = side ? RS : RD;
    for (let r = 0; r < 9; r++) {
      const y = hy + r;
      for (let x = R[r][0]; x <= R[r][1]; x++) {
        let c;
        if (back) c = r >= 7 ? hairS : hair;
        else if (side) c = (r <= 2 || (x >= 9 && r <= 7) || (r === 3 && x <= 6)) ? hair : skin;
        else c = (r <= 2 || ((x === 3 || x === 12) && r <= 6) || (r === 3 && x !== 7 && x !== 8)) ? hair : skin;
        p.px(x, y, c);
      }
    }
    if (back) { p.px(3, hy + 5, skin); p.px(12, hy + 5, skin); p.px(6, hy + 1, hairL); p.px(7, hy + 1, hairL); }
    else if (side) {
      p.px(5, hy + 5, EYE); p.px(5, hy + 6, EYE); p.px(6, hy + 7, BLUSH); p.px(3, hy + 6, skin);
      p.px(9, hy + 5, skin); p.px(7, hy + 1, hairL); p.px(8, hy + 1, hairL);
    } else {
      p.px(5, hy + 5, EYE); p.px(5, hy + 6, EYE); p.px(10, hy + 5, EYE); p.px(10, hy + 6, EYE);
      p.px(4, hy + 7, BLUSH); p.px(11, hy + 7, BLUSH);
      if (L.mouth) p.px(7, hy + 8, '#c97a6a');
      p.px(6, hy + 1, hairL); p.px(7, hy + 1, hairL);
    }

    /* ── 수염 ── */
    if (L.beard) {
      const bc = '#efebe3';
      if (!back && !side) { for (let y = hy + 7; y <= hy + 9; y++) for (let x = 6; x <= 9; x++) if (!(y === hy + 9 && (x === 6 || x === 9))) p.px(x, y, bc); }
      else if (side) { for (let y = hy + 7; y <= hy + 9; y++) for (let x = 4; x <= 6; x++) p.px(x, y, bc); }
    }

    /* ── 머리 모양 · 모자 ── */
    switch (L.style) {
      case 'braid':
        if (back) { for (let y = hy + 8; y <= by + 3; y++) { p.px(7, y, hair); p.px(8, y, hairS); } p.rect(7, by + 4, 2, 2, L.ribbon); }
        else if (side) { for (let y = hy + 6; y <= by + 2; y++) p.px(11, y, hair); p.rect(11, by + 3, 1, 2, L.ribbon); p.px(12, by + 4, L.ribbon); }
        else { p.px(12, hy + 7, hair); p.px(12, hy + 8, L.ribbon); }
        break;
      case 'ponytail':
        if (back) { for (let y = hy + 3; y <= hy + 9; y++) { p.px(7, y, hairS); p.px(8, y, hairS); } p.rect(7, hy + 2, 2, 1, L.ribbon); }
        else if (side) { for (let y = hy + 2; y <= hy + 8; y++) p.px(12, y, hair); p.px(11, hy + 2, L.ribbon); }
        break;
      case 'kerchief': {
        const k = L.kerchief, kS = sh(k, -0.15);
        for (let r = 0; r <= 3; r++) for (let x = R[r][0]; x <= R[r][1]; x++) {
          if (side && r === 3 && x <= 6) continue;
          if (!side && !back && r === 3 && x > 3 && x < 12) continue;
          p.px(x, hy + r, r === 3 ? kS : k);
        }
        if (back) { p.px(7, hy + 4, kS); p.px(8, hy + 4, kS); p.px(6, hy + 5, k); p.px(9, hy + 5, k); }
        else if (side) { p.px(12, hy + 3, k); p.px(12, hy + 4, kS); }
        else { p.px(12, hy + 3, kS); p.px(13, hy + 4, k); }
        break;
      }
      case 'gat': {
        const g = '#2a2627', gl = '#4a4445';
        for (let x = 1; x <= 14; x++) p.px(x, hy + 1, x % 2 ? g : gl);
        for (let y = hy - 3; y <= hy; y++) for (let x = 5; x <= 10; x++) p.px(x, y, g);
        p.px(6, hy - 3, gl); p.px(6, hy - 2, gl);
        if (!back && !side) { p.px(4, hy + 3, '#5a3b2a'); p.px(11, hy + 3, '#5a3b2a'); }
        break;
      }
      case 'paeraengi': {
        const c1 = '#c9a46a', c2 = '#b38c55';
        for (let x = 2; x <= 13; x++) p.px(x, hy + 1, c2);
        for (let y = hy - 2; y <= hy; y++) for (let x = 5; x <= 10; x++) p.px(x, y, y === hy ? '#6b4a2a' : c1);
        p.px(5, hy - 2, sh(c1, 0.2));
        break;
      }
      case 'bun':
        if (back) { p.ellipse(7.5, hy + 6, 2, 1.5, hairS); p.hline(4, 11, hy + 6, '#d9b24a'); }
        else if (side) { p.rect(11, hy + 4, 2, 3, hairS); p.hline(10, 13, hy + 5, '#d9b24a'); }
        else { p.px(7, hy, sh(hair, -0.1)); p.px(8, hy, sh(hair, -0.1)); }
        break;
      case 'topknot':
        p.rect(7, hy - 2, 2, 2, hair);
        for (let x = R[2][0]; x <= R[2][1]; x++) p.px(x, hy + 2, '#1f1a18');
        break;
    }
  }

  /* 고양이 (옆모습 2프레임) */
  function drawCat(p, frame) {
    const b = '#d99a4e', d = '#b0732f', w = '#f3e6cf';
    for (let y = 13; y <= 17; y++) for (let x = 4; x <= 12; x++) p.px(x, y, (x % 3 === 0 && y < 16) ? d : b);
    p.hline(5, 11, 17, w);
    p.rect(1, 10, 5, 5, b); p.px(1, 9, b); p.px(4, 9, b); p.px(2, 12, '#2a1f1a'); p.px(1, 14, w); p.px(2, 14, w);
    const legs = frame ? [4, 7, 10, 12] : [5, 6, 11, 12];
    legs.forEach(x => { p.px(x, 18, b); p.px(x, 19, d); });
    p.px(13, 13, b); p.px(14, 12, b); p.px(14, 11, d); p.px(15, 10, d);
  }

  const sheets = {};
  /* sheet[dir][frame] = canvas */
  A.getCharacter = function (lookName) {
    if (sheets[lookName]) return sheets[lookName];
    const out = {};
    if (lookName === 'cat') {
      const l0 = A.sprite(FW, FH, p => drawCat(p, 0), true), l1 = A.sprite(FW, FH, p => drawCat(p, 1), true);
      out.left = [l0, l1, l0]; out.right = [A.flipX(l0), A.flipX(l1), A.flipX(l0)];
      out.up = out.left; out.down = out.right;
    } else {
      const L = LOOKS[lookName];
      ['down', 'up', 'left'].forEach(d => { out[d] = [0, 1, 2].map(f => A.sprite(FW, FH, p => drawChar(p, L, d, f), true)); });
      out.right = out.left.map(c => A.flipX(c));
    }
    out.small = lookName === 'cat' || !!(LOOKS[lookName] && LOOKS[lookName].small);
    sheets[lookName] = out;
    return out;
  };
  A.CHAR = { FW, FH, DIRS, LOOKS };
})(window.GG);
