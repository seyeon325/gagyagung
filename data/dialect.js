/* ─────────────────────────────────────────────────────────────
 * 충남(충청) 지역어 데이터 — 미션 01 「충남 말 장터」
 * ─────────────────────────────────────────────────────────────
 * 원칙
 *  1. 출처로 확인한 실제 지역어만 씁니다. 확인하지 않은 표현은 만들어 넣지 않습니다.
 *  2. 지역어를 틀린 말·우스운 말로 다루지 않습니다. 그 고장의 생활과 문화를 담은 말로 소개합니다.
 *  3. 우리말샘은 아래 두 낱말을 ‘충청’ 등 여러 지역의 방언으로 싣고 있습니다.
 *     게임 속에서도 ‘충남에서만 쓰는 말’이라고 하지 않고 ‘충청을 비롯한 여러 고장의 말’로 소개합니다.
 *  4. 낱말을 바꾸려면 expr / standard / clue 와 source 를 함께 고치고,
 *     data/npcs.js 의 장터 아주머니 대사에서 조사(를/을, 는/은)가 맞는지 확인하세요.
 *
 * 대사·안내 문구에서는 {d01}=expr, {d01.std}=standard 로 불러 씁니다.
 */
GG.DATA.DIALECT = {
  status: 'verified',
  entries: [
    {
      id: 'd01', expr: '정구지', standard: '부추', item: 'chive',
      clue: '전 부칠 때 넣는, 가늘고 길쭉한 초록 잎',
      source: '국립국어원 우리말샘 「정구지」 — ‘부추’의 방언(경상, 전북, 충청)',
      url: 'https://opendict.korean.go.kr/dictionary/view?sense_no=433889',
      checked: '2026-11-20', verified: true
    },
    {
      id: 'd02', expr: '무수', standard: '무', item: 'radish',
      clue: '하얗고 통통한 뿌리채소',
      source: '국립국어원 우리말샘 「무수」 — ‘무’의 방언(강원, 경기, 경상, 전라, 제주, 충청, 함경)',
      url: 'https://opendict.korean.go.kr/dictionary/view?sense_no=494831',
      checked: '2026-11-20', verified: true
    }
  ]
};
