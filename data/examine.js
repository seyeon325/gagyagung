/* 살펴보기(사물) 대사 — 형식은 data/npcs.js 의 talk 와 같습니다.
 * 키는 js/world/layout.js 에서 사물에 붙인 examine 이름입니다.
 * {signOld}, {signNew} 는 data/public-language.js 의 안내문, {item} 은 바구니 속 물건입니다.
 */
(function () {
  /* 서찰함: 맞는 곳이면 배달, 아니면 서찰 내용을 떠올리게 */
  function mailbox(label, isAnswer) {
    const deliver = isAnswer ? [
      { narr: '서찰을 ‘' + label + '’ 서찰함에 넣었다.' },
      { do: 'takeHeld' },
      { do: 'setStep', id: 'post', step: 2 },
      { do: 'emote', who: 'pondElder', kind: 'surprise' },
      { who: 'pondElder', text: '오, 내 서찰이구먼! ‘모레 해거름에 느티나무 평상에서 윷놀이 한판’이라…' },
      { who: 'pondElder', text: '[[모레]]는 내일의 다음 날, [[해거름]]은 해가 넘어갈 무렵이지.\n때와 곳을 정확히 전해 줘서 고맙네!' },
      { do: 'completeMission', id: 'post' },
      { do: 'npcWalk', id: 'pondElder', to: [24.3, 21.5], dir: 'right' }
    ] : [
      { prompt: '‘' + label + '’ 서찰함이다. 서찰에 적힌 곳과는 다른 것 같다. 받는 이를 다시 읽어 볼까?', choice: [
        { label: '서찰 다시 읽기', script: [{ do: 'openLetter' }] },
        { label: '그만두기', script: [] }
      ]}
    ];
    return {
      name: '서찰함',
      talk: [
        { when: { mission: { post: 'active' }, holding: 'letter' }, script: deliver },
        { script: [{ narr: '‘' + label + '’ 서찰함이다.' }] }
      ]
    };
  }

  GG.DATA.EXAMINE = {
    maalbit: {
      name: '말빛 등',
      talk: [
        { when: { palaceRestored: true }, script: [
          { narr: '말빛 등이 따뜻한 금빛으로 타오른다. 마을 곳곳의 말소리가 이곳까지 들려오는 것 같다.' },
          { choice: [
            { label: '우리말 수호증 다시 보기', script: [{ do: 'showEnding' }] },
            { label: '마을 더 둘러보기', script: [] }
          ]}
        ]},
        { when: { allDone: true }, script: [
          { narr: '장터, 서찰방, 안내소에서 모인 말빛이 석등 안으로 스며든다…' },
          { do: 'restorePalace' },
          { narr: '말빛 등에 다시 불이 들어왔다!' },
          { do: 'ending' }
        ]},
        { script: [
          { narr: '불이 꺼진 말빛 등이다. 세 곳의 말빛을 모두 되찾으면 불이 들어올 것 같다. (모은 말빛 {done} / {total})' }
        ]}
      ]
    },

    hall: {
      name: '정전',
      talk: [
        { when: { palaceRestored: true }, script: [{ narr: '가갸궁의 정전. 현판의 글씨가 또렷하게 빛난다.' }] },
        { script: [{ narr: '가갸궁의 정전. 현판의 글씨가 흐릿하게 바래 있다.' }] }
      ]
    },

    guideSign: {
      name: '안내판',
      talk: [
        { when: { flag: 'sign_new' }, script: [
          { narr: '새로 바꿔 단 안내판이다.' },
          { narr: '「{signNew}」' }
        ]},
        { when: { step: { guide: 2 } }, script: [
          { narr: '「{signOld}」' },
          { choice: [
            { label: '쉬운 말 안내판으로 바꿔 달기', script: [
              { do: 'replaceSign' },
              { narr: '안내판을 쉬운 말로 바꿔 달았다!\n「{signNew}」' },
              { who: 'grandma', text: '이제야 한눈에 들어오는구먼! 오른쪽에 마실 물이 있다는 게지. 고마우이!' },
              { do: 'setStep', id: 'guide', step: 3 },
              { do: 'npcWalk', id: 'grandma', to: [30.2, 30.3], dir: 'right', then: { do: 'completeMission', id: 'guide' } }
            ]},
            { label: '나중에 하기', script: [] }
          ]}
        ]},
        { when: { mission: { guide: 'active' } }, script: [
          { narr: '「{signOld}」' },
          { narr: '할머니와 함께 어떤 말로 바꿀지 먼저 골라 보자.' }
        ]},
        { script: [
          { narr: '빼곡한 글씨의 안내판이다.\n「{signOld}」\n…무슨 뜻인지 한 번에 알기 어렵다.' }
        ]}
      ]
    },

    /* 장터 바구니 — 미션 01 진행 중에만 집을 수 있음 */
    basket: {
      name: '바구니',
      talk: [
        { when: { mission: { market: 'active' }, holding: 'letter' }, script: [
          { narr: '{item} 바구니다. 서찰을 들고 있어서 지금은 집을 수 없다.' }
        ]},
        { when: { mission: { market: 'active' } }, script: [
          { do: 'pickItem' },
          { narr: '{item} 바구니에서 하나를 집어 들었다.' }
        ]},
        { script: [{ narr: '싱싱한 {item}가 담긴 바구니다.' }] }
      ]
    },

    marketSign: {
      name: '장터 팻말',
      talk: [{ script: [{ narr: '‘장터’라고 적힌 나무 팻말이다. 사람들의 흥정 소리가 들릴 듯하다.' }] }]
    },
    jangdok: {
      name: '장독대',
      talk: [{ script: [{ narr: '크고 작은 옹기가 장독대에 옹기종기 모여 있다.' }] }]
    },
    well: {
      name: '우물',
      talk: [{ script: [{ narr: '맑은 물이 고인 우물이다. 두레박이 걸려 있다.' }] }]
    },
    southGate: {
      name: '남문',
      talk: [
        { when: { palaceRestored: true }, script: [{ narr: '남문 너머로 따뜻한 햇살이 비친다. 언제든 다시 찾아올 수 있을 것 같다.' }] },
        { script: [{ narr: '굳게 닫힌 남문이다. 마을 일을 다 돕기 전에는 떠날 수 없을 것 같다.' }] }
      ]
    },
    postOffice: {
      name: '서찰방',
      talk: [{ script: [{ narr: '현판에 ‘서찰방’이라고 쓰여 있다. 서찰을 모으고 나누는 곳이다.' }] }]
    },
    guideHouse: {
      name: '안내소',
      talk: [{ script: [{ narr: '현판에 ‘안내소’라고 쓰여 있다. 마을 길을 알려 주는 곳이다.' }] }]
    },

    mbox_jangdok: mailbox('장독대 집', GG.DATA.LETTER.answer === 'mbox_jangdok'),
    mbox_upper: mailbox('윗마을 집', GG.DATA.LETTER.answer === 'mbox_upper'),
    mbox_pond: mailbox('연못가 집', GG.DATA.LETTER.answer === 'mbox_pond'),
    mbox_well: mailbox('우물가 집', GG.DATA.LETTER.answer === 'mbox_well')
  };
})();
