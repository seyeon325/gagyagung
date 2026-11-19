/* 바닥 타일: g 풀밭 · d 흙길 · s 박석(돌 포장) · y 궁궐 마당(마사토) · p 월대 · w 물 */
(function (GG) {
  'use strict';
  const T = 16, H = GG.util.hash;

  const GRASS = ['#86a358', '#89a65b', '#84a056', '#8ba85d'];
  const DIRT = ['#c8a672', '#c5a36f', '#caa975'];
  const STONE = ['#c9c1ae', '#c1b9a5', '#cec7b5', '#bcb4a0'];

  function texel(t, X, Y) {
    const n = H(X, Y) % 100;
    switch (t) {
      case 'g': {
        const base = GRASS[H(X >> 3, Y >> 3) % 4];
        if (n < 5) return '#749149';
        if (n < 9) return '#9bb66b';
        return base;
      }
      case 'd': {
        const base = DIRT[H(X >> 2, Y >> 2) % 3];
        if (n < 6) return '#b5935e';
        if (n < 10) return '#d7bd8b';
        return base;
      }
      case 'y': {
        if (n < 6) return '#d3c39e';
        if (n < 9) return '#ece0c3';
        return '#e1d3b0';
      }
      case 's': {
        const row = Math.floor(Y / 7);
        const off = (row % 2) * 5 + (H(row, 3) % 3);
        const lx = (X + off) % 10, ly = Y % 7;
        const sid = H(Math.floor((X + off) / 10), row);
        if (lx === 9 || ly === 6) return '#9d9583';
        if (lx === 0 || ly === 0) return '#d8d1c0';
        const tone = STONE[sid % 4];
        return n < 7 ? GG.art.shade(tone, -0.06) : tone;
      }
      case 'p': {
        const ly = Y % 8, row = Math.floor(Y / 8);
        const lx2 = (X + (row % 2) * 8) % 16;
        if (ly === 7 || lx2 === 15) return '#a9a190';
        if (ly === 0) return '#e1dbcc';
        return n < 6 ? '#ccc5b4' : '#d5cebe';
      }
      case 'w': {
        const wave = ((X + Math.floor(Y / 4) * 5) % 14 < 3) && (Y % 4 === 0);
        if (wave) return '#87bcc2';
        if (n < 5) return '#548d99';
        return '#5d97a3';
      }
    }
    return '#ff00ff';
  }

  function paintGround(grid, W, Ht) {
    const P = new GG.art.Painter(W * T, Ht * T);
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= Ht ? null : grid[y][x]);

    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < W; tx++) {
      const t = grid[ty][tx];
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
        const X = tx * T + px, Y = ty * T + py;
        P.px(X, Y, texel(t, X, Y));
      }
    }

    // 경계: 길·돌 포장 가장자리에 풀이 자연스럽게 덮이도록
    const soft = { d: 1, s: 1, y: 1, p: 1 };
    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < W; tx++) {
      const t = grid[ty][tx];
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      if (soft[t]) {
        for (const [dx, dy] of dirs) {
          if (at(tx + dx, ty + dy) !== 'g') continue;
          for (let k = 0; k < T; k++) {
            const depth = H(tx * 31 + k + dx * 7, ty * 17 + k + dy * 5) % 3;
            for (let d = 0; d <= depth; d++) {
              let px, py;
              if (dy === -1) { px = k; py = d; } else if (dy === 1) { px = k; py = T - 1 - d; }
              else if (dx === -1) { px = d; py = k; } else { px = T - 1 - d; py = k; }
              const X = tx * T + px, Y = ty * T + py;
              P.px(X, Y, d === depth ? GG.art.shade(texel(t, X, Y), -0.14) : texel('g', X, Y));
            }
          }
        }
      }
      if (t === 'w') {
        for (const [dx, dy] of dirs) {
          if (at(tx + dx, ty + dy) === 'w') continue;
          for (let k = 0; k < T; k++) for (let d = 0; d < (dy === -1 ? 4 : 2); d++) {
            let px, py;
            if (dy === -1) { px = k; py = d; } else if (dy === 1) { px = k; py = T - 1 - d; }
            else if (dx === -1) { px = d; py = k; } else { px = T - 1 - d; py = k; }
            const X = tx * T + px, Y = ty * T + py;
            let c;
            if (dy === -1) c = d === 0 ? '#9b8d6c' : d === 1 ? '#7d6f53' : d === 2 ? '#3d6670' : '#4a7d88';
            else c = d === 0 ? (H(X, Y) % 3 ? '#8e8770' : '#a59f88') : '#3f6c76';
            P.px(X, Y, c);
          }
        }
      }
    }

    // 잔디 포기 · 들꽃 · 자갈
    const FLOW = ['#f1e7c9', '#eaa6a5', '#f2d36b', '#c9b4e0'];
    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < W; tx++) {
      const t = grid[ty][tx], h = H(tx * 7 + 3, ty * 13 + 1);
      const ox = tx * T, oy = ty * T;
      if (t === 'g') {
        const tufts = h % 3;
        for (let k = 0; k < tufts; k++) {
          const hx = 2 + (H(tx + k * 11, ty) % 12), hy = 3 + (H(tx, ty + k * 7) % 11);
          P.px(ox + hx - 1, oy + hy - 1, '#62803f'); P.px(ox + hx, oy + hy, '#62803f'); P.px(ox + hx + 1, oy + hy - 1, '#62803f');
          P.px(ox + hx, oy + hy - 2, '#a4bf72');
        }
        if (h % 23 === 0) {
          const fx = ox + 3 + (h >> 4) % 10, fy = oy + 3 + (h >> 8) % 10, fc = FLOW[(h >> 3) % 4];
          P.px(fx - 1, fy, fc); P.px(fx + 1, fy, fc); P.px(fx, fy - 1, fc); P.px(fx, fy + 1, fc); P.px(fx, fy, '#e3a43a');
        }
      } else if (t === 'd' && h % 4 === 0) {
        const fx = ox + 2 + (h >> 4) % 12, fy = oy + 2 + (h >> 8) % 12;
        P.px(fx, fy, '#9f8456'); P.px(fx + 1, fy, '#a98d5d'); P.px(fx, fy - 1, '#dcc495');
      }
    }
    return P;
  }

  GG.art.paintGround = paintGround;
})(window.GG);
