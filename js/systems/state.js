/* 게임 상태 — 플래그 · 미션(상태·단계) · 들고 있는 물건. 변경되면 'state' 이벤트를 보냅니다. */
(function (GG) {
  'use strict';
  class State {
    constructor() { this.reset(); }
    reset() {
      this.flags = {};
      this.missions = {};
      GG.DATA.MISSIONS.forEach(m => { this.missions[m.id] = { status: 'available', step: 0 }; });
      this.held = null;     // 한 번에 하나만 들 수 있음
      this.focus = null;    // 가장 최근에 진행한 미션 (HUD 안내에 사용)
      this.startedAt = Date.now();
      GG.bus.emit('state', this);
    }
    setFlag(f, v) { this.flags[f] = v === undefined ? true : v; GG.bus.emit('state', this); }
    clearFlag(f) { delete this.flags[f]; GG.bus.emit('state', this); }
    status(id) { return this.missions[id] ? this.missions[id].status : null; }
    setMission(id, status) {
      const m = this.missions[id];
      if (!m || m.status === status) return false;
      m.status = status;
      this.focus = id;
      GG.bus.emit('mission', id, status);
      GG.bus.emit('state', this);
      return true;
    }
    setStep(id, step) {
      const m = this.missions[id];
      if (!m) return;
      m.step = step; this.focus = id;
      GG.bus.emit('state', this);
    }
    doneCount() { return Object.values(this.missions).filter(m => m.status === 'done').length; }
    allDone() { return this.doneCount() === GG.DATA.MISSIONS.length; }
    setHeld(id) { this.held = id || null; GG.bus.emit('state', this); GG.bus.emit('held', this.held); }
  }
  GG.State = State;
})(window.GG);
