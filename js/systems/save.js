/* 진행 상황 저장 — 이 기기의 브라우저(localStorage)에만 저장합니다.
 *  - 개인 기기: 새로고침하거나 다시 들어와도 시작 화면에 ‘이어하기’가 나타납니다.
 *  - 행사 모드(?event=1): 저장하지 않습니다. 공용 기기에서 다음 사람이 늘 처음부터 시작.
 *  - ‘처음부터 다시 시작’을 누르면 저장도 지워집니다.
 */
(function (GG) {
  'use strict';
  const KEY = 'save_v1';

  GG.Save = {
    get enabled() { return GG.CONFIG.save && !GG.CONFIG.eventMode; },

    write(game) {
      if (!this.enabled || game.mode === 'title' || game.mode === 'intro') return;
      const s = game.state, p = game.world.player;
      const data = {
        v: 1, t: Date.now(),
        flags: s.flags, missions: s.missions, held: s.held, focus: s.focus,
        p: [Math.round(p.x), Math.round(p.y), p.dir]
      };
      GG.store.set(KEY, JSON.stringify(data));
    },

    read() {
      if (!this.enabled) return null;
      try {
        const d = JSON.parse(GG.store.get(KEY, 'null'));
        if (!d || d.v !== 1) return null;
        if (Date.now() - d.t > GG.CONFIG.saveMaxHours * 3600e3) { this.clear(); return null; }
        // 미션 정의가 바뀌었으면 안전하게 버림
        if (!GG.DATA.MISSIONS.every(m => d.missions && d.missions[m.id])) return null;
        return d;
      } catch (e) { return null; }
    },

    clear() { try { localStorage.removeItem('gagyagung_' + KEY); } catch (e) { /* 저장 불가 환경 */ } },

    /* 저장된 상태를 게임 상태에 덮어씀 (월드 반영은 World.applyState) */
    apply(game, d) {
      const s = game.state;
      s.flags = Object.assign({}, d.flags);
      GG.DATA.MISSIONS.forEach(m => { s.missions[m.id] = Object.assign({ status: 'available', step: 0 }, d.missions[m.id]); });
      s.held = d.held || null;
      s.focus = d.focus || null;
      const p = game.world.player;
      if (d.p) { p.x = d.p[0]; p.y = d.p[1]; p.dir = d.p[2] || 'down'; }
      GG.bus.emit('state', s);
    }
  };
})(window.GG);
