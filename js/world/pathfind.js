/* 클릭/터치 이동용 A* 길찾기 (8px 칸) */
(function (GG) {
  'use strict';
  class Heap {
    constructor() { this.a = []; }
    push(n, f) { const a = this.a; a.push([f, n]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
    pop() {
      const a = this.a, top = a[0], last = a.pop();
      if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
      return top[1];
    }
    get size() { return this.a.length; }
  }

  /* blocked(cx,cy) → bool. 대각선은 모서리를 깎지 않을 때만 허용 */
  GG.findPath = function (cols, rows, blocked, sx, sy, gx, gy, maxNodes) {
    if (sx === gx && sy === gy) return [];
    const N = cols * rows, g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const idx = (x, y) => y * cols + x;
    const hfn = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const heap = new Heap();
    const s = idx(sx, sy);
    g[s] = 0; heap.push(s, hfn(sx, sy));
    let count = 0;
    const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (heap.size && count++ < (maxNodes || 9000)) {
      const cur = heap.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % cols, cy = (cur / cols) | 0;
      if (cx === gx && cy === gy) {
        const path = [];
        let n = cur;
        while (n !== s) { path.push([n % cols, (n / cols) | 0]); n = from[n]; }
        return path.reverse();
      }
      for (const [dx, dy, cost] of D) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || blocked(nx, ny)) continue;
        if (dx && dy && (blocked(cx + dx, cy) || blocked(cx, cy + dy))) continue;
        const ni = idx(nx, ny), ng = g[cur] + cost;
        if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; heap.push(ni, ng + hfn(nx, ny)); }
      }
    }
    return null;
  };
})(window.GG);
