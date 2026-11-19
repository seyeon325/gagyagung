/* 디지털 수호증 — 체험 완료 이미지를 캔버스로 그려 PNG 로 저장할 수 있게 합니다. */
(function (GG) {
  'use strict';
  const W = 720, H = 1000;
  const SERIF = '"Gowun Batang", "Nanum Myeongjo", serif';
  const SANS = '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

  let serial = null;

  async function fontsReady() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.race([
        Promise.all([document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('26px "Gowun Dodum"')]),
        new Promise(r => setTimeout(r, 1500))
      ]);
    } catch (e) { /* 기본 글꼴로 그림 */ }
  }

  /* 픽셀 블록 단청 띠 */
  function dancheong(ctx, x, y, w, s) {
    const cols = ['#3f8a74', '#c0492f', '#efe4c6', '#3b6f9c', '#efe4c6', '#c0492f'];
    for (let i = 0; i * s < w; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x + i * s, y, s, s); }
    ctx.fillStyle = '#2c5f52';
    ctx.fillRect(x, y + s, w, Math.max(2, s / 3));
  }

  function wrapCenter(ctx, text, cx, y, lh) {
    String(text).split('\n').forEach((line, i) => ctx.fillText(line, cx, y + i * lh));
  }

  GG.makeCard = async function (name) {
    await fontsReady();
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const S = GG.DATA.STORY.ending.card;
    if (!serial) serial = String(1000 + Math.floor(Math.random() * 9000));

    // 바탕: 한지
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, W, H);
    const rnd = GG.util.rng(7);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(160,130,80,0.07)' : 'rgba(255,255,255,0.25)'; ctx.fillRect(rnd() * W, rnd() * H, 2, 2); }
    // 나무 테두리 + 금선
    ctx.fillStyle = '#4a2e1b'; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18); ctx.fillRect(0, 0, 18, H); ctx.fillRect(W - 18, 0, 18, H);
    ctx.strokeStyle = '#caa76a'; ctx.lineWidth = 3; ctx.strokeRect(30, 30, W - 60, H - 60);
    dancheong(ctx, 36, 36, W - 72, 12);
    dancheong(ctx, 36, H - 54, W - 72, 12);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#9a7a4a'; ctx.font = `600 18px ${SANS}`;
    ctx.fillText('G A G Y A G U N G', W / 2, 104);
    ctx.fillStyle = '#4a2e1b'; ctx.font = `700 64px ${SERIF}`;
    ctx.fillText(S.title, W / 2, 178);
    ctx.fillStyle = '#7a6046'; ctx.font = `20px ${SANS}`;
    ctx.fillText(`제 2026-${serial} 호`, W / 2, 214);

    // 주인공 + 말빛
    const cx = W / 2, cy = 336;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
    g.addColorStop(0, 'rgba(255,210,110,0.85)'); g.addColorStop(1, 'rgba(255,210,110,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 120, cy - 120, 240, 240);
    const spr = GG.art.getCharacter('player').down[0];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, cx - 48, cy - 82, 96, 132);
    const lamp = GG.art.SPRITES.lantern({ lit: true });
    ctx.drawImage(lamp, cx - 150, cy - 70, 42, 96);
    ctx.save(); ctx.translate(cx + 150, cy - 70); ctx.scale(-1, 1); ctx.drawImage(lamp, 0, 0, 42, 96); ctx.restore();

    // 이름
    ctx.fillStyle = '#3a2a1e'; ctx.font = `700 40px ${SERIF}`;
    const nm = (name && name.trim()) || '우리말 가꿈이';
    ctx.fillText(nm, W / 2, 458);
    const tw = Math.min(420, ctx.measureText(nm).width + 60);
    ctx.fillStyle = '#caa76a'; ctx.fillRect(W / 2 - tw / 2, 474, tw, 3);

    ctx.fillStyle = '#4b3a2b'; ctx.font = `25px ${SANS}`;
    wrapCenter(ctx, S.body, W / 2, 530, 40);

    // 배운 말 세 가지
    const D = GG.DATA, d = D.DIALECT.entries, q = D.PUBLIC_LANGUAGE.quiz;
    const badges = [
      ['장터', `${d[0].expr} = ${d[0].standard}`, `${d[1].expr} = ${d[1].standard}`],
      ['서찰방', '동녘 = 동쪽', '해거름 = 해 질 무렵'],
      ['안내소', `${q[0].hard} → ${q[0].options[q[0].answer]}`, `${q[1].hard} → ${q[1].options[q[1].answer]}`]
    ];
    const bw = 196, bh = 132, gap = 18, bx0 = (W - (bw * 3 + gap * 2)) / 2, by = 668;
    badges.forEach(([title, l1, l2], i) => {
      const x = bx0 + i * (bw + gap);
      ctx.fillStyle = '#fbf4e2'; ctx.fillRect(x, by, bw, bh);
      ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, by + 1.5, bw - 3, bh - 3);
      ctx.fillStyle = '#3f6a5c'; ctx.fillRect(x, by, bw, 38);
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x + 14, by + 12, 10, 14);
      ctx.fillStyle = '#fdf6e3'; ctx.font = `700 21px ${SANS}`;
      ctx.fillText(title, x + bw / 2 + 8, by + 27);
      ctx.fillStyle = '#3a2a1e'; ctx.font = `21px ${SANS}`;
      ctx.fillText(l1, x + bw / 2, by + 76);
      ctx.fillText(l2, x + bw / 2, by + 110);
    });

    // 날짜 · 발급 · 도장
    const now = new Date();
    ctx.fillStyle = '#4b3a2b'; ctx.font = `22px ${SANS}`;
    ctx.fillText(`${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`, W / 2, 852);
    ctx.font = `700 24px ${SERIF}`;
    ctx.fillText(S.issuer, W / 2 - 24, 890);
    ctx.save();
    ctx.translate(W / 2 + 176, 874); ctx.rotate(-0.08);
    ctx.fillStyle = 'rgba(184,64,47,0.9)'; ctx.fillRect(-34, -34, 68, 68);
    ctx.strokeStyle = '#f4ead2'; ctx.lineWidth = 3; ctx.strokeRect(-28, -28, 56, 56);
    ctx.fillStyle = '#f4ead2'; ctx.font = `700 22px ${SERIF}`;
    ctx.fillText('말빛', 0, -3); ctx.fillText('지킴', 0, 22);
    ctx.restore();

    ctx.fillStyle = '#8a7056'; ctx.font = `17px ${SANS}`;
    ctx.fillText(S.team, W / 2, 936);
    return c;
  };

  GG.resetCardSerial = () => { serial = null; };
})(window.GG);
