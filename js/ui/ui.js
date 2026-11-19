/* 화면 UI (DOM) — 시작 화면 · 인트로 · HUD · 대화창 · 메뉴 · 터치 조작 */
(function (GG) {
  'use strict';
  const $ = s => document.querySelector(s);
  const ICON = {
    soundOn: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2zM11 5h1v1h1v4h-1v1h-1v-1h1V6h-1zM13 3h1v1h1v8h-1v1h-1v-1h1V4h-1z"/></svg>',
    soundOff: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2zM11 6h1v1h1V6h1v1h-1v1h1v1h-1V8h-1v1h-1V8h1V7h-1z"/></svg>',
    menu: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="currentColor" d="M3 4h10v2H3zM3 7h10v2H3zM3 10h10v2H3z"/></svg>'
  };

  const UI = {
    init(game) {
      this.game = game;
      this.el = {
        title: $('#screen-title'), intro: $('#screen-intro'), introText: $('#intro-text'), introDots: $('#intro-dots'),
        hud: $('#hud'), questHint: $('#quest-hint'), questList: $('#quest-list'), questCount: $('#quest-count'),
        banner: $('#place-banner'), toasts: $('#toast-wrap'), ctrlHint: $('#controls-hint'),
        dialog: $('#dialog'), dlgName: $('#dlg-name'), dlgText: $('#dlg-text'), dlgChoices: $('#dlg-choices'), dlgPortrait: $('#dlg-portrait'),
        touch: $('#touch'), joyBase: $('#joy-base'), joyKnob: $('#joy-knob'), action: $('#btn-action'),
        menu: $('#menu'), sound: $('#btn-sound'), menuBtn: $('#btn-menu')
      };
      const e = this.el;
      e.menuBtn.innerHTML = ICON.menu;
      this.refreshSound();
      document.body.classList.toggle('is-touch', GG.util.isTouch());

      // 시작 화면 장식 등불
      const lit = GG.art.SPRITES.lantern({ lit: true });
      document.querySelectorAll('.logo-lantern').forEach(c => c.getContext('2d').drawImage(lit, 0, 0));

      $('#btn-start').addEventListener('click', () => game.startJourney());
      $('#btn-intro-next').addEventListener('click', () => this.introNext());
      $('#btn-intro-skip').addEventListener('click', () => this.introEnd());
      e.sound.addEventListener('click', () => { GG.Audio.init(); GG.Audio.setEnabled(!GG.Audio.enabled); this.refreshSound(); });
      e.menuBtn.addEventListener('click', () => game.openMenu());
      e.menu.addEventListener('click', ev => {
        const b = ev.target.closest('[data-act]');
        if (!b) { if (ev.target === e.menu) game.closeMenu(); return; }
        const act = b.dataset.act;
        if (act === 'resume') game.closeMenu();
        else if (act === 'sound') { GG.Audio.init(); GG.Audio.setEnabled(!GG.Audio.enabled); this.refreshSound(); }
        else if (act === 'help') this.menuPage('help');
        else if (act === 'restart') this.menuPage('confirm');
        else if (act === 'back') this.menuPage('main');
        else if (act === 'restart-yes') game.restart();
      });
      // 대화창: 누르면 넘기기
      e.dialog.addEventListener('click', ev => {
        if (ev.target.closest('.dlg-choice')) return;
        game.dialogue.advance(false);
      });
      e.action.addEventListener('pointerdown', ev => { ev.preventDefault(); GG.Input.press('act'); });

      this.buildQuestList();
      GG.bus.on('state', () => { this.refreshHud(); this.refreshInv(); });

      // 들고 있는 물건 · 서찰
      e.inv = $('#inv'); e.invIcon = $('#inv-icon'); e.invName = $('#inv-name'); e.invRead = $('#inv-read');
      e.inv.addEventListener('click', () => {
        if (game.state.held === 'letter' && !game.dialogue.active) this.openLetter(null);
      });
      e.letter = $('#letter'); e.letterGloss = $('#letter-gloss');
      $('#btn-letter-close').addEventListener('click', () => this.closeLetter());
      e.letter.addEventListener('click', ev => {
        const w = ev.target.closest('.word');
        if (!w) return;
        e.letter.querySelectorAll('.word').forEach(x => x.classList.toggle('on', x === w));
        e.letterGloss.innerHTML = `<b>${GG.util.escape(w.dataset.word)}</b> — ${GG.util.escape(w.dataset.gloss)}`;
        GG.Audio.sfx('select');
      });

      // 엔딩
      e.tour = $('#tour-caption');
      e.ending = $('#screen-ending'); e.cardImg = $('#card-img'); e.cardName = $('#card-name');
      let nameT = null;
      e.cardName.addEventListener('input', () => { clearTimeout(nameT); nameT = setTimeout(() => this.renderCard(), 300); });
      e.cardName.addEventListener('keydown', ev => ev.stopPropagation());
      $('#btn-card-save').addEventListener('click', () => this.saveCard());
      $('#btn-ending-explore').addEventListener('click', () => game.closeEnding());
      $('#btn-ending-restart').addEventListener('click', () => game.restart());
      $('#btn-continue').addEventListener('click', () => game.continueJourney());
      $('#btn-next-player').addEventListener('click', () => game.restart());
      this.show($('#btn-next-player'), GG.CONFIG.eventMode);
      const sv = $('#btn-survey');
      if (GG.CONFIG.surveyUrl) { sv.href = GG.CONFIG.surveyUrl; this.show(sv, true); }
      window.addEventListener('resize', () => this.placeInv());
    },

    /* ── 들고 있는 물건 ── */
    placeInv() {
      const e = this.el, q = $('#quest');
      if (e.inv && q.offsetHeight) e.inv.style.top = (q.offsetTop + q.offsetHeight + 8) + 'px';
    },
    refreshInv() {
      const e = this.el, id = this.game.state.held;
      if (!e.inv) return;
      e.inv.classList.toggle('hidden', !id);
      this.placeInv();
      if (id === this.lastHeld) return;
      this.lastHeld = id;
      const ctx = e.invIcon.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      if (id) {
        ctx.drawImage(this.game.world.spr('itemIcon', { id }).c, 0, 0);
        e.invName.textContent = GG.DATA.ITEMS[id].name;
        e.invRead.classList.toggle('hidden', id !== 'letter');
        e.inv.classList.toggle('clickable', id === 'letter');
        e.inv.classList.remove('pop'); void e.inv.offsetWidth; e.inv.classList.add('pop');
      }
    },

    /* ── 서찰 ── */
    openLetter(onClose) {
      const L = GG.DATA.LETTER, e = this.el;
      const words = s => GG.util.escape(GG.fmt(s, this.game.state))
        .replace(/\[\[(.+?)\]\]/g, (m, w) => `<button class="word" data-word="${w}" data-gloss="${GG.util.escape(L.gloss[w] || '')}">${w}</button>`)
        .replace(/\n/g, '<br>');
      $('#letter-to').innerHTML = words(L.to);
      $('#letter-body').innerHTML = words(L.body);
      $('#letter-from').textContent = L.from;
      e.letterGloss.innerHTML = '';
      this.letterCb = onClose;
      this.show(e.letter, true);
      GG.Audio.sfx('paper');
      setTimeout(() => $('#btn-letter-close').focus({ preventScroll: true }), 50);
    },
    closeLetter() {
      if (this.el.letter.classList.contains('hidden')) return;
      this.show(this.el.letter, false);
      GG.Audio.sfx('paper');
      const cb = this.letterCb; this.letterCb = null;
      if (cb) cb();
    },
    get letterShown() { return !this.el.letter.classList.contains('hidden'); },
    dialogHide(on) { this.el.dialog.style.visibility = on ? 'hidden' : ''; },

    /* ── 엔딩 ── */
    tourCaption(text) {
      const t = this.el.tour;
      if (!text) { t.classList.remove('in'); return; }
      t.innerHTML = GG.rich(text);
      t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    },
    showEnding() {
      const E = GG.DATA.STORY.ending, D = GG.DATA, e = this.el;
      $('#ending-title').textContent = E.title;
      $('#ending-message').innerHTML = GG.rich(E.message);
      $('#ending-centennial').innerHTML = GG.rich(E.centennial);
      const d = D.DIALECT.entries, q = D.PUBLIC_LANGUAGE.quiz, gl = D.LETTER.gloss;
      const row = (title, items) => `<div class="w-row"><b>${title}</b><span>${items.map(x => `<i>${GG.util.escape(x)}</i>`).join('')}</span></div>`;
      $('#ending-words').innerHTML = '<p class="w-head">이번 여행에서 만난 말</p>' +
        row('장터', d.map(x => `${x.expr} = ${x.standard}`)) +
        row('서찰방', Object.keys(gl).map(k => `${k}: ${gl[k]}`)) +
        row('안내소', q.map(x => `${x.hard} → ${x.options[x.answer]}`));
      // 지역어 노트: 쓰인 지역과 출처, 같은 말의 여러 이름
      const V = D.DIALECT.variants, esc = GG.util.escape;
      $('#ending-dialect').innerHTML = `<p class="w-head">충남 말 노트</p>` +
        `<ul class="d-list">${d.map(x => `<li><b>${esc(x.expr)}</b> <span class="d-std">${esc(x.standard)}</span><span class="d-region">${esc(x.region)}</span></li>`).join('')}</ul>` +
        (V ? `<p class="d-variants"><b>${esc(V.title)}</b> ${V.items.map(v => `${esc(v.expr)}<small>(${esc(v.region)})</small>`).join(' · ')}</p>` : '') +
        `<p class="w-note">사용 지역과 뜻은 국립국어원 우리말샘에 실린 그대로예요. 같은 것도 고장마다 부르는 이름이 다르고, 그 이름에는 그 고장의 생활이 담겨 있어요.</p>`;
      this.show(e.ending, true);
      e.ending.querySelector('.ending-scroll').scrollTop = 0;
      this.renderCard();
    },
    hideEnding() { this.show(this.el.ending, false); },
    get endingShown() { return !this.el.ending.classList.contains('hidden'); },
    async renderCard() {
      const c = await GG.makeCard(this.el.cardName.value);
      this.cardCanvas = c;
      this.el.cardImg.src = c.toDataURL('image/png');
    },
    saveCard() {
      const c = this.cardCanvas;
      if (!c) return;
      GG.Audio.sfx('select');
      const file = '가갸궁_우리말수호증.png';
      c.toBlob(async blob => {
        if (!blob) return;
        try {
          const f = new File([blob], file, { type: 'image/png' });
          if (GG.util.isTouch() && navigator.canShare && navigator.canShare({ files: [f] })) {
            await navigator.share({ files: [f], title: '우리말 수호증' });
            return;
          }
        } catch (err) { if (err && err.name === 'AbortError') return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = file;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        this.toast('수호증을 저장했어요!', 'done');
      }, 'image/png');
    },

    show(el, on) { el.classList.toggle('hidden', !on); },

    refreshSound() {
      const on = GG.Audio.enabled;
      this.el.sound.innerHTML = on ? ICON.soundOn : ICON.soundOff;
      this.el.sound.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기');
      const mb = this.el.menu.querySelector('[data-act="sound"]');
      if (mb) mb.textContent = '소리: ' + (on ? '켜짐' : '꺼짐');
    },

    /* ── 시작 · 인트로 ── */
    showTitle(on) { this.show(this.el.title, on); },
    startIntro(onDone) {
      this.introIdx = 0; this.introDone = onDone;
      const n = GG.DATA.STORY.intro.length;
      this.el.introDots.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
      this.show(this.el.intro, true);
      this.renderIntro();
      setTimeout(() => $('#btn-intro-next').focus({ preventScroll: true }), 50);
    },
    renderIntro() {
      const lines = GG.DATA.STORY.intro, i = this.introIdx;
      const box = this.el.introText;
      box.classList.remove('fade'); void box.offsetWidth; box.classList.add('fade');
      box.innerHTML = GG.rich(lines[i]);
      [...this.el.introDots.children].forEach((d, k) => d.classList.toggle('on', k === i));
      $('#btn-intro-next').textContent = i === lines.length - 1 ? '시작하기' : '다음';
    },
    introNext() {
      GG.Audio.sfx('next');
      if (this.introIdx >= GG.DATA.STORY.intro.length - 1) return this.introEnd();
      this.introIdx++; this.renderIntro();
    },
    introEnd() {
      if (!this.introDone) return;
      this.show(this.el.intro, false);
      const cb = this.introDone; this.introDone = null; cb();
    },
    get introOpen() { return !!this.introDone; },

    /* ── HUD ── */
    showHud(on) {
      this.show(this.el.hud, on);
      this.show(this.el.touch, on && GG.util.isTouch());
      if (on) { this.refreshHud(); this.refreshInv(); }
    },
    buildQuestList() {
      this.el.questList.innerHTML = GG.DATA.MISSIONS.map(m =>
        `<li><button class="q-item" data-id="${m.id}" title="미션 ${m.no} · ${m.title}"><i class="q-dot"></i><span class="q-name">${m.short}</span></button></li>`).join('');
      // 미션 칸을 누르면: 진행 중이면 그 미션 목표로 바꿔 보여 주고, 시작 전이면 찾아갈 곳을 알려 줌
      this.el.questList.addEventListener('click', ev => {
        const b = ev.target.closest('.q-item');
        if (!b) return;
        const st = this.game.state, m = GG.DATA.MISSIONS.find(x => x.id === b.dataset.id), s = st.status(m.id);
        GG.Audio.sfx('select');
        if (s === 'active') { st.focus = m.id; this.refreshHud(); }
        else if (s === 'available') this.toast(`미션 ${m.no} [[${m.title}]] · ${m.where}를 찾아가세요`);
        else this.toast(`미션 ${m.no} [[${m.title}]] · 완료!`, 'done');
      });
    },
    showContinue(on) {
      this.show($('#btn-continue'), on);
      const s = $('#btn-start');
      s.textContent = on ? '처음부터 시작' : '여행 시작하기';
      s.classList.toggle('btn-primary', !on);
      s.classList.toggle('btn-big', !on);
    },
    refreshHud() {
      const st = this.game.state, S = GG.DATA.STORY.hints;
      const cur = $('#quest-current');
      let hint, curM = null;
      if (st.flags.palace_restored) hint = S.restored;
      else if (!st.flags.met_gaon) hint = S.start;
      else if (st.allDone()) hint = S.allDone;
      else {
        const act = GG.DATA.MISSIONS.filter(x => st.missions[x.id].status === 'active');
        const m = act.find(x => x.id === st.focus) || act[0];
        const ms = m && st.missions[m.id];
        hint = m && m.hints && m.hints[ms.step] ? m.hints[ms.step] : S.explore;
        if (m && m.hints && m.hints[ms.step]) curM = m;
      }
      // 진행 중인 미션 이름을 목표 문구 위에 따로 표시
      if (curM) {
        const steps = Object.keys(curM.hints).length, step = st.missions[curM.id].step;
        cur.innerHTML = `<b>미션 ${curM.no}</b> ${GG.util.escape(curM.title)}${steps > 1 ? ` <span>${step}/${steps}단계</span>` : ''}`;
      }
      this.show(cur, !!curM);
      this.el.questHint.innerHTML = GG.rich(GG.fmt(hint, st));
      this.el.questCount.textContent = `${st.doneCount()} / ${GG.DATA.MISSIONS.length}`;
      this.el.questList.querySelectorAll('.q-item').forEach(li => {
        const s = st.status(li.dataset.id);
        li.dataset.state = s;
        li.classList.toggle('focus', !!curM && curM.id === li.dataset.id);
        const label = { available: '시작 전', active: '진행 중', done: '완료' }[s];
        li.setAttribute('aria-label', `${li.textContent} ${label}`);
      });
      this.placeInv && this.placeInv();
    },
    toast(text, kind) {
      const t = document.createElement('div');
      t.className = 'toast' + (kind ? ' toast-' + kind : '');
      t.innerHTML = GG.rich(text);
      this.el.toasts.appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => { t.classList.remove('in'); t.classList.add('out'); setTimeout(() => t.remove(), 450); }, 3600);
    },
    placeBanner(id) {
      const a = GG.DATA.STORY.areas[id];
      if (!a) return;
      const b = this.el.banner;
      b.querySelector('small').textContent = a.sub;
      b.querySelector('strong').textContent = a.name;
      b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
      clearTimeout(this.bannerT);
      this.bannerT = setTimeout(() => b.classList.remove('in'), 2400);
    },
    controlsHint(on) {
      const h = this.el.ctrlHint;
      if (on) { h.textContent = GG.util.isTouch() ? GG.DATA.STORY.controls.touch : GG.DATA.STORY.controls.pc; h.classList.add('in'); }
      else h.classList.remove('in');
    },
    setActionReady(t) {
      const label = !t ? '말 걸기' : t.kind === 'npc' ? '말 걸기' : t.ref.pick ? '집기' : '살펴보기';
      if (this.el.action.textContent !== label) this.el.action.textContent = label;
      this.el.action.classList.toggle('ready', !!t);
    },
    joystick(j) {
      const b = this.el.joyBase;
      if (!j.active) { b.classList.remove('on'); return; }
      b.classList.add('on');
      b.style.left = j.ox + 'px'; b.style.top = j.oy + 'px';
      this.el.joyKnob.style.transform = `translate(${j.kx || 0}px, ${j.ky || 0}px)`;
    },

    /* ── 대화창 ── */
    dialogOpen() { this.show(this.el.dialog, true); document.body.classList.add('in-dialog'); },
    dialogClose() { this.show(this.el.dialog, false); document.body.classList.remove('in-dialog'); clearInterval(this.typeT); this.typing = false; },
    dialogShow(speaker, text, choices, style) {
      const e = this.el;
      e.dialog.classList.toggle('narr', !speaker);
      e.dialog.classList.toggle('dev', style === 'dev');
      e.dialog.classList.toggle('player', !!(speaker && speaker.look === 'player'));
      e.dlgName.textContent = speaker ? speaker.name : '';
      this.show(e.dlgName, !!speaker);
      // 초상화
      const pc = e.dlgPortrait, ctx = pc.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      if (speaker && speaker.look) {
        const sheet = GG.art.getCharacter(speaker.look);
        const oy = speaker.look === 'cat' ? 6 : sheet.small ? 5 : (speaker.look === 'keeper' ? 0 : 1);
        ctx.drawImage(speaker.look === 'cat' ? sheet.left[0] : sheet.down[0], 0, oy, 16, 16, 0, 0, 16, 16);
      }
      e.dialog.classList.toggle('has-portrait', !!(speaker && speaker.look));
      // 선택지
      e.dlgChoices.innerHTML = '';
      this.choiceIdx = 0;
      this.choices = choices || null;
      // 타자 효과
      this.parts = GG.parseRich(text);
      this.shown = 0;
      this.typing = true;
      clearInterval(this.typeT);
      const total = this.parts.filter(p => !p.br).length;
      e.dlgText.innerHTML = '';
      const tick = () => {
        this.shown = Math.min(total, this.shown + 1);
        e.dlgText.innerHTML = GG.richToHtml(this.parts, this.shown);
        if (this.shown % 3 === 1) GG.Audio.sfx('blip');
        if (this.shown >= total) this.dialogFinish();
      };
      if (total === 0) this.dialogFinish();
      else this.typeT = setInterval(tick, 1000 / GG.CONFIG.textSpeed);
      e.dialog.classList.remove('done');
    },
    dialogTyping() { return this.typing; },
    dialogFinish() {
      clearInterval(this.typeT);
      this.typing = false;
      this.el.dlgText.innerHTML = GG.richToHtml(this.parts);
      this.el.dialog.classList.add('done');
      if (this.choices && !this.el.dlgChoices.children.length) this.renderChoices();
    },
    renderChoices() {
      const box = this.el.dlgChoices;
      box.innerHTML = '';
      this.choices.forEach((label, i) => {
        const b = document.createElement('button');
        b.className = 'dlg-choice'; b.innerHTML = (GG.util.isTouch() ? '' : '<span class="num">' + (i + 1) + '</span>') + GG.rich(label);
        b.addEventListener('click', ev => { ev.stopPropagation(); this.game.dialogue.choose(i); });
        box.appendChild(b);
      });
      this.highlightChoice();
    },
    highlightChoice() { [...this.el.dlgChoices.children].forEach((b, i) => b.classList.toggle('sel', i === this.choiceIdx)); },
    moveChoice(d) {
      if (!this.choices || this.typing) return;
      this.choiceIdx = (this.choiceIdx + d + this.choices.length) % this.choices.length;
      this.highlightChoice();
    },
    nudgeChoices() {
      const b = this.el.dlgChoices;
      b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge');
    },
    dialogConfirmChoice() { this.game.dialogue.choose(this.choiceIdx); },
    dialogHeightPx() { return this.el.dialog.classList.contains('hidden') ? 0 : this.el.dialog.offsetHeight + 16; },

    /* ── 메뉴 ── */
    menuOpen(on) { this.show(this.el.menu, on); if (on) this.menuPage('main'); },
    get menuShown() { return !this.el.menu.classList.contains('hidden'); },
    menuPage(p) {
      this.show($('#menu-main'), p === 'main');
      this.show($('#menu-help'), p === 'help');
      this.show($('#menu-confirm'), p === 'confirm');
    }
  };

  GG.UI = UI;
})(window.GG);
