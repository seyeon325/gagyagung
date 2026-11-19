/* 월드 배치 — 46×36 타일(1타일 16px) 한 장의 마을
 *
 *            ┌──────────── 돌담 ────────────┐
 *            │  소나무   [ 가갸궁 정전 ]    윗마을 집 │
 *    장터     │        말빛 등(석등)        │  서찰방
 *   (서쪽)    └──── 궁궐 문 ────┘           (동쪽)
 *  ═══ 길 ═══     마을 마당(느티나무·평상)   ═══ 길 ═══
 *  장독대 집     안내소 · 안내판 · 우물가 집    연못
 *                    ▲ 남문 (시작)
 *
 * 사물 좌표 x,y 는 ‘바닥 가운데’ 기준(타일 단위)입니다.
 */
(function (GG) {
  'use strict';
  const W = 46, Hh = 36;

  function ground() {
    const g = Array.from({ length: Hh }, () => Array(W).fill('g'));
    const fill = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = t; };
    fill(13, 1, 32, 13, 'y');   // 궁궐 마당
    fill(16, 9, 29, 10, 'p');   // 월대
    fill(21, 11, 24, 14, 's');  // 궁궐 안길
    fill(14, 15, 31, 22, 's');  // 마을 마당 (박석)
    fill(21, 23, 24, 34, 'd');  // 남문 → 마당 큰길
    fill(1, 13, 11, 24, 'd');   // 장터 마당
    fill(1, 18, 13, 19, 'd');   // 서쪽 길
    fill(3, 25, 4, 26, 'd');    // 장독대 집 길
    fill(32, 18, 44, 19, 'd');  // 동쪽 길
    fill(37, 17, 38, 17, 'd');  // 서찰방 앞
    fill(40, 7, 41, 17, 'd');   // 윗마을 집 길
    fill(37, 20, 38, 21, 'd');  // 연못가 집 길
    fill(14, 28, 31, 29, 'd');  // 남쪽 동서 길
    fill(16, 27, 17, 27, 'd');  // 안내소 앞
    fill(40, 27, 44, 32, 'w');  // 연못
    return g;
  }

  const walls = [
    { h: true, x0: 0, x1: 45, y: 0 },
    { h: true, x0: 0, x1: 19, y: 35 },
    { h: true, x0: 26, x1: 45, y: 35 },
    { v: true, x: 0, y0: 1, y1: 34 },
    { v: true, x: 45, y0: 1, y1: 34 },
    { v: true, x: 12, y0: 1, y1: 13, zone: 'palace' },
    { v: true, x: 33, y0: 1, y1: 13, zone: 'palace' },
    { h: true, x0: 12, x1: 18, y: 14, zone: 'palace' },
    { h: true, x0: 27, x1: 33, y: 14, zone: 'palace' }
  ];

  const MB = { red: '#c0492f', blue: '#3b6f9c', green: '#3f8a74', yellow: '#d9a23a' };

  const objects = [
    // ── 궁궐
    { t: 'palaceHall', x: 23, y: 9, examine: 'hall', ia: [0, 8] },
    { t: 'stoneLantern', x: 23, y: 10.9, lantern: 'stone', examine: 'maalbit', id: 'maalbit', ia: [0, 6] },
    { t: 'palaceGate', x: 23, y: 15 },
    { t: 'pine', x: 14.8, y: 5 }, { t: 'pine', x: 31.2, y: 5 },
    { t: 'tree', x: 15, y: 13.4 }, { t: 'tree', x: 31, y: 13.4 },
    { t: 'lantern', x: 17.3, y: 13.6, lantern: true }, { t: 'lantern', x: 28.9, y: 13.6, lantern: true },
    // ── 마을 마당
    { t: 'zelkova', x: 28.5, y: 19 },
    { t: 'pyeongsang', x: 25.6, y: 20.4 },
    { t: 'lantern', x: 14.6, y: 16.4, lantern: true }, { t: 'lantern', x: 31.6, y: 16.4, lantern: true },
    { t: 'lantern', x: 14.6, y: 22.5, lantern: true }, { t: 'lantern', x: 31.6, y: 22.5, lantern: true },
    // ── 장터 (서쪽)
    { t: 'stall', v: { color: 'indigo', goods: ['cabbage', 'radish', 'chili'], seed: 2 }, x: 3.5, y: 16.4 },
    { t: 'stall', v: { color: 'red', goods: ['apple', 'persimmon', 'apple'], seed: 5 }, x: 8.6, y: 16.4 },
    { t: 'stall', v: { color: 'ochre', goods: ['potato', 'beans', 'potato'], seed: 8 }, x: 3.5, y: 23.3 },
    { t: 'jangdok', x: 8.6, y: 23.5, examine: 'jangdok' },
    { t: 'signpost', x: 12.2, y: 17.8, examine: 'marketSign' },
    { t: 'lantern', x: 1.4, y: 20.6, lantern: true }, { t: 'lantern', x: 11.4, y: 21.8, lantern: true }, { t: 'lantern', x: 6.1, y: 13.4, lantern: true },
    { t: 'crate', x: 11.2, y: 13.9 },
    // 미션 01 — 집을 수 있는 채소 바구니
    { t: 'basket', v: { goods: 'chive' }, x: 11.1, y: 15.7, examine: 'basket', pick: 'chive' },
    { t: 'basket', v: { goods: 'radish' }, x: 6.0, y: 21.3, examine: 'basket', pick: 'radish' },
    { t: 'basket', v: { goods: 'cabbage' }, x: 1.6, y: 24.6, examine: 'basket', pick: 'cabbage' },
    { t: 'basket', v: { goods: 'chili' }, x: 1.5, y: 15.5, examine: 'basket', pick: 'chili' },
    { t: 'basket', v: { goods: 'eggplant' }, x: 10.7, y: 24.5, examine: 'basket', pick: 'eggplant' },
    { t: 'pine', x: 2.5, y: 5.2 }, { t: 'pine', x: 6.2, y: 3.6 }, { t: 'tree', x: 9.6, y: 6.4 }, { t: 'pine', x: 3.6, y: 10.4 }, { t: 'tree', x: 8.4, y: 11.2 },
    { t: 'choga', x: 4, y: 30.2 },
    { t: 'mailbox', v: { color: MB.red }, x: 7.4, y: 30.4, examine: 'mbox_jangdok', id: 'mbox_jangdok' },
    { t: 'tree', x: 2, y: 33.8 }, { t: 'tree', x: 10.6, y: 33.6 }, { t: 'pine', x: 11.2, y: 28.6 },
    { t: 'rock', x: 8.5, y: 27.4 },
    // ── 서찰방 (동쪽)
    { t: 'hanokPost', x: 38, y: 16.8, examine: 'postOffice', ia: [0, 8] },
    { t: 'lantern', x: 34.6, y: 17.5, lantern: true }, { t: 'lantern', x: 43.6, y: 20.8, lantern: true }, { t: 'lantern', x: 41.6, y: 26.4, lantern: true },
    { t: 'hanokHouse', x: 40.5, y: 7 },
    { t: 'mailbox', v: { color: MB.blue }, x: 43.6, y: 7.4, examine: 'mbox_upper', id: 'mbox_upper' },
    { t: 'choga', x: 37.5, y: 25.2 },
    { t: 'mailbox', v: { color: MB.green }, x: 40.6, y: 25.4, examine: 'mbox_pond', id: 'mbox_pond' },
    { t: 'reeds', x: 39.4, y: 28.4 }, { t: 'reeds', x: 39.5, y: 31.8 },
    { t: 'rock', x: 39.3, y: 33.3 }, { t: 'rock', x: 44.4, y: 26.6 },
    { t: 'pine', x: 44.2, y: 12.4 }, { t: 'tree', x: 35.2, y: 9.8 }, { t: 'tree', x: 35.4, y: 31.8 }, { t: 'pine', x: 37.6, y: 34.4 }, { t: 'tree', x: 43.8, y: 34.3 },
    // ── 안내소 (남쪽)
    { t: 'hanokGuide', x: 16.6, y: 26.9, examine: 'guideHouse', ia: [0, 8] },
    { t: 'sign', v: { fresh: false }, x: 20.1, y: 27.9, examine: 'guideSign', id: 'guideSign', ia: [0, 6] },
    { t: 'choga', x: 28.5, y: 27.1 },
    { t: 'mailbox', v: { color: MB.yellow }, x: 25.6, y: 27.5, examine: 'mbox_well', id: 'mbox_well' },
    { t: 'well', x: 31, y: 31.6, examine: 'well' },
    { t: 'southGate', x: 23, y: 36, examine: 'southGate', ia: [0, -26] },
    { t: 'lantern', x: 20.4, y: 23.9, lantern: true }, { t: 'lantern', x: 25.4, y: 23.9, lantern: true },
    { t: 'lantern', x: 19.6, y: 33.8, lantern: true }, { t: 'lantern', x: 26.4, y: 33.8, lantern: true },
    { t: 'tree', x: 14.2, y: 32.6 }, { t: 'pine', x: 16.6, y: 34.6 }, { t: 'tree', x: 32, y: 34.4 },
    { t: 'rock', x: 18.2, y: 31.4 }
  ];

  // 바닥에 구워 넣는 장식 (충돌 없음)
  const decor = [
    { t: 'flowers', v: { seed: 1 }, x: 19.5, y: 7.4 }, { t: 'flowers', v: { seed: 2 }, x: 26.5, y: 7.4 },
    { t: 'flowers', v: { seed: 3 }, x: 13.6, y: 19.5 }, { t: 'flowers', v: { seed: 4 }, x: 32.4, y: 21 },
    { t: 'flowers', v: { seed: 5 }, x: 18.6, y: 26.4 }, { t: 'flowers', v: { seed: 6 }, x: 15, y: 30.6 },
    { t: 'flowers', v: { seed: 7 }, x: 7.8, y: 8.4 }, { t: 'flowers', v: { seed: 8 }, x: 36.6, y: 12.0 },
    { t: 'flowers', v: { seed: 9 }, x: 42.6, y: 23.6 }, { t: 'flowers', v: { seed: 10 }, x: 28.5, y: 33.4 },
    { t: 'flowers', v: { seed: 11 }, x: 6.6, y: 27.6 }, { t: 'flowers', v: { seed: 12 }, x: 35.6, y: 6.2 },
    { t: 'lotus', x: 41.6, y: 29.2 }, { t: 'lotus', x: 43.2, y: 30.7 }, { t: 'lotus', x: 42.2, y: 32.0 }
  ];

  /* 기본 충돌 영역 [x, y, w, h] — 스프라이트 왼쪽 위 기준(px) */
  const SOLID = {
    palaceHall: [[8, 40, 176, 88]],
    palaceGate: [[0, 26, 48, 22], [80, 26, 48, 22]],
    southGate: [[0, 28, 96, 20]],
    hanokPost: [[4, 36, 88, 44]],
    hanokGuide: [[4, 30, 72, 34]], hanokHouse: [[4, 30, 72, 34]],
    choga: [[4, 30, 72, 30]],
    pine: [[12, 40, 8, 8]], tree: [[12, 32, 8, 8]], zelkova: [[22, 58, 16, 10]],
    stall: [[2, 20, 44, 24]], jangdok: [[1, 14, 40, 16]],
    lantern: [[0, 26, 8, 6]], stoneLantern: [[2, 30, 16, 8]],
    well: [[1, 10, 24, 14]], sign: [[2, 24, 32, 8]], signpost: [[6, 24, 8, 6]], mailbox: [[3, 16, 8, 6]],
    pyeongsang: [[1, 4, 32, 14]], crate: [[1, 4, 12, 9]], basket: [[1, 7, 12, 6]], rock: [[1, 3, 11, 6]]
  };
  /* 바닥 그림자 */
  const SHADOW = {
    pine: { rx: 13, ry: 4 }, tree: { rx: 13, ry: 4 }, zelkova: { rx: 26, ry: 6 },
    stoneLantern: { rx: 9, ry: 2 }, lantern: { rx: 5, ry: 2, ox: -3 }, well: { rx: 12, ry: 3 },
    stall: { rx: 23, ry: 3 }, jangdok: { rx: 20, ry: 3 }, pyeongsang: { rx: 16, ry: 3 },
    mailbox: { rx: 4, ry: 2 }, signpost: { rx: 5, ry: 2 }, sign: { rx: 15, ry: 2 }, crate: { rx: 7, ry: 2 }, basket: { rx: 6, ry: 2 }, rock: { rx: 6, ry: 2 },
    building: { strip: 4 }
  };

  /* 색이 돌아오는 구역 (타일 단위). 어디에도 속하지 않는 곳은 palace(궁궐·마당) */
  const zones = {
    market: { x0: -5, y0: -5, x1: 13, y1: 50 },
    post: { x0: 33, y0: -5, x1: 60, y1: 50 },
    guide: { x0: 13, y0: 22.6, x1: 33, y1: 50 }
  };
  /* 장소 이름 표시용 구역 */
  const areas = [
    { id: 'palace', x0: 12, y0: 0, x1: 34, y1: 14.6 },
    { id: 'plaza', x0: 12.5, y0: 14.6, x1: 33.5, y1: 22.6 },
    { id: 'market', x0: -5, y0: -5, x1: 12.5, y1: 50 },
    { id: 'post', x0: 33.5, y0: -5, x1: 60, y1: 50 },
    { id: 'guide', x0: 12.5, y0: 22.6, x1: 33.5, y1: 50 }
  ];

  GG.LAYOUT = {
    W, H: Hh, ground, walls, objects, decor, SOLID, SHADOW, zones, areas,
    start: { x: 22.6, y: 32.4, dir: 'up' },
    titleCam: { x: 23, y: 12.5 }
  };
})(window.GG);
