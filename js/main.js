/* 가갸궁 — 게임 진행 (화면 전환 · 루프 · 카메라 · 상호작용 · 미션 · 엔딩) */
(function (GG) {
  'use strict';
  const T = GG.TILE, U = GG.util;

  /* 엔딩: 복원된 마을을 차례로 비추는 카메라 경로 (타일 좌표, 머무는 시간) */
  const TOUR = [
    { x: 23, y: 9, t: 2.2, cap: null },
    { x: 6, y: 19, t: 2.6, cap: 0 },
    { x: 38, y: 20, t: 2.6, cap: 1 },
    { x: 21, y: 28, t: 2.8, cap: 2 },
    { x: 23, y: 11, t: 3.2, cap: 3 }
  ];

  const Game = {
    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.state = new GG.State();
      this.world = new GG.World(this.state);
      this.dialogue = new GG.Dialogue(this);
      this.ui = GG.UI;
      this.ui.init(this);
      GG.Input.init(this.canvas);
      this.mode = 'title';
      this.time = 0;
      this.cam = { x: 0, y: 0 };
      this.target = null;
      this.tapMark = null;
      this.resize();
      this.updateCamera(0, true);
      window.addEventListener('resize', () => this.resize());
      if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.resize());
      this.last = performance.now();
      requestAnimationFrame(t => this.frame(t));
      document.body.classList.add('ready');
      document.body.classList.toggle('event-mode', GG.CONFIG.eventMode);
      // 이어하기: 저장이 있으면 시작 화면에 버튼 표시, 상태가 바뀔 때마다 저장
      this.ui.showContinue(!!GG.Save.read());
      GG.bus.on('state', () => { if (this.mode === 'play' || this.mode === 'ending') { clearTimeout(this.saveT); this.saveT = setTimeout(() => GG.Save.write(this), 300); } });
      this.saveTick = 0;
      try {
        const ic = document.createElement('canvas'); ic.width = 32; ic.height = 32;
        const ix = ic.getContext('2d'); ix.imageSmoothingEnabled = false;
        ix.drawImage(GG.art.SPRITES.lantern({ lit: true }), 6, 1, 14, 32, 6, 0, 28, 64);
        const link = document.createElement('link'); link.rel = 'icon'; link.href = ic.toDataURL(); document.head.appendChild(link);
      } catch (e) { /* 파비콘은 없어도 됨 */ }
    },

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = window.innerWidth, h = window.innerHeight;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      const zc = U.clamp(Math.min(w / 300, h / 190), 2, 5);
      this.dpr = dpr;
      this.zoom = Math.max(1, Math.round(zc * dpr));
      this.vw = this.canvas.width / this.zoom;
      this.vh = this.canvas.height / this.zoom;
      document.body.classList.toggle('is-touch', U.isTouch());
    },

    /* ── 화면 흐름 ── */
    fade(fn) {
      const c = document.getElementById('curtain');
      c.classList.add('on');
      setTimeout(() => { fn(); requestAnimationFrame(() => c.classList.remove('on')); }, 380);
    },
    startJourney() {
      if (this.mode !== 'title' || this.starting) return;
      this.starting = true;
      GG.Audio.init();
      GG.Audio.startBgm();
      GG.Audio.sfx('select');
      this.fade(() => {
        this.starting = false;
        this.ui.showTitle(false);
        this.mode = 'intro';
        this.ui.startIntro(() => this.beginPlay());
      });
    },
    /* 저장된 곳에서 이어하기 (인트로 없이 바로 플레이) */
    continueJourney() {
      const d = GG.Save.read();
      if (!d || this.mode !== 'title' || this.starting) return this.startJourney();
      this.starting = true;
      GG.Audio.init();
      GG.Audio.startBgm();
      GG.Audio.sfx('select');
      this.fade(() => {
        this.starting = false;
        this.world.reset();
        GG.Save.apply(this, d);
        this.world.applyState(this.state);
        GG.Audio.setLayers(this.state.flags.palace_restored ? 4 : 1 + this.state.doneCount());
        // 할머니가 우물로 걸어가던 중이었다면 다시 걸어가게
        const g = this.state.missions.guide;
        if (g && g.status === 'active' && g.step === 3) this.npcWalk({ id: 'grandma', to: [30.2, 30.3], dir: 'right', then: { do: 'completeMission', id: 'guide' } });
        this.ui.showTitle(false);
        this.updateCamera(0, true);
        this.beginPlay(true);
        this.ui.toast('지난번에 하던 곳에서 이어서 시작해요');
      });
    },
    beginPlay(resumed) {
      this.mode = 'play';
      this.ui.showHud(true);
      this.ui.controlsHint(!resumed);
      this.hintLeft = resumed ? 0 : 9;
      this.lastArea = undefined;
      GG.Input.lastInputAt = performance.now();
    },
    restart() { this.fade(() => this.doRestart()); },
    doRestart() {
      GG.Save.clear();
      this.ui.showContinue(false);
      if (this.dialogue.active) this.dialogue.end();
      this.ui.closeLetter();
      this.ui.hideEnding();
      this.ui.tourCaption(null);
      this.endingQueued = false;
      this.tour = null;
      GG.resetCardSerial();
      this.state.reset();
      this.world.reset();
      GG.Audio.setLayers(1);
      this.ui.menuOpen(false);
      this.ui.showHud(false);
      this.ui.controlsHint(false);
      this.mode = 'title';
      this.ui.showTitle(true);
      // 초기화 중에 예약된 자동 저장이 빈 저장을 다시 만들지 않도록
      clearTimeout(this.saveT);
      GG.Save.clear();
    },
    openMenu() { if (this.mode === 'play') this.ui.menuOpen(true); },
    closeMenu() { this.ui.menuOpen(false); },

    /* ── 미션 ── */
    mission(id) { return GG.DATA.MISSIONS.find(m => m.id === id); },
    placeOf(id) {
      const n = this.world.npcs.find(x => x.id === id);
      if (n) return [n.x, n.y - 8];
      const o = this.world.byId && this.world.byId[id];
      if (o) return [o.x + o.w / 2, o.sortY - 10];
      return [this.world.player.x, this.world.player.y];
    },
    startMission(id) {
      if (!this.state.setMission(id, 'active')) return;
      const m = this.mission(id);
      GG.Audio.sfx('quest');
      this.ui.toast(`미션 ${m.no} 시작 · [[${m.title}]]`, 'quest');
    },
    completeMission(id) {
      if (this.state.status(id) === 'done') return;
      this.state.setFlag('met_gaon');
      this.state.setMission(id, 'done');
      const m = this.mission(id);
      const [cx, cy] = this.placeOf(m.restoreAt || m.npc);
      this.world.restoreZone(m.zone, cx, cy);
      GG.Audio.sfx('restore');
      GG.Audio.haptic([30, 60, 30]);
      this.world.emote(m.npc, 'note', 3);
      if (m.restoreAt !== m.npc) this.world.emote(m.restoreAt, 'heart', 3);
      GG.Audio.setLayers(1 + this.state.doneCount());
      this.ui.toast(`[[${m.short}]]에 말빛이 돌아왔어요! (${this.state.doneCount()} / ${GG.DATA.MISSIONS.length})`, 'done');
      if (this.state.allDone()) setTimeout(() => { if (this.mode === 'play') this.ui.toast('궁궐 마당의 [[말빛 등]]으로 가 보세요', 'quest'); }, 2600);
    },
    restorePalace() {
      if (this.state.flags.palace_restored) return;
      this.state.setFlag('palace_restored');
      const o = this.world.byId.maalbit;
      this.world.restoreZone('palace', o.gx, o.gy);
      GG.Audio.sfx('restore');
      GG.Audio.setLayers(4);
    },
    /* 첫 대화의 작은 성공 경험: 가온과 말을 나누면 근처 등불에 말빛이 켜짐 */
    firstLight() {
      const lamps = this.world.lightFirstLanterns(true);
      const gaon = this.world.npcs.find(n => n.id === 'gaon');
      if (gaon) this.world.burst(gaon.x, gaon.y - 12, 26);
      GG.Audio.sfx('quest');
      GG.Audio.haptic(25);
      this.ui.toast('말을 나누자 등불에 [[말빛]]이 켜졌어요!', 'done');
      return lamps;
    },
    replaceSign() {
      this.world.setSign(true);
      this.state.setFlag('sign_new');
      const o = this.world.byId.guideSign;
      this.world.burst(o.x + o.w / 2, o.y + 10, 40);
      GG.Audio.sfx('item');
    },
    npcWalk(n) {
      const npc = this.world.npcs.find(x => x.id === n.id);
      if (!npc) return;
      npc.talking = false;
      this.world.walkNpc(npc, n.to[0] * T, n.to[1] * T, () => {
        if (n.dir) { npc.dir = n.dir; npc.homeDir = n.dir; }
        if (n.then && GG.Actions[n.then.do]) GG.Actions[n.then.do](n.then, this, this.dialogue);
      });
    },

    /* ── 엔딩 ── */
    queueEnding() { this.endingQueued = true; },
    afterDialogue() {
      if (this.cardQueued) { this.cardQueued = false; this.showEndingAgain(); return; }
      if (!this.endingQueued) return;
      this.endingQueued = false;
      this.mode = 'tour';
      this.ui.showHud(false);
      this.ui.controlsHint(false);
      this.world.player.clearPath();
      this.world.player.moving = false;
      this.tour = { i: 0, t: 0 };
      GG.Audio.sfx('fanfare');
    },
    updateTour(dt) {
      const tr = this.tour;
      tr.t += dt;
      const stop = TOUR[tr.i];
      if (tr.t >= stop.t) {
        tr.i++; tr.t = 0;
        if (tr.i >= TOUR.length) { this.finishTour(); return; }
        const cap = TOUR[tr.i].cap;
        this.ui.tourCaption(cap == null ? null : GG.DATA.STORY.ending.tour[cap]);
      }
    },
    finishTour() {
      this.tour = null;
      this.ui.tourCaption(null);
      this.mode = 'ending';
      this.state.setFlag('ending_seen');
      this.ui.showEnding();
    },
    showEndingAgain() {
      this.mode = 'ending';
      this.ui.showHud(false);
      this.ui.showEnding();
    },
    closeEnding() {
      this.ui.hideEnding();
      this.mode = 'play';
      this.ui.showHud(true);
    },

    /* ── 상호작용 ── */
    interact(t) {
      const p = this.world.player;
      let talk, who, npc = null;
      if (t.kind === 'npc') {
        npc = t.ref;
        if (npc.path) return;                 // 걸어가는 중에는 말 걸지 않음
        npc.face(p.x, p.y);
        p.dir = GG.dirOf(npc.x - p.x, npc.y - p.y, p.dir);
        talk = npc.data.talk;
        who = { name: npc.name, look: npc.look };
      } else {
        const o = t.ref, ex = GG.DATA.EXAMINE[o.examine];
        if (!ex) return;
        p.dir = GG.dirOf(o.ax - p.x, o.ay - p.y, p.dir);
        talk = ex.talk;
        who = o.pick ? { name: GG.DATA.ITEMS[o.pick].name + ' 바구니', look: null, item: o.pick } : { name: ex.name, look: null };
      }
      const script = GG.pickTalk(talk, this.state);
      if (!script) return;
      p.clearPath(); p.moving = false;
      if (npc) npc.talking = true;
      this.dialogue.start(script, who, () => { if (npc) npc.talking = false; });
    },
    screenToWorld(cx, cy) {
      const r = this.canvas.getBoundingClientRect();
      return [this.cam.x + (cx - r.left) * this.dpr / this.zoom, this.cam.y + (cy - r.top) * this.dpr / this.zoom];
    },
    handleTap(tap) {
      const [wx, wy] = this.screenToWorld(tap.x, tap.y);
      const p = this.world.player, t = this.world.pick(wx, wy);
      if (t) {
        const [ax, ay] = this.world.anchorOf(t);
        if (U.dist(p.x, p.y - 3, ax, ay - 3) <= GG.CONFIG.interactRange + 4) { this.interact(t); return; }
        if (this.world.planPath(p, ax, ay + (t.kind === 'npc' ? 6 : 0), t)) this.tapMark = { x: ax, y: ay, t: 0 };
        else GG.Audio.sfx('bump');
        return;
      }
      if (this.world.planPath(p, wx, wy, null)) this.tapMark = { x: wx, y: wy, t: 0 };
      else GG.Audio.sfx('bump');
    },

    /* ── 루프 ── */
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.time += dt;
      this.update(dt);
      this.render();
      requestAnimationFrame(t => this.frame(t));
    },

    update(dt) {
      const I = GG.Input, w = this.world, p = w.player;
      // 행사 모드: 한동안 아무 입력이 없으면 다음 사람을 위해 처음으로
      if (GG.CONFIG.eventMode && this.mode !== 'title' && this.mode !== 'tour' && !this.starting
        && performance.now() - I.lastInputAt > GG.CONFIG.idleResetSec * 1000) {
        I.lastInputAt = performance.now();
        this.restart();
      }
      // 개인 기기: 몇 초마다 위치 저장
      if (this.mode === 'play' && (this.saveTick += dt) > 4) { this.saveTick = 0; GG.Save.write(this); }
      if (this.ui.letterShown) {
        if (I.take('act') || I.take('menu')) this.ui.closeLetter();
        w.update(dt); this.updateCamera(dt); I.endFrame(); return;
      }
      if (I.take('menu')) {
        if (this.ui.menuShown) this.closeMenu();
        else if (this.mode === 'play') this.openMenu();
      }
      if (GG.CONFIG.debug && !this.dialogue.active) this.debugKeys(I);
      if (this.ui.menuShown) { this.ui.joystick({ active: false }); I.endFrame(); return; }

      w.update(dt);

      if (this.mode === 'intro') {
        if (I.take('act')) this.ui.introNext();
      } else if (this.mode === 'tour') {
        this.updateTour(dt);
      } else if (this.mode === 'play') {
        if (this.dialogue.active) {
          p.moving = false;
          if (I.take('up')) this.ui.moveChoice(-1);
          if (I.take('down')) this.ui.moveChoice(1);
          ['d1', 'd2', 'd3'].forEach((k, i) => { if (I.take(k) && this.dialogue.waiting === 'choice' && !this.ui.dialogTyping() && i < this.ui.choices.length) this.dialogue.choose(i); });
          if (I.take('act')) this.dialogue.advance(true);
          else if (I.takeTap()) this.dialogue.advance(false);
          this.target = null;
        } else {
          const axis = I.axis();
          const ox = p.x, oy = p.y;
          p.update(dt, w, axis);
          if (this.hintLeft > 0) {
            this.hintLeft -= dt + Math.hypot(p.x - ox, p.y - oy) * 0.02;
            if (this.hintLeft <= 0) this.ui.controlsHint(false);
          }
          const tap = I.takeTap();
          if (tap) this.handleTap(tap);
          if (p.goal) {
            const [ax, ay] = w.anchorOf(p.goal);
            if (U.dist(p.x, p.y - 3, ax, ay - 3) <= GG.CONFIG.interactRange + 4) {
              const g = p.goal; p.clearPath(); this.interact(g);
            } else if (!p.path) p.goal = null;
          }
          this.target = this.dialogue.active ? null : w.findTarget(p);
          this.ui.setActionReady(this.target);
          if (I.take('act') && this.target && !this.dialogue.active) this.interact(this.target);
          const area = w.areaAt(p.x, p.y);
          if (area !== this.lastArea) { if (this.lastArea !== undefined && area) this.ui.placeBanner(area); this.lastArea = area; }
        }
      }
      this.ui.joystick(this.mode === 'play' ? I.joy : { active: false });
      if (this.tapMark) { this.tapMark.t += dt; if (this.tapMark.t > 0.6) this.tapMark = null; }
      this.updateCamera(dt);
      I.endFrame();
    },

    debugKeys(I) {
      if (I.take('debugC')) this.world.debug = !this.world.debug;
      const ids = GG.DATA.MISSIONS.map(m => m.id);
      ['d1', 'd2', 'd3'].forEach((k, i) => { if (I.take(k) && this.mode === 'play' && ids[i]) this.completeMission(ids[i]); });
      if (I.take('d0') && this.mode === 'play') { this.state.reset(); this.world.reset(); GG.Audio.setLayers(1); }
    },

    updateCamera(dt, snap) {
      const w = this.world, p = w.player;
      let tx, ty, speed = 7;
      if (this.mode === 'title') {
        tx = GG.LAYOUT.titleCam.x * T + Math.sin(this.time * 0.11) * 70 - this.vw / 2;
        ty = GG.LAYOUT.titleCam.y * T + Math.sin(this.time * 0.07) * 30 - this.vh / 2;
      } else if (this.mode === 'tour' && this.tour) {
        const s = TOUR[this.tour.i];
        tx = s.x * T - this.vw / 2; ty = s.y * T - this.vh / 2; speed = 1.8;
      } else {
        tx = p.x - this.vw / 2;
        ty = p.y - 10 - this.vh / 2;
        if (this.dialogue.active) ty += (this.ui.dialogHeightPx() * this.dpr / this.zoom) * 0.45;
        if (this.mode === 'intro') speed = 1.6;
      }
      tx = w.pw <= this.vw ? (w.pw - this.vw) / 2 : U.clamp(tx, 0, w.pw - this.vw);
      ty = w.ph <= this.vh ? (w.ph - this.vh) / 2 : U.clamp(ty, 0, w.ph - this.vh);
      const k = snap ? 1 : Math.min(1, dt * speed);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
    },

    render() {
      const ctx = this.ctx, c = this.canvas;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#1d1a16';
      ctx.fillRect(0, 0, c.width, c.height);
      const play = this.mode === 'play';
      this.world.render(ctx, this.cam, this.vw, this.vh, this.zoom, {
        icons: play,
        target: play && !this.dialogue.active ? this.target : null
      });
      if (this.tapMark) {
        const m = this.tapMark, a = 1 - m.t / 0.6, r = 2 + m.t * 10;
        ctx.strokeStyle = `rgba(255,236,170,${a.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(m.x - r) + 0.5, Math.round(m.y - r * 0.5) + 0.5, Math.round(r * 2), Math.round(r));
      }
      if (this.mode === 'play' || this.mode === 'tour') this.renderSignLabel(ctx);
      if (this.mode === 'play' && !this.dialogue.active) this.renderEdgeMarkers(ctx);
    },

    /* 화면 밖에 있는 ‘!’ 주민(과 말빛 등)을 가장자리 화살표로 알려 줌 */
    renderEdgeMarkers(ctx) {
      const w = this.world, st = this.state, z = this.zoom, dpr = this.dpr, cw = this.canvas.width, ch = this.canvas.height;
      const pts = [];
      for (const n of w.npcs) if (w.markerOf(n) === 'quest') pts.push([n.x, n.headY - 6]);
      if (st.allDone() && !st.flags.palace_restored) { const o = w.byId.maalbit; pts.push([o.gx, o.gy]); }
      const ox = Math.round(this.cam.x * z), oy = Math.round(this.cam.y * z);
      const mL = 26 * dpr, mR = 26 * dpr, mT = 74 * dpr, mB = (GG.util.isTouch() ? 130 : 30) * dpr;
      const cx = cw / 2, cy = ch / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const bob = Math.sin(this.time * 5) * 3 * dpr;
      for (const [wx, wy] of pts) {
        const sx = wx * z - ox, sy = wy * z - oy;
        if (sx > 0 && sx < cw && sy > 0 && sy < ch) continue;
        const dx = sx - cx, dy = sy - cy;
        const k = Math.min((dx > 0 ? (cw - mR - cx) : (mL - cx)) / (dx || 1e-6), (dy > 0 ? (ch - mB - cy) : (mT - cy)) / (dy || 1e-6));
        const ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), r = 13 * dpr;
        ctx.save();
        ctx.translate(ex + Math.cos(a) * bob, ey + Math.sin(a) * bob);
        ctx.fillStyle = '#5a3410';
        ctx.beginPath(); ctx.arc(0, 0, r + 2 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(r + 9 * dpr, 0); ctx.lineTo(r - 1, -7 * dpr); ctx.lineTo(r - 1, 7 * dpr); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd25e';
        ctx.beginPath(); ctx.moveTo(r + 6 * dpr, 0); ctx.lineTo(r - 2, -5 * dpr); ctx.lineTo(r - 2, 5 * dpr); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffd25e';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3410';
        ctx.fillRect(-2 * dpr, -8 * dpr, 4 * dpr, 10 * dpr);
        ctx.fillRect(-2 * dpr, 4 * dpr, 4 * dpr, 4 * dpr);
        ctx.restore();
      }
    },

    /* 안내판 글씨를 월드 위에 표시: 바꾸기 전에는 가까이 가면, 바꾼 뒤에는 늘 */
    renderSignLabel(ctx) {
      const o = this.world.byId && this.world.byId.guideSign;
      if (!o) return;
      const fresh = !!this.state.flags.sign_new, p = this.world.player;
      const near = U.dist(p.x, p.y, o.x + o.w / 2, o.sortY) < 70;
      if (!fresh && !near) return;
      const text = fresh ? GG.DATA.PUBLIC_LANGUAGE.sign.new : GG.DATA.PUBLIC_LANGUAGE.sign.old;
      const z = this.zoom, dpr = this.dpr;
      const sx = Math.round((o.x + o.w / 2) * z - Math.round(this.cam.x * z));
      const sy = Math.round((o.y - 3) * z - Math.round(this.cam.y * z));
      if (sx < -400 || sy < -100 || sx > this.canvas.width + 400 || sy > this.canvas.height + 100) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const fs = Math.round(13 * dpr);
      ctx.font = `${fresh ? 700 : 400} ${fs}px "Gowun Dodum", "Malgun Gothic", sans-serif`;
      const tw = ctx.measureText(text).width, pad = Math.round(8 * dpr), bh = Math.round(fs * 1.9);
      const bx = Math.round(sx - tw / 2 - pad), by = sy - bh;
      ctx.fillStyle = fresh ? 'rgba(247,240,220,0.96)' : 'rgba(216,206,179,0.94)';
      ctx.fillRect(bx, by, Math.round(tw + pad * 2), bh);
      ctx.strokeStyle = fresh ? '#3f6a5c' : '#6b4428';
      ctx.lineWidth = Math.max(2, Math.round(2 * dpr));
      ctx.strokeRect(bx, by, Math.round(tw + pad * 2), bh);
      ctx.fillStyle = fresh ? '#2c4d42' : '#4d3e31';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, sx, by + bh / 2 + 1);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
  };

  GG.Actions.showEnding = (n, g) => { g.cardQueued = true; };
  GG.Actions.firstLight = (n, g) => { g.firstLight(); };

  GG.game = Game;
  window.addEventListener('DOMContentLoaded', () => {
    try { Game.init(); }
    catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML('beforeend', '<p class="noscript">게임을 불러오지 못했어요. 새로고침해 주세요.</p>');
    }
  });
})(window.GG);
