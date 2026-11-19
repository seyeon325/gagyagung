/* 공용 유틸리티 · 이벤트 버스 · 텍스트 서식 */
(function (GG) {
  'use strict';
  GG.TILE = 16;

  const U = GG.util = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    smooth: t => t * t * (3 - 2 * t),
    easeOut: t => 1 - Math.pow(1 - t, 3),
    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    hash(x, y) {
      let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return (h ^ (h >>> 16)) >>> 0;
    },
    rng(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
        return (s >>> 0) / 4294967296;
      };
    },
    isTouch: () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches,
    escape: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  };

  /* 데이터 문자열 서식: [[강조]] · {done} · {total} · {signOld} · \n */
  GG.fmt = function (text, state, ctx) {
    const D = GG.DATA, items = D.ITEMS || {};
    const tokens = {
      done: state ? state.doneCount() : 0,
      total: D.MISSIONS.length,
      signOld: D.PUBLIC_LANGUAGE.sign.old,
      signNew: D.PUBLIC_LANGUAGE.sign.new,
      held: state && state.held && items[state.held] ? items[state.held].name : '',
      item: ctx && ctx.item && items[ctx.item] ? items[ctx.item].name : ''
    };
    (D.DIALECT ? D.DIALECT.entries : []).forEach(e => { tokens[e.id] = e.expr; tokens[e.id + '.std'] = e.standard; });
    return String(text).replace(/\{([\w.]+)\}/g, (m, k) => (k in tokens ? tokens[k] : m));
  };

  /* 서식 문자열을 [{t:'글자', em:bool, br:bool}] 조각으로 */
  GG.parseRich = function (s) {
    const out = [];
    let em = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '[' && s[i + 1] === '[') { em = true; i++; continue; }
      if (s[i] === ']' && s[i + 1] === ']') { em = false; i++; continue; }
      if (s[i] === '\n') { out.push({ br: true }); continue; }
      out.push({ t: s[i], em });
    }
    return out;
  };
  GG.richToHtml = function (parts, n) {
    let html = '', open = false, count = 0;
    for (const p of parts) {
      if (n != null && count >= n) break;
      if (p.br) { if (open) { html += '</em>'; open = false; } html += '<br>'; continue; }
      if (p.em && !open) { html += '<em>'; open = true; }
      if (!p.em && open) { html += '</em>'; open = false; }
      html += U.escape(p.t);
      count++;
    }
    if (open) html += '</em>';
    return html;
  };
  GG.rich = s => GG.richToHtml(GG.parseRich(s));

  /* 아주 작은 이벤트 버스 */
  GG.bus = {
    h: {},
    on(e, f) { (this.h[e] = this.h[e] || []).push(f); },
    emit(e, ...a) { (this.h[e] || []).forEach(f => f(...a)); }
  };

  /* 조건 평가 (data 의 when / if) */
  GG.cond = function (w, s) {
    if (!w) return true;
    if (w.flag && ![].concat(w.flag).every(f => s.flags[f])) return false;
    if (w.notFlag && [].concat(w.notFlag).some(f => s.flags[f])) return false;
    if (w.mission) {
      for (const id in w.mission) {
        const m = s.missions[id];
        if (!m || ![].concat(w.mission[id]).includes(m.status)) return false;
      }
    }
    if (w.step) {
      for (const id in w.step) { const m = s.missions[id]; if (!m || m.status !== 'active' || m.step !== w.step[id]) return false; }
    }
    if (w.holding && ![].concat(w.holding).includes(s.held)) return false;
    if (w.holdingAny != null && !!s.held !== w.holdingAny) return false;
    if (w.minDone != null && s.doneCount() < w.minDone) return false;
    if (w.allDone === true && !s.allDone()) return false;
    if (w.allDone === false && s.allDone()) return false;
    if (w.palaceRestored != null && !!s.flags.palace_restored !== w.palaceRestored) return false;
    return true;
  };

  GG.store = {
    get(k, d) { try { const v = localStorage.getItem('gagyagung_' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gagyagung_' + k, v); } catch (e) { /* 저장 불가 환경 */ } }
  };
})(window.GG);
