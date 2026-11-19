/* 미션 정의
 * status 흐름: available(시작 전) → active(진행 중) → done(완료)
 * step  : 진행 중일 때의 세부 단계 (hints 의 번호)
 * zone  : 완료 시 색과 등불이 돌아오는 구역 (js/world/layout.js 의 zones)
 * restoreAt: 색이 퍼져 나가기 시작하는 곳 (NPC id 또는 사물 id)
 * where : 시작 전 미션 칸을 누르면 알려 주는 찾아갈 곳
 */
GG.DATA.MISSIONS = [
  {
    id: 'market', no: '01', title: '충남 말 장터', short: '장터',
    zone: 'market', npc: 'merchant', restoreAt: 'merchant', where: '서쪽 장터의 아주머니',
    summary: '상인의 말을 귀 기울여 듣고, 원하는 물건을 찾아 전해 주세요.',
    hints: {
      1: '장터 바구니에서 아주머니가 말한 [[{d01}]]를 찾아 가져다 드리세요.',
      2: '이번엔 [[{d02}]]를 찾아 아주머니께 가져다 드리세요.'
    }
  },
  {
    id: 'post', no: '02', title: '말길 서찰방', short: '서찰방',
    zone: 'post', npc: 'postman', restoreAt: 'pondElder', where: '동쪽 서찰방 아저씨',
    summary: '서찰 속 우리말을 풀어 받는 사람을 찾고, 직접 배달해 주세요.',
    hints: {
      1: '서찰을 읽고 받는 사람 집의 [[서찰함]]에 넣어 주세요. 들고 있는 서찰을 누르면 다시 읽을 수 있어요.'
    }
  },
  {
    id: 'guide', no: '03', title: '쉬운 말 안내소', short: '안내소',
    zone: 'guide', npc: 'grandma', restoreAt: 'guideSign', where: '안내판 앞 할머니',
    summary: '어려운 안내문을 누구나 알기 쉬운 우리말로 바꿔 주세요.',
    hints: {
      1: '할머니와 함께 안내판의 어려운 말을 쉬운 말로 골라 보세요.',
      2: '[[안내판]]을 살펴보고 새 안내판으로 바꿔 달아 주세요.',
      3: '할머니가 물 마실 곳을 찾아가고 있어요.'
    }
  }
];

/* 미션 02 의 서찰 — [[낱말]] 은 눌러서 뜻을 볼 수 있습니다.
 * 뜻풀이 출처: 국립국어원 표준국어대사전 (2026-11-20 확인)
 *   동녘 「명사」 네 방위의 하나. 해가 떠오르는 쪽이다. = 동쪽
 *   못가 「명사」 못의 가장자리
 *   모레 「명사」 내일의 다음 날
 *   해거름 「명사」 해가 서쪽으로 넘어가는 일. 또는 그런 때
 */
GG.DATA.LETTER = {
  to: '[[동녘]] [[못가]] 초가집 어르신께',
  body: '어르신, 그간 평안하셨는지요.\n[[모레]] [[해거름]]에 마을 마당 느티나무 평상에서\n윷놀이 한판 하십시다.',
  from: '윗마을 벗 드림',
  gloss: {
    '동녘': '해가 떠오르는 쪽. 동쪽',
    '못가': '못(연못)의 가장자리',
    '모레': '내일의 다음 날',
    '해거름': '해가 서쪽으로 넘어갈 무렵'
  },
  answer: 'mbox_pond'
};

/* 들고 다니는 물건 */
GG.DATA.ITEMS = {
  chive: { name: '부추' },
  radish: { name: '무' },
  cabbage: { name: '배추' },
  chili: { name: '고추' },
  eggplant: { name: '가지' },
  letter: { name: '서찰' }
};
