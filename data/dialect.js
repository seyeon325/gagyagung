/* ─────────────────────────────────────────────────────────────
 * 충남 지역어 데이터 — 미션 01 「충남 말 장터」
 * ─────────────────────────────────────────────────────────────
 * 원칙
 *  1. 출처로 확인한 실제 지역어만 씁니다. 확인하지 않은 표현은 만들어 넣지 않습니다.
 *  2. 지역어를 틀린 말·우스운 말로 다루지 않습니다. 그 고장의 생활과 문화를 담은 말로 소개합니다.
 *  3. 사용 지역은 출처에 적힌 그대로 소개합니다.
 *     - region 이 ‘충남’뿐인 말은 ‘충남 말’로,
 *     - 여러 지역이 함께 적힌 말은 ‘충청을 비롯한 여러 고장의 말’로 소개합니다.
 *  4. 낱말을 바꾸면 expr / standard / region / clue / source 를 함께 고치고,
 *     data/npcs.js 의 장터 아주머니 대사에서 조사(를/을, 는/은)가 맞는지 확인하세요.
 *
 * 대사·안내 문구에서는 {d01}=expr, {d01.std}=standard, {d01.region}=region 으로 불러 씁니다.
 * 출처 확인일: 2026-11-20 (국립국어원 우리말샘)
 */
GG.DATA.DIALECT = {
  status: 'verified',
  entries: [
    {
      id: 'd01', expr: '불초', standard: '부추', item: 'chive', region: '충남',
      clue: '전 부칠 때 넣는, 가늘고 길쭉한 초록 잎',
      source: '국립국어원 우리말샘 「불초」 — ‘부추’의 방언(충남)',
      url: 'https://opendict.korean.go.kr/dictionary/view?sense_no=994420',
      verified: true
    },
    {
      id: 'd02', expr: '무수', standard: '무', item: 'radish', region: '강원·경기·경상·전라·제주·충청·함경',
      clue: '하얗고 통통한 뿌리채소',
      source: '국립국어원 우리말샘 「무수」 — ‘무’의 방언(강원, 경기, 경상, 전라, 제주, 충청, 함경)',
      url: 'https://opendict.korean.go.kr/dictionary/view?sense_no=494831',
      verified: true
    },
    {
      id: 'd03', expr: '워디', standard: '어디', region: '강원·충남',
      source: '국립국어원 우리말샘 「워디」 — ‘어디’의 방언(강원, 충남)',
      url: 'https://opendict.korean.go.kr/dictionary/view?sense_no=467867',
      verified: true
    }
  ],
  /* 같은 ‘부추’를 고장마다 다르게 부르는 말 — 상인 대사와 엔딩 ‘지역어 노트’에 씀 (모두 우리말샘) */
  variants: {
    title: '‘부추’를 부르는 여러 이름',
    items: [
      { expr: '불초', region: '충남' },
      { expr: '증구지', region: '충남' },
      { expr: '정구지', region: '경상·전북·충청' },
      { expr: '솔', region: '경상·전남' }
    ],
    source: '국립국어원 우리말샘 「불초」「증구지」「정구지」「솔」'
  }
};
