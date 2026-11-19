/* 대화 진행기 — data 의 대사 스크립트를 한 줄씩 실행합니다.
 * 동작(GG.Actions)이 'wait' 를 돌려주면, resume() 이 불릴 때까지 대화를 멈춥니다(예: 서찰 읽기 창).
 */
(function (GG) {
  'use strict';

  GG.Actions = {
    setFlag: (n, g) => g.state.setFlag(n.flag, n.value),
    clearFlag: (n, g) => g.state.clearFlag(n.flag),
    startMission: (n, g) => g.startMission(n.id),
    completeMission: (n, g) => g.completeMission(n.id),
    setStep: (n, g) => g.state.setStep(n.id, n.step),
    giveItem: (n, g) => { g.state.setHeld(n.id); GG.Audio.sfx('item'); GG.Audio.haptic(15); },
    takeHeld: (n, g) => g.state.setHeld(null),
    pickItem: (n, g, d) => { g.state.setHeld(n.id || (d.who && d.who.item)); GG.Audio.sfx('item'); GG.Audio.haptic(15); },
    emote: (n, g) => g.world.emote(n.who, n.kind, n.dur),
    openLetter: (n, g, d) => { g.ui.openLetter(() => d.resume()); return 'wait'; },
    replaceSign: (n, g) => g.replaceSign(),
    npcWalk: (n, g) => g.npcWalk(n),
    toast: (n, g) => g.ui.toast(n.text),
    sfx: n => GG.Audio.sfx(n.name),
    event: (n, g) => GG.bus.emit(n.name, n, g),
    restorePalace: (n, g) => g.restorePalace(),
    ending: (n, g) => { g.queueEnding(); }
  };

  class Dialogue {
    constructor(game) { this.game = game; this.active = false; }

    /* who: { name, look, item? } — 대화 상대(NPC 또는 사물) */
    start(script, who, onEnd) {
      this.stack = [{ list: script, i: 0 }];
      this.who = who;
      this.onEnd = onEnd;
      this.active = true;
      this.waiting = null;
      this.game.ui.dialogOpen();
      GG.Audio.sfx('open');
      this.step();
    }

    speakerFor(id) {
      if (id === 'player') return { name: '나', look: 'player' };
      const n = this.game.world.npcs.find(x => x.id === id);
      if (!n) return this.who;
      const p = this.game.world.player;
      n.face(p.x, p.y);
      return { name: n.name, look: n.look };
    }

    step() {
      const g = this.game;
      for (;;) {
        const top = this.stack[this.stack.length - 1];
        if (!top) { this.end(); return; }
        if (top.i >= top.list.length) { this.stack.pop(); continue; }
        const node = top.list[top.i++];
        if (typeof node === 'string') return this.say(this.who, node);
        if (node.narr != null) return this.say(null, node.narr);
        if (node.do === 'devNote') {
          if (GG.CONFIG.stage >= 2) continue;
          return this.say(null, node.text, 'dev');
        }
        if (node.do) {
          const fn = GG.Actions[node.do];
          let r;
          if (fn) r = fn(node, g, this);
          else console.warn('[가갸궁] 알 수 없는 동작:', node.do);
          if (r === 'wait') { this.waiting = 'modal'; g.ui.dialogHide(true); return; }
          continue;
        }
        if (node.if) {
          const branch = GG.cond(node.if, g.state) ? node.then : node.else;
          if (branch) this.stack.push({ list: branch, i: 0 });
          continue;
        }
        if (node.choice) return this.ask(node);
        if (node.text != null) return this.say(node.who ? this.speakerFor(node.who) : this.who, node.text);
      }
    }
    resume() {
      if (!this.active || this.waiting !== 'modal') return;
      this.waiting = null;
      this.game.ui.dialogHide(false);
      this.step();
    }

    say(speaker, text, style) {
      this.waiting = 'text';
      this.shownAt = performance.now();
      this.game.ui.dialogShow(speaker, GG.fmt(text, this.game.state, this.who), null, style);
    }
    ask(node) {
      this.waiting = 'choice';
      this.shownAt = performance.now();
      this.choiceNode = node;
      const sp = node.who ? this.speakerFor(node.who) : (node.prompt ? this.who : null);
      const prompt = node.prompt || '어떻게 할까?';
      this.game.ui.dialogShow(sp, GG.fmt(prompt, this.game.state, this.who), node.choice.map(o => GG.fmt(o.label, this.game.state, this.who)));
    }

    /* fromKey: 키보드(E·Space·Enter)일 때만 선택지를 확정. 화면 탭은 선택지 버튼을 직접 눌러야 함 */
    advance(fromKey) {
      if (!this.active) return;
      const now = performance.now();
      if (now - (this.shownAt || 0) < 140) return;   // 연타로 대사를 건너뛰지 않도록
      if (this.waiting === 'text') {
        if (this.game.ui.dialogTyping()) this.game.ui.dialogFinish();
        else { GG.Audio.sfx('next'); this.step(); }
      } else if (this.waiting === 'choice') {
        if (this.game.ui.dialogTyping()) this.game.ui.dialogFinish();
        else if (fromKey) this.game.ui.dialogConfirmChoice();
        else this.game.ui.nudgeChoices();
      }
    }
    choose(i) {
      if (this.waiting !== 'choice') return;
      const node = this.choiceNode, o = node.choice[i];
      this.waiting = null;
      if (!o) return this.step();
      GG.Audio.sfx(o.retry ? 'bump' : 'select');
      if (o.retry) this.stack.push({ list: [node], i: 0 });   // 같은 질문 다시
      if (o.script && o.script.length) this.stack.push({ list: o.script, i: 0 });
      this.step();
    }

    end() {
      this.active = false;
      this.waiting = null;
      this.game.ui.dialogClose();
      const cb = this.onEnd; this.onEnd = null;
      if (cb) cb();
      this.game.afterDialogue();
    }
  }

  GG.pickTalk = function (talk, state) {
    for (const t of talk) if (GG.cond(t.when, state)) return t.script;
    return null;
  };

  GG.Dialogue = Dialogue;
})(window.GG);
