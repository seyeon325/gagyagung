/* 픽셀 페인터 — 모든 그래픽은 코드로 한 픽셀씩 그립니다 (외부 이미지 에셋 없음)
 * ImageData 버퍼에 직접 쓰기 때문에 빠르고, file:// 로 열어도 동작합니다.
 */
(function (GG) {
  'use strict';
  const cache = {};
  function parse(c) {
    if (typeof c !== 'string') return c;
    let v = cache[c];
    if (v) return v;
    let r = 0, g = 0, b = 0, a = 255;
    if (c[0] === '#') {
      const h = c.slice(1);
      if (h.length === 3) { r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
      else {
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
        if (h.length === 8) a = parseInt(h.slice(6, 8), 16);
      }
    }
    v = [r, g, b, a];
    cache[c] = v;
    return v;
  }
  const hex2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  /* amt < 0 어둡게, > 0 밝게 */
  function shade(c, amt) {
    const [r, g, b] = parse(c);
    const f = v => (amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return '#' + hex2(f(r)) + hex2(f(g)) + hex2(f(b));
  }
  function mix(c1, c2, t) {
    const a = parse(c1), b = parse(c2);
    return '#' + hex2(a[0] + (b[0] - a[0]) * t) + hex2(a[1] + (b[1] - a[1]) * t) + hex2(a[2] + (b[2] - a[2]) * t);
  }

  class Painter {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    px(x, y, c) {
      x = Math.floor(x); y = Math.floor(y);
      if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const col = parse(c), d = this.d, i = (y * this.w + x) * 4, a = col[3];
      if (a >= 255) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; return; }
      if (a <= 0) return;
      const sa = a / 255, da = d[i + 3] / 255, oa = sa + da * (1 - sa);
      d[i] = (col[0] * sa + d[i] * da * (1 - sa)) / oa;
      d[i + 1] = (col[1] * sa + d[i + 1] * da * (1 - sa)) / oa;
      d[i + 2] = (col[2] * sa + d[i + 2] * da * (1 - sa)) / oa;
      d[i + 3] = oa * 255;
    }
    alpha(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
    hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.px(x, y, c); }
    vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.px(x, y, c); }
    line(x0, y0, x1, y1, c) {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    /* 채운 타원. fn(x,y,nx,ny) 로 픽셀마다 색을 정할 수 있음 */
    ellipse(cx, cy, rx, ry, c) {
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
        for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
          const nx = x / (rx + 0.5), ny = y / (ry + 0.5);
          if (nx * nx + ny * ny <= 1) this.px(cx + x, cy + y, typeof c === 'function' ? c(cx + x, cy + y, nx, ny) : c);
        }
      }
    }
    /* 이미 칠해진 픽셀만 어둡게 */
    darken(x0, y0, w, h, amt) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
        const i = (y * this.w + x) * 4;
        if (!this.d[i + 3]) continue;
        this.d[i] *= 1 - amt; this.d[i + 1] *= 1 - amt; this.d[i + 2] *= 1 - amt;
      }
    }
    /* 불투명 영역 바깥에 1px 외곽선 */
    outline(c) {
      const col = parse(c), w = this.w, h = this.h, src = new Uint8ClampedArray(this.d);
      const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[(y * w + x) * 4 + 3]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (A(x, y) > 0) continue;
        if (A(x - 1, y) > 140 || A(x + 1, y) > 140 || A(x, y - 1) > 140 || A(x, y + 1) > 140) {
          const i = (y * w + x) * 4;
          this.d[i] = col[0]; this.d[i + 1] = col[1]; this.d[i + 2] = col[2]; this.d[i + 3] = 255;
        }
      }
    }
    toCanvas() {
      const c = document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(this.w, this.h);
      img.data.set(this.d);
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }

  /* 색이 바랜(채도 낮은) 버전 — ‘말빛이 흐려진’ 마을 */
  function desaturate(src, sat, bright) {
    sat = sat == null ? 0.22 : sat; bright = bright == null ? 0.86 : bright;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
    const TR = 120, TG = 128, TB = 142; // 차가운 회청색 쪽으로 살짝
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      let r = (l + (d[i] - l) * sat) * bright, g = (l + (d[i + 1] - l) * sat) * bright, b = (l + (d[i + 2] - l) * sat) * bright;
      d[i] = r * 0.9 + TR * 0.1; d[i + 1] = g * 0.9 + TG * 0.1; d[i + 2] = b * 0.9 + TB * 0.1;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function flipX(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.translate(src.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }

  GG.art = GG.art || {};
  Object.assign(GG.art, {
    parse, shade, mix, Painter, desaturate, flipX,
    OUTLINE: '#2e211b',
    sprite(w, h, fn, outline) {
      const p = new Painter(w, h);
      fn(p);
      if (outline) p.outline(outline === true ? GG.art.OUTLINE : outline);
      return p.toCanvas();
    }
  });
})(window.GG);
