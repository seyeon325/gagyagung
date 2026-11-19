/* 캐릭터 — 플레이어와 NPC */
(function (GG) {
  'use strict';
  const T = GG.TILE, U = GG.util;
  let shadowSpr = null;
  function shadow() {
    if (!shadowSpr) shadowSpr = GG.art.sprite(12, 4, p => p.ellipse(5.5, 1.5, 5.5, 1.5, '#1e140c55'));
    return shadowSpr;
  }
  const dirOf = (dx, dy, cur) => (Math.abs(dx) > Math.abs(dy) * 1.05 ? (dx < 0 ? 'left' : 'right') : (Math.abs(dy) > 0.001 ? (dy < 0 ? 'up' : 'down') : cur));

  class Character {
    constructor(look, x, y, dir) {
      this.look = look;
      this.sheet = GG.art.getCharacter(look);
      this.x = x; this.y = y; this.dir = dir || 'down';
      this.moving = false; this.animT = 0;
    }
    frame() { return this.moving ? [1, 0, 2, 0][Math.floor(this.animT) % 4] : 0; }
    hitbox(x, y) {
      x = x == null ? this.x : x; y = y == null ? this.y : y;
      return { x0: x - 4, y0: y - 5, x1: x + 4, y1: y + 1 };
    }
    get headY() { return this.y - (this.sheet.small ? 17 : 22); }
    draw(ctx) {
      const spr = this.sheet[this.dir][this.frame()];
      const x = Math.round(this.x), y = Math.round(this.y);
      ctx.drawImage(shadow(), x - 6, y - 2);
      // 숨쉬기: 서 있을 때 윗몸만 1px 내려앉음 (말할 때는 더 빠르게)
      if (this.phase == null) this.phase = Math.random() * 6;
      const t = performance.now() / 1000;
      const dip = !this.moving && (this.talking ? Math.sin(t * 11 + this.phase) > 0.2 : Math.sin(t * 2.4 + this.phase) > 0.55);
      if (!dip) { ctx.drawImage(spr, x - 8, y - 21); return; }
      const cut = 15;
      ctx.drawImage(spr, 0, 0, 16, cut, x - 8, y - 20, 16, cut);
      ctx.drawImage(spr, 0, cut + 1, 16, 21 - cut, x - 8, y - 21 + cut + 1, 16, 21 - cut);
    }
  }

  class Player extends Character {
    constructor(x, y, dir) {
      super('player', x, y, dir);
      this.path = null; this.goal = null; this.stuck = 0;
    }
    setPath(points, goal) { this.path = points && points.length ? points : null; this.goal = goal || null; this.stuck = 0; }
    clearPath() { this.path = null; this.goal = null; }

    update(dt, world, axis) {
      const speed = GG.CONFIG.playerSpeed;
      let dx = 0, dy = 0;
      if (axis.x || axis.y) {
        this.clearPath();
        dx = axis.x * speed * dt; dy = axis.y * speed * dt;
      } else if (this.path) {
        world.smoothPath(this);
        const [tx, ty] = this.path[0];
        const ddx = tx - this.x, ddy = ty - this.y, d = Math.hypot(ddx, ddy);
        const stepLen = speed * dt;
        if (d <= stepLen) { dx = ddx; dy = ddy; this.path.shift(); if (!this.path.length) this.path = null; }
        else { dx = (ddx / d) * stepLen; dy = (ddy / d) * stepLen; }
      }
      if (dx || dy) {
        const ox = this.x, oy = this.y;
        world.moveEntity(this, dx, dy);
        const moved = Math.hypot(this.x - ox, this.y - oy);
        this.moving = moved > 0.01;
        this.dir = dirOf(dx, dy, this.dir);
        if (this.path || this.goal) {
          if (moved < Math.hypot(dx, dy) * 0.25) { this.stuck += dt; if (this.stuck > 0.45) this.clearPath(); }
          else this.stuck = 0;
        }
      } else this.moving = false;
      if (this.moving) {
        const before = Math.floor(this.animT);
        this.animT += dt * 8.5;
        const now = Math.floor(this.animT);
        if (now !== before && now % 2 === 0) GG.Audio.sfx('step');   // 발을 디딜 때
      } else this.animT = 0;
    }
  }

  class NPC extends Character {
    constructor(data) {
      super(data.look, data.x * T, data.y * T, data.dir);
      this.data = data;
      this.id = data.id;
      this.name = data.name;
      this.homeX = this.x; this.homeY = this.y; this.homeDir = data.dir || 'down';
      this.idleT = 1 + Math.random() * 3;
      this.wander = data.wander ? data.wander * T : 0;
      this.target = null;
      this.talking = false;
    }
    hitbox(x, y) {
      x = x == null ? this.x : x; y = y == null ? this.y : y;
      return this.look === 'cat' ? { x0: x - 5, y0: y - 3, x1: x + 5, y1: y + 1 } : { x0: x - 5, y0: y - 5, x1: x + 5, y1: y + 1 };
    }
    face(px, py) { this.dir = dirOf(px - this.x, py - this.y, this.dir); }
    /* 정해진 길을 따라 걷기 (연출용). 다른 사람과 부딪히지 않고 지나갑니다. */
    walk(points, onArrive) {
      this.path = points.slice(); this.onArrive = onArrive; this.ghost = true; this.stuckT = 0; this.target = null;
    }
    update(dt, world) {
      if (this.talking) { this.moving = false; return; }
      if (this.path) {
        const [tx, ty] = this.path[0], ddx = tx - this.x, ddy = ty - this.y, d = Math.hypot(ddx, ddy);
        const sp = 34 * dt;
        if (d <= sp) { this.x = tx; this.y = ty; this.path.shift(); this.stuckT = 0; }
        else {
          const ox = this.x, oy = this.y;
          world.moveEntity(this, (ddx / d) * sp, (ddy / d) * sp);
          if (Math.hypot(this.x - ox, this.y - oy) < sp * 0.2) { this.stuckT += dt; if (this.stuckT > 0.8) { this.x = tx; this.y = ty; this.path.shift(); this.stuckT = 0; } }
        }
        this.dir = dirOf(ddx, ddy, this.dir);
        this.moving = true;
        this.animT += dt * 6;
        if (!this.path.length) {
          this.path = null; this.ghost = false; this.moving = false;
          this.homeX = this.x; this.homeY = this.y;
          const cb = this.onArrive; this.onArrive = null;
          if (cb) cb();
        }
        return;
      }
      if (this.target) {
        const [tx, ty] = this.target, ddx = tx - this.x, ddy = ty - this.y, d = Math.hypot(ddx, ddy);
        const sp = (this.look === 'cat' ? 22 : 30) * dt;
        if (d < 1) { this.target = null; this.moving = false; }
        else {
          const ox = this.x, oy = this.y;
          world.moveEntity(this, (ddx / d) * Math.min(sp, d), (ddy / d) * Math.min(sp, d));
          this.dir = dirOf(ddx, ddy, this.dir);
          this.moving = Math.hypot(this.x - ox, this.y - oy) > 0.01;
          if (!this.moving) this.target = null;
        }
      } else this.moving = false;
      if (this.moving) this.animT += dt * 6; else this.animT = 0;

      this.idleT -= dt;
      if (this.idleT <= 0 && !this.target) {
        this.idleT = 2 + Math.random() * 3.5;
        if (this.wander) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * this.wander;
          this.target = [this.homeX + Math.cos(a) * r, this.homeY + Math.sin(a) * r * 0.6];
        } else if (Math.random() < 0.45) {
          // 가끔 두리번거리다 원래 방향으로
          this.dir = this.dir === this.homeDir ? ['down', 'left', 'right'][(Math.random() * 3) | 0] : this.homeDir;
        }
      }
    }
  }

  GG.Character = Character;
  GG.Player = Player;
  GG.NPC = NPC;
  GG.dirOf = dirOf;
})(window.GG);
