/* 월드 — 바닥·사물·충돌·구역별 색 복원·등불·입자·그리기 */
(function (GG) {
  'use strict';
  const T = GG.TILE, U = GG.util, A = GG.art, L = GG.LAYOUT;
  const CELL = 8;
  const ZONES = ['market', 'post', 'guide', 'palace'];
  const BUILDINGS = { palaceHall: 1, palaceGate: 1, southGate: 1, hanokPost: 1, hanokGuide: 1, hanokHouse: 1, choga: 1 };
  const GLOW_AT = { lantern: [10, 11], stoneLantern: [10, 14] };
  const RESTORE_TIME = 2.8;

  class World {
    constructor(state) {
      this.state = state;
      this.pw = L.W * T; this.ph = L.H * T;
      this.cache = {};
      this.buildObjects();
      this.buildGround();
      this.buildCollision();
      this.glow = A.makeGlow(26, '#ffc765');
      this.glowBig = A.makeGlow(60, '#ffd27a');
      this.icons = { talk: this.spr('iconTalk').c, quest: this.spr('iconQuest').c, active: this.spr('iconActive').c };
      this.debug = false;
      this.reset();
    }

    spr(type, v) {
      const key = type + '|' + (v == null ? '' : JSON.stringify(v));
      let s = this.cache[key];
      if (s) return s;
      const c = A.SPRITES[type](v);
      s = { c, d: A.desaturate(c), w: c.width, h: c.height };
      this.cache[key] = s;
      return s;
    }

    zoneAt(px, py) {
      for (const id of ['market', 'post', 'guide']) {
        const z = L.zones[id];
        if (px >= z.x0 * T && px < z.x1 * T && py >= z.y0 * T && py < z.y1 * T) return id;
      }
      return 'palace';
    }
    areaAt(px, py) {
      for (const a of L.areas) if (px >= a.x0 * T && px < a.x1 * T && py >= a.y0 * T && py < a.y1 * T) return a.id;
      return null;
    }

    /* ───────── 사물 ───────── */
    buildObjects() {
      const objs = this.objects = [];
      for (const w of L.walls) {
        if (w.h) {
          // 구역 경계에서 잘라서, 구역마다 따로 색이 돌아오게
          let start = w.x0;
          for (let x = w.x0; x <= w.x1 + 1; x++) {
            const zPrev = w.zone || this.zoneAt(start * T + 8, w.y * T + 8);
            const zCur = x <= w.x1 ? (w.zone || this.zoneAt(x * T + 8, w.y * T + 8)) : null;
            if (zCur !== zPrev) {
              const len = x - start, s = this.spr('hwall', len);
              objs.push({ type: 'hwall', x: start * T, y: w.y * T - 8, w: s.w, h: s.h, s, sortY: (w.y + 1) * T, zone: zPrev, solids: [] });
              start = x;
            }
          }
        } else {
          const len = w.y1 - w.y0 + 1, s = this.spr('vwall', len);
          objs.push({ type: 'vwall', x: w.x * T, y: w.y0 * T - 8, w: s.w, h: s.h, s, sortY: (w.y1 + 1) * T, zone: w.zone || this.zoneAt(w.x * T + 8, w.y0 * T + 8), solids: [] });
        }
      }
      for (const o of L.objects) {
        const s = this.spr(o.t, o.v);
        const bx = o.x * T, by = o.y * T;
        const x = Math.round(bx - s.w / 2), y = Math.round(by - s.h);
        const ob = {
          type: o.t, x, y, w: s.w, h: s.h, s, v: o.v, sortY: by,
          zone: o.zone || this.zoneAt(bx, by - 4),
          examine: o.examine, id: o.id, lantern: o.lantern, pick: o.pick,
          ax: bx + (o.ia ? o.ia[0] : 0), ay: by + (o.ia ? o.ia[1] : 5),
          solids: (L.SOLID[o.t] || []).map(r => [x + r[0], y + r[1], r[2], r[3]])
        };
        if (o.lantern) {
          ob.sLit = this.spr(o.t, Object.assign({}, o.v, { lit: true }));
          const g = GLOW_AT[o.t];
          ob.gx = x + g[0]; ob.gy = y + g[1];
          ob.big = o.lantern === 'stone';
        }
        objs.push(ob);
        if (o.id) (this.byId = this.byId || {})[o.id] = ob;
      }
      for (const w of L.walls) {
        // 벽 타일은 충돌 처리용으로 기록
        (this.wallTiles = this.wallTiles || []).push(w);
      }
    }

    /* ───────── 바닥 + 그림자 + 구역별 색 레이어 ───────── */
    buildGround() {
      const grid = this.grid = L.ground();
      const P = A.paintGround(grid, L.W, L.H);
      const blit = (c, x0, y0) => {
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          if (d[i + 3]) P.px(x0 + x, y0 + y, [d[i], d[i + 1], d[i + 2], d[i + 3]]);
        }
      };
      for (const d of L.decor) {
        const c = A.SPRITES[d.t](d.v);
        blit(c, Math.round(d.x * T - c.width / 2), Math.round(d.y * T - c.height));
      }
      const SH = '#1e140c3a';
      for (const o of this.objects) {
        if (o.type === 'hwall') { for (let x = o.x; x < o.x + o.w; x++) { P.px(x, o.sortY, SH); P.px(x, o.sortY + 1, '#1e140c22'); } continue; }
        if (o.type === 'vwall') continue;
        if (BUILDINGS[o.type]) {
          for (let x = o.x + 4; x < o.x + o.w - 2; x++) for (let k = 0; k < 4; k++) P.px(x + 2, o.sortY + k, k < 2 ? SH : '#1e140c1e');
          continue;
        }
        const s = L.SHADOW[o.type];
        if (s) P.ellipse(Math.round(o.x + o.w / 2 + (s.ox || 0)), Math.round(o.sortY - 1), s.rx, s.ry, SH);
      }
      const color = this.groundColor = P.toCanvas();
      this.groundDesat = A.desaturate(color);

      // 구역 경계는 점묘(디더)로 섞어서 픽셀 아트답게
      const W = this.pw, H = this.ph, F = 10;
      const src = color.getContext('2d').getImageData(0, 0, W, H).data;
      const out = {};
      ZONES.forEach(id => { const c = document.createElement('canvas'); c.width = W; c.height = H; out[id] = { c, ctx: c.getContext('2d') }; out[id].img = out[id].ctx.createImageData(W, H); });
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const jx = (U.hash(x >> 1, y >> 1) % (2 * F + 1)) - F;
        const jy = (U.hash((y >> 1) + 917, (x >> 1) + 311) % (2 * F + 1)) - F;
        const id = this.zoneAt(x + jx, y + jy), d = out[id].img.data, i = (y * W + x) * 4;
        d[i] = src[i]; d[i + 1] = src[i + 1]; d[i + 2] = src[i + 2]; d[i + 3] = src[i + 3];
      }
      this.zoneLayers = {};
      ZONES.forEach(id => { out[id].ctx.putImageData(out[id].img, 0, 0); this.zoneLayers[id] = out[id].c; });
    }

    /* ───────── 충돌 (8px 칸) ───────── */
    buildCollision() {
      const cols = this.cols = this.pw / CELL, rows = this.rows = this.ph / CELL;
      const solid = this.solid = new Uint8Array(cols * rows);
      const markTile = (tx, ty) => { for (let k = 0; k < 4; k++) solid[(ty * 2 + (k >> 1)) * cols + tx * 2 + (k & 1)] = 1; };
      for (let ty = 0; ty < L.H; ty++) for (let tx = 0; tx < L.W; tx++) if (this.grid[ty][tx] === 'w') markTile(tx, ty);
      for (const w of L.walls) {
        if (w.h) for (let x = w.x0; x <= w.x1; x++) markTile(x, w.y);
        else for (let y = w.y0; y <= w.y1; y++) markTile(w.x, y);
      }
      for (const o of this.objects) for (const [rx, ry, rw, rh] of o.solids) {
        for (let cy = Math.floor(ry / CELL); cy <= Math.floor((ry + rh - 0.01) / CELL); cy++) {
          for (let cx = Math.floor(rx / CELL); cx <= Math.floor((rx + rw - 0.01) / CELL); cx++) {
            if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
            const ow = Math.min(rx + rw, cx * CELL + CELL) - Math.max(rx, cx * CELL);
            const oh = Math.min(ry + rh, cy * CELL + CELL) - Math.max(ry, cy * CELL);
            if (ow * oh >= 14 || (ow >= rw - 0.01 && oh >= rh - 0.01)) solid[cy * cols + cx] = 1;
          }
        }
      }
    }
    cellSolid(cx, cy) { return cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows || this.solid[cy * this.cols + cx] === 1; }

    blocked(b, self) {
      const c0 = Math.floor(b.x0 / CELL), c1 = Math.floor((b.x1 - 0.01) / CELL);
      const r0 = Math.floor(b.y0 / CELL), r1 = Math.floor((b.y1 - 0.01) / CELL);
      for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) if (this.cellSolid(cx, cy)) return true;
      if (self && self.ghost) return false;
      const ents = this.npcs.concat([this.player]);
      const cur = self && self.hitbox ? self.hitbox() : null;
      for (const e of ents) {
        if (e === self || !e || e.ghost) continue;
        const h = e.hitbox();
        // 이미 겹쳐 있는 상대는 무시 → 겹친 상태에서도 빠져나갈 수 있음
        if (cur && cur.x0 < h.x1 && cur.x1 > h.x0 && cur.y0 < h.y1 && cur.y1 > h.y0) continue;
        if (b.x0 < h.x1 && b.x1 > h.x0 && b.y0 < h.y1 && b.y1 > h.y0) return true;
      }
      return false;
    }

    moveEntity(e, dx, dy) {
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
      for (let i = 0; i < steps; i++) { this.axisMove(e, dx / steps, 0); this.axisMove(e, 0, dy / steps); }
    }
    axisMove(e, dx, dy) {
      if (!dx && !dy) return;
      const nx = e.x + dx, ny = e.y + dy;
      if (!this.blocked(e.hitbox(nx, ny), e)) { e.x = nx; e.y = ny; return; }
      // 모서리에 살짝 걸리면 옆으로 미끄러지기
      const amt = Math.abs(dx || dy);
      for (let k = 1; k <= 5; k++) for (const sg of [1, -1]) {
        const px = dx ? 0 : sg * k, py = dy ? 0 : sg * k;
        if (!this.blocked(e.hitbox(nx + px, ny + py), e) && !this.blocked(e.hitbox(e.x + px, e.y + py), e)) {
          e.x += dx ? 0 : sg * Math.min(k, amt); e.y += dy ? 0 : sg * Math.min(k, amt);
          return;
        }
      }
    }

    /* ───────── 길찾기 (클릭/터치 이동) ───────── */
    pathBlocked(cx, cy, ignore) {
      if (this.cellSolid(cx, cy)) return true;
      const b = { x0: cx * CELL, y0: cy * CELL + 1, x1: cx * CELL + CELL, y1: cy * CELL + 7 };
      for (const e of this.npcs) {
        if (e === ignore) continue;
        const h = e.hitbox();
        if (b.x0 < h.x1 && b.x1 > h.x0 && b.y0 < h.y1 && b.y1 > h.y0) return true;
      }
      return false;
    }
    nearestFree(px, py, ignore) {
      const sx = Math.floor(px / CELL), sy = Math.floor(py / CELL);
      let best = null, bd = 1e9;
      for (let r = 0; r <= 7 && !best; r++) {
        for (let cy = sy - r; cy <= sy + r; cy++) for (let cx = sx - r; cx <= sx + r; cx++) {
          if (Math.max(Math.abs(cx - sx), Math.abs(cy - sy)) !== r || this.pathBlocked(cx, cy, ignore)) continue;
          const d = Math.hypot(cx * CELL + 4 - px, cy * CELL + 4 - py);
          if (d < bd) { bd = d; best = [cx, cy]; }
        }
      }
      return best;
    }
    planPath(player, wx, wy, goal) {
      const start = [Math.floor(player.x / CELL), Math.floor((player.y - 2) / CELL)];
      const end = this.nearestFree(wx, wy, goal && goal.kind === 'npc' ? null : null);
      if (!end) return false;
      const cells = GG.findPath(this.cols, this.rows, (cx, cy) => this.pathBlocked(cx, cy), start[0], start[1], end[0], end[1]);
      if (!cells) return false;
      const pts = cells.map(([cx, cy]) => [cx * CELL + 4, cy * CELL + 6]);
      if (!pts.length && goal) pts.push([player.x, player.y]);
      player.setPath(pts, goal);
      return true;
    }
    /* NPC 를 (wx,wy) 근처까지 걷게 함 */
    walkNpc(npc, wx, wy, cb) {
      const end = this.nearestFree(wx, wy, npc);
      const sx = Math.floor(npc.x / CELL), sy = Math.floor((npc.y - 2) / CELL);
      const cells = end && GG.findPath(this.cols, this.rows, (cx, cy) => this.cellSolid(cx, cy), sx, sy, end[0], end[1]);
      if (!cells) { npc.x = wx; npc.y = wy; if (cb) cb(); return; }
      npc.walk(cells.map(([cx, cy]) => [cx * CELL + 4, cy * CELL + 6]), cb);
    }
    burst(x, y, n) {
      for (let i = 0; i < (n || 30); i++) {
        const a = Math.random() * Math.PI * 2, s = 15 + Math.random() * 45;
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 20, life: 0, max: 0.8 + Math.random(), big: Math.random() < 0.35 });
      }
    }
    lineClear(e, x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 3);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        if (this.blocked(e.hitbox(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t), e)) return false;
      }
      return true;
    }
    smoothPath(p) {
      let k = 0;
      while (p.path && p.path.length >= 2 && k++ < 6 && this.lineClear(p, p.x, p.y, p.path[1][0], p.path[1][1])) p.path.shift();
    }

    /* ───────── 상호작용 대상 ───────── */
    findTarget(player) {
      const R = GG.CONFIG.interactRange, d = player.dir;
      const fx = player.x + (d === 'left' ? -7 : d === 'right' ? 7 : 0);
      const fy = player.y - 3 + (d === 'up' ? -7 : d === 'down' ? 6 : 0);
      let best = null, bd = 1e9;
      for (const n of this.npcs) {
        const dist = U.dist(fx, fy, n.x, n.y - 3);
        if (dist < R && dist < bd) { bd = dist; best = { kind: 'npc', ref: n, x: n.x, y: n.headY }; }
      }
      for (const o of this.objects) {
        if (!o.examine) continue;
        const dist = U.dist(fx, fy, o.ax, o.ay) + 2;
        if (dist < R + 2 && dist < bd) { bd = dist; best = { kind: 'obj', ref: o, x: o.ax, y: Math.max(o.y + 2, o.ay - 26) }; }
      }
      return best;
    }
    /* 클릭한 위치의 대상 (사람 우선, 작은 물건 우선) */
    pick(wx, wy) {
      for (const n of this.npcs) if (wx >= n.x - 9 && wx <= n.x + 9 && wy >= n.headY - 2 && wy <= n.y + 3) return { kind: 'npc', ref: n };
      let best = null, area = 1e12;
      for (const o of this.objects) {
        if (!o.examine) continue;
        if (wx >= o.x && wx <= o.x + o.w && wy >= o.y && wy <= o.y + o.h && o.w * o.h < area) { area = o.w * o.h; best = { kind: 'obj', ref: o }; }
      }
      return best;
    }
    anchorOf(t) { return t.kind === 'npc' ? [t.ref.x, t.ref.y] : [t.ref.ax, t.ref.ay]; }

    /* ───────── 상태 ───────── */
    reset() {
      this.zones = {};
      ZONES.forEach(id => { this.zones[id] = { t: 0, r: 0, cx: 0, cy: 0, maxR: 1, active: false, full: false }; });
      this.npcs = GG.DATA.NPCS.map(d => new GG.NPC(d));
      this.player = new GG.Player(L.start.x * T, L.start.y * T, L.start.dir);
      this.particles = [];
      this.objects.forEach(o => { o.forceLit = false; });
      this.critters = [];
      this.noteT = 3;
      this.time = 0;
      this.setSign(false);
    }

    /* 첫 대화의 작은 성공: 시작 지점(안내소 구역) 등불에 먼저 말빛을 켬 */
    lightFirstLanterns(fx) {
      const lamps = this.objects.filter(o => o.lantern === true && o.zone === 'guide');
      lamps.forEach((o, i) => {
        if (o.forceLit) return;
        o.forceLit = true;
        if (fx) setTimeout(() => this.burst(o.gx, o.gy, 14), i * 140);
      });
      return lamps;
    }

    /* 저장된 상태를 월드 모습에 반영 (이어하기) */
    applyState(st) {
      if (st.flags.met_gaon) this.lightFirstLanterns(false);
      GG.DATA.MISSIONS.forEach(m => {
        if (st.missions[m.id].status !== 'done') return;
        this.restoreZone(m.zone, 0, 0, true);
        this.spawnCritters(m.zone);
      });
      if (st.flags.palace_restored) { this.restoreZone('palace', 0, 0, true); this.spawnCritters('palace'); }
      this.setSign(!!st.flags.sign_new);
      for (const n of this.npcs) {
        const a = n.data.after;
        if (a && st.missions[a.mission] && st.missions[a.mission].status === 'done') {
          n.x = n.homeX = a.x * 16; n.y = n.homeY = a.y * 16; n.dir = n.homeDir = a.dir || n.dir;
        }
      }
    }

    /* 지금 상호작용할 수 있는 대상 아래에 금빛 고리 */
    renderTargetRing(ctx, t) {
      let cx, cy, rx, ry;
      if (t.kind === 'npc') { cx = t.ref.x; cy = t.ref.y; rx = 8; ry = 3; }
      else { const o = t.ref; cx = o.x + o.w / 2; cy = o.sortY; rx = Math.min(o.w / 2 + 2, 22); ry = Math.max(3, Math.round(rx / 3)); }
      const a = 0.55 + 0.35 * Math.sin(this.time * 6);
      ctx.save();
      ctx.strokeStyle = `rgba(255,214,110,${a.toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(Math.round(cx), Math.round(cy), rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    setSign(fresh) {
      const o = this.byId && this.byId.guideSign;
      if (!o) return;
      o.s = this.spr('sign', { fresh });
    }

    restoreZone(id, cx, cy, instant) {
      const z = this.zones[id];
      if (z.full || z.active) return;
      z.cx = cx; z.cy = cy;
      z.maxR = Math.max(U.dist(cx, cy, 0, 0), U.dist(cx, cy, this.pw, 0), U.dist(cx, cy, 0, this.ph), U.dist(cx, cy, this.pw, this.ph)) * (id === 'palace' ? 1 : 0.75);
      if (instant) { z.full = true; z.r = z.maxR; z.t = 1; return; }
      z.active = true; z.t = 0;
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2, s = 20 + Math.random() * 60;
        this.particles.push({ x: cx, y: cy - 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 25, life: 0, max: 1 + Math.random() * 1.2, big: Math.random() < 0.3 });
      }
    }
    spawnCritters(id) {
      const COL = ['#f2d36b', '#f0f0f0', '#eaa6a5', '#9fc6ea'];
      const n = id === 'palace' ? 4 : 3;
      for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
        const tx = 1 + Math.floor(Math.random() * (L.W - 2)), ty = 1 + Math.floor(Math.random() * (L.H - 2));
        if (this.grid[ty][tx] !== 'g' || this.zoneAt(tx * 16 + 8, ty * 16 + 8) !== id) continue;
        const x = tx * 16 + 8, y = ty * 16 + 8;
        this.critters.push({ x, y, hx: x, hy: y, tx: x, ty: y, t: 0, ph: Math.random() * 6, color: COL[i % COL.length] });
        i++;
      }
    }
    zoneP(id) { const z = this.zones[id]; return z.full ? 1 : z.active ? U.smooth(z.t) : 0; }
    objP(o) {
      if (o.pick || o.forceLit) return 1;   // 집을 수 있는 물건·먼저 켜진 등불은 늘 제 색으로
      const z = this.zones[o.zone];
      if (!z || z.full) return z ? 1 : 0;
      if (!z.active) return 0;
      const d = U.dist(z.cx, z.cy, o.x + o.w / 2, o.sortY - 6);
      return U.clamp((z.r - d) / 36, 0, 1);
    }
    restoredFraction() { return ZONES.reduce((s, id) => s + this.zoneP(id), 0) / ZONES.length; }

    update(dt) {
      this.time += dt;
      for (const id of ZONES) {
        const z = this.zones[id];
        if (!z.active) continue;
        z.t = Math.min(1, z.t + dt / RESTORE_TIME);
        z.r = z.maxR * U.easeOut(z.t);
        if (z.t >= 1) { z.active = false; z.full = true; this.spawnCritters(id); }
      }
      for (const n of this.npcs) {
        n.update(dt, this);
        if (n.emote) { n.emoteT -= dt; if (n.emoteT <= 0) n.emote = null; }
      }
      // 말빛이 돌아온 구역의 주민은 가끔 콧노래
      this.noteT -= dt;
      if (this.noteT <= 0) {
        this.noteT = 2.5 + Math.random() * 3;
        const happy = this.npcs.filter(n => !n.emote && !n.talking && n.look !== 'cat' && this.zones[this.zoneAt(n.x, n.y)].full);
        if (happy.length) this.emote(happy[(Math.random() * happy.length) | 0], Math.random() < 0.7 ? 'note' : 'heart', 1.8);
      }
      // 나비
      for (const b of this.critters) {
        b.t += dt;
        if (Math.hypot(b.tx - b.x, b.ty - b.y) < 3 || b.t > 4) { b.t = 0; b.tx = U.clamp(b.hx + (Math.random() - 0.5) * 90, 8, this.pw - 8); b.ty = U.clamp(b.hy + (Math.random() - 0.5) * 60, 8, this.ph - 8); }
        const a = Math.atan2(b.ty - b.y, b.tx - b.x);
        b.x += Math.cos(a) * 14 * dt; b.y += Math.sin(a) * 14 * dt + Math.sin(this.time * 9 + b.ph) * 6 * dt;
      }
      // 연못 물비늘
      if (Math.random() < dt * 5) {
        const wx = 40 + Math.floor(Math.random() * 5), wy = 27 + Math.floor(Math.random() * 6);
        this.particles.push({ x: wx * 16 + 2 + Math.random() * 12, y: wy * 16 + 4 + Math.random() * 10, vx: 0, vy: 0, life: 0, max: 0.7, glint: true });
      }
      // 켜진 등불 주변에 떠오르는 말빛 알갱이
      for (const o of this.objects) {
        if (!o.lantern) continue;
        const p = this.objP(o);
        if (p > 0.6 && Math.random() < dt * (o.big ? 6 : 0.5)) {
          this.particles.push({ x: o.gx + (Math.random() - 0.5) * (o.big ? 14 : 6), y: o.gy + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 10, life: 0, max: 1.6 + Math.random() * 1.6 });
        }
      }
      // 지금 해야 할 일과 관련된 사물이 반짝임 (정답을 알려 주지 않는 선에서)
      const st = this.state;
      const hintPick = GG.cond({ mission: { market: 'active' } }, st);
      const hintMail = GG.cond({ mission: { post: 'active' }, holding: 'letter' }, st);
      const hintSign = GG.cond({ step: { guide: 2 } }, st);
      const hintLamp = st.allDone() && !st.flags.palace_restored;
      for (const o of this.objects) {
        const on = (o.pick && hintPick) || (hintMail && o.id && o.id.startsWith('mbox_')) || (hintSign && o.id === 'guideSign') || (hintLamp && o.id === 'maalbit');
        if (on && Math.random() < dt * 3) {
          this.particles.push({ x: o.x + Math.random() * o.w, y: o.y + Math.random() * Math.min(o.h, 14), vx: 0, vy: -10 - Math.random() * 8, life: 0, max: 0.9 + Math.random() * 0.6, big: Math.random() < 0.4 });
        }
      }
      for (const q of this.particles) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 1.4; q.vy = q.vy * (1 - dt * 1.2) - dt * 4; }
      this.particles = this.particles.filter(q => q.life < q.max);
    }

    /* ───────── 그리기 ───────── */
    render(ctx, cam, vw, vh, z, opts) {
      opts = opts || {};
      const sx = Math.round(cam.x * z), sy = Math.round(cam.y * z);
      ctx.setTransform(z, 0, 0, z, -sx, -sy);
      ctx.imageSmoothingEnabled = false;
      const x0 = U.clamp(Math.floor(cam.x) - 1, 0, this.pw), y0 = U.clamp(Math.floor(cam.y) - 1, 0, this.ph);
      const x1 = U.clamp(Math.ceil(cam.x + vw) + 1, 0, this.pw), y1 = U.clamp(Math.ceil(cam.y + vh) + 1, 0, this.ph);
      const w = x1 - x0, h = y1 - y0;
      if (w > 0 && h > 0) {
        ctx.drawImage(this.groundDesat, x0, y0, w, h, x0, y0, w, h);
        for (const id of ZONES) {
          const zs = this.zones[id];
          if (!zs.full && !zs.active) continue;
          if (zs.full) { ctx.drawImage(this.zoneLayers[id], x0, y0, w, h, x0, y0, w, h); continue; }
          ctx.save();
          ctx.beginPath(); ctx.arc(zs.cx, zs.cy, Math.max(1, zs.r), 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(this.zoneLayers[id], x0, y0, w, h, x0, y0, w, h);
          ctx.restore();
        }
      }

      if (opts.target) this.renderTargetRing(ctx, opts.target);

      // 깊이 정렬 (아래쪽에 있을수록 나중에)
      const list = [];
      for (const o of this.objects) if (o.x < x1 && o.x + o.w > x0 && o.y < y1 && o.y + o.h > y0) list.push(o);
      for (const n of this.npcs) list.push(n);
      if (!opts.hidePlayer) list.push(this.player);
      list.sort((a, b) => (a.sortY != null ? a.sortY : a.y) - (b.sortY != null ? b.sortY : b.y));
      const pl = this.player, px0 = pl.x - 6, px1 = pl.x + 6, py0 = pl.y - 19, py1 = pl.y - 2;
      let afterPlayer = false, hidden = false;
      for (const e of list) {
        if (e === pl) afterPlayer = true;
        else if (afterPlayer && !hidden && !(e instanceof GG.Character) && e.x < px1 && e.x + e.w > px0 && e.y < py0 + 6 && e.y + e.h > py1 - 4) hidden = true;
        if (e instanceof GG.Character) { e.draw(ctx); continue; }
        const p = this.objP(e);
        if (p < 1) ctx.drawImage(e.s.d, e.x, e.y);
        if (p > 0) {
          ctx.globalAlpha = p;
          ctx.drawImage(e.lantern ? e.sLit.c : e.s.c, e.x, e.y);
          ctx.globalAlpha = 1;
        }
      }
      // 건물·나무 뒤에 가려졌을 때 반투명 실루엣
      if (hidden && !opts.hidePlayer) { ctx.globalAlpha = 0.45; pl.draw(ctx); ctx.globalAlpha = 1; }

      // 빛
      ctx.globalCompositeOperation = 'lighter';
      for (const o of this.objects) {
        if (!o.lantern) continue;
        const p = this.objP(o);
        if (p <= 0) continue;
        const g = o.big ? this.glowBig : this.glow;
        ctx.globalAlpha = p * (0.82 + 0.18 * Math.sin(this.time * 2.6 + o.x * 0.37));
        ctx.drawImage(g, Math.round(o.gx - g.width / 2), Math.round(o.gy - g.height / 2));
      }
      ctx.globalAlpha = 1;
      for (const b of this.critters) {
        const spr = this.spr('butterfly', { color: b.color, f: Math.floor(this.time * 8 + b.ph) % 2 }).c;
        ctx.drawImage(spr, Math.round(b.x - 2), Math.round(b.y - 1));
      }
      for (const q of this.particles) {
        const a = Math.sin(Math.PI * (q.life / q.max));
        if (q.glint) { ctx.fillStyle = `rgba(235,250,255,${(a * 0.8).toFixed(3)})`; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 1); continue; }
        ctx.fillStyle = `rgba(255,${q.big ? 236 : 214},${q.big ? 160 : 110},${a.toFixed(3)})`;
        const s = q.big ? 2 : 1;
        ctx.fillRect(Math.round(q.x), Math.round(q.y), s, s);
      }
      ctx.globalCompositeOperation = 'source-over';

      // 말빛이 흐린 동안의 어스름
      const gloom = 0.16 * (1 - this.restoredFraction());
      if (gloom > 0.003) { ctx.fillStyle = `rgba(26,30,46,${gloom.toFixed(3)})`; ctx.fillRect(x0, y0, w, h); }

      if (this.debug) this.renderDebug(ctx, x0, y0, x1, y1);
      if (opts.icons !== false) this.renderIcons(ctx, opts.target);
    }

    /* NPC 머리 위 표식: 'quest'(노란 !) · 'active'(…) · null */
    markerOf(n) {
      const st = this.state, d = n.data;
      if (d.marker && GG.cond(d.marker, st)) return 'quest';
      if (d.mission && st.flags.met_gaon) {
        const s = st.missions[d.mission].status;
        if (s === 'available') return 'quest';
        if (s === 'active') return 'active';
      }
      return null;
    }
    emote(id, kind, dur) {
      const n = typeof id === 'string' ? this.npcs.find(x => x.id === id) : id;
      if (n) { n.emote = kind; n.emoteT = dur || 2.2; }
    }
    renderIcons(ctx, target) {
      const st = this.state, bob = Math.round(Math.sin(this.time * 4) * 1.5);
      for (const n of this.npcs) {
        let icon = null;
        const mk = this.markerOf(n);
        if (mk) icon = this.icons[mk];
        if (target && target.kind === 'npc' && target.ref === n) icon = this.icons.talk;
        if (n.emote) icon = this.spr('emote', { kind: n.emote }).c;
        if (icon) ctx.drawImage(icon, Math.round(n.x - icon.width / 2), Math.round(n.headY - icon.height - 3 + bob));
      }
      if (st.held) {
        const ic = this.spr('itemIcon', { id: st.held }).c, pl = this.player;
        ctx.drawImage(ic, Math.round(pl.x - 6), Math.round(pl.headY - 12 + bob * 0.5), 12, 12);
      }
      if (target && target.kind === 'obj') {
        const icon = this.icons.talk;
        ctx.drawImage(icon, Math.round(target.x - icon.width / 2), Math.round(target.y - icon.height + bob));
      }
    }

    renderDebug(ctx, x0, y0, x1, y1) {
      ctx.fillStyle = 'rgba(255,0,60,0.35)';
      for (let cy = Math.floor(y0 / CELL); cy < Math.ceil(y1 / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx < Math.ceil(x1 / CELL); cx++) {
        if (this.cellSolid(cx, cy)) ctx.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
      ctx.fillStyle = 'rgba(0,160,255,0.5)';
      for (const e of this.npcs.concat([this.player])) { const b = e.hitbox(); ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
      ctx.fillStyle = 'rgba(255,220,0,0.9)';
      for (const o of this.objects) if (o.examine) ctx.fillRect(o.ax - 1, o.ay - 1, 2, 2);
      if (this.player.path) { ctx.fillStyle = 'rgba(0,255,120,0.8)'; for (const [px, py] of this.player.path) ctx.fillRect(px - 1, py - 1, 2, 2); }
    }
  }

  GG.World = World;
  GG.World.ZONES = ZONES;
})(window.GG);
