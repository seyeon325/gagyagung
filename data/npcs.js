/* NPC 와 대사
 *
 * x, y   : 발 위치 (타일 단위, 1타일 = 16px)
 * look   : js/art/characters.js 의 외형 이름
 * mission: 이 NPC가 맡은 미션 id (머리 위 ! 표시에 사용)
 * after  : 미션을 마친 뒤 서 있을 자리 { mission, x, y, dir } — 이어하기 때도 이 자리에 섭니다
 * talk   : 위에서부터 조건(when)이 맞는 첫 번째 대사를 사용합니다.
 *
 * 대사 노드
 *   '문장'                          → 지금 대화 상대가 말함
 *   { who:'player', text:'…' }      → 플레이어가 말함
 *   { who:'NPC id', text:'…' }      → 다른 NPC가 끼어들어 말함
 *   { narr:'…' }                    → 해설
 *   { do:'동작', … }                → 상태 변경
 *       setFlag · clearFlag · startMission · completeMission · setStep{id,step}
 *       giveItem{id} · takeHeld · pickItem · openLetter · replaceSign · firstLight
 *       npcWalk{id,to:[x,y],dir,then:{…}} · emote{who,kind} · toast · sfx · ending
 *   { choice:[ {label, script, retry} ], prompt:'…' }   retry:true → 고른 뒤 같은 질문을 다시
 *   { if:{조건}, then:[…], else:[…] }
 *
 * 조건(when/if): flag, notFlag, mission:{id:상태}, step:{id:번호}, holding:'물건'|[…],
 *               holdingAny, minDone, allDone, palaceRestored
 * 치환: {done} {total} · {held} 들고 있는 물건 · {item} 살펴보는 바구니의 물건
 *       {d01} {d01.std} {d01.region} 지역어·표준어·사용 지역 (data/dialect.js)
 *
 * 대사 원칙: 한 번에 2~4줄. 다음에 할 일은 마지막 줄에 분명히.
 */
(function () {
  const PL = GG.DATA.PUBLIC_LANGUAGE;
  const quizScript = PL.quiz.map((q, n) => ({
    prompt: (n === 0 ? '먼저 ' : n === 1 ? '다음은 ' : '마지막으로 ') + '‘[[' + q.hard + ']]’.\n어떤 말로 바꾸면 좋을까?',
    choice: q.options.map((label, i) => (i === q.answer
      ? { label, script: [q.right] }
      : { label, script: [q.wrong], retry: true }))
  }));

  GG.DATA.NPCS = [
    {
      id: 'gaon', name: '가온', role: '길잡이 아이', look: 'child',
      x: 24.6, y: 30.4, dir: 'left',
      marker: { notFlag: 'met_gaon' },
      talk: [
        { when: { notFlag: 'met_gaon' }, script: [
          '앗, 새로 온 [[우리말 가꿈이]]구나! 나는 가온이야. 반가워!',
          { do: 'firstLight' },
          '봤어? 서로 말을 나누니까 등불에 [[말빛]]이 켜졌어!',
          { do: 'setFlag', flag: 'met_gaon' },
          '장터·서찰방·안내소에 가면 머리 위에 [[노란 !]]가 뜬 주민이 있어.\n도와주면 마을에 색이 돌아올 거야!'
        ]},
        { when: { palaceRestored: true }, script: [
          '궁궐까지 환해졌어! 말이 통하니까 마을이 이렇게 따뜻해지는구나.'
        ]},
        { when: { allDone: true }, script: [
          '마을에 색이 돌아왔어! 이제 북쪽 궁궐 마당의 [[말빛 등]]에 가 봐.'
        ]},
        { script: [
          '서쪽은 [[장터]], 동쪽은 [[서찰방]], 바로 위 건물이 [[안내소]]야.\n노란 [[!]]가 뜬 주민을 찾아가 봐!'
        ]}
      ]
    },

    {
      id: 'keeper', name: '궁지기 할아버지', role: '궁궐 문지기', look: 'keeper',
      x: 20.2, y: 16.3, dir: 'down',
      talk: [
        { when: { palaceRestored: true }, script: [
          '말빛 등이 다시 타오르는구먼. 말은 서로 귀 기울일 때 비로소 살아 있는 법이지.'
        ]},
        { when: { allDone: true }, script: [
          '세 곳 모두 말빛이 돌아왔구먼! 장하네.\n자, 문 안쪽의 [[말빛 등]]을 살펴보게.'
        ]},
        { when: { minDone: 1 }, script: [
          '벌써 {done}곳에 말빛이 돌아왔구먼. 남은 곳도 부탁하네.'
        ]},
        { script: [
          '문 안쪽 석등이 [[말빛 등]]일세. 세 곳에 말이 다시 통하면 저 등에도 불이 들어올 걸세.'
        ]}
      ]
    },

    /* ── 미션 01 · 충남 말 장터 ── */
    {
      id: 'merchant', name: '장터 아주머니', role: '채소 가게', look: 'merchant',
      mission: 'market', x: 3.5, y: 24.7, dir: 'down',
      talk: [
        { when: { mission: { market: 'available' } }, script: [
          '어서 와요. 요새 손님들이 내 말을 통 못 알아들어서 걱정이에요.',
          '어릴 때부터 쓰던 우리 고장 말인데… 그 말에 이 동네 살림 이야기가 다 들어 있거든.',
          { who: 'player', text: '제가 귀 기울여 들어 볼게요!' },
          { do: 'startMission', id: 'market' },
          { do: 'setStep', id: 'market', step: 1 },
          '고마워요! 전 부칠 [[{d01}]] 한 줌만 갖다줄래요?\n가늘고 길쭉한 초록 잎이에요. [[{d03}]] 있나 장터 바구니를 찾아봐요.'
        ]},
        { when: { step: { market: 1 }, holding: 'chive' }, script: [
          { do: 'emote', who: 'merchant', kind: 'heart' },
          '맞아요, 이게 바로 [[{d01}]]예요!',
          { do: 'takeHeld' },
          { do: 'setStep', id: 'market', step: 2 },
          '하나만 더! 깍두기 담글 [[{d02}]]도 부탁해요.\n하얗고 통통한 뿌리채소예요.'
        ]},
        { when: { step: { market: 2 }, holding: 'radish' }, script: [
          { do: 'emote', who: 'merchant', kind: 'heart' },
          '바로 이거예요, [[{d02}]]! 정말 고마워요.',
          { do: 'takeHeld' },
          '[[{d01}]]는 ‘{d01.std}’를 이르는 [[충남 말]]이에요. 다른 고장에선 정구지, 솔이라고도 하지요.\n[[{d02}]]는 ‘{d02.std}’를 이르는 말로, 충청을 비롯해 여러 고장에서 써요.',
          '같은 채소도 고장마다 부르는 이름이 달라요. 그 이름마다 그 동네 밥상 이야기가 담겨 있지요!',
          { do: 'completeMission', id: 'market' },
          { do: 'npcWalk', id: 'duri', to: [5.2, 25.3], dir: 'left' }
        ]},
        { when: { step: { market: 1 }, holding: ['radish', 'cabbage', 'chili', 'eggplant'] }, script: [
          { do: 'emote', who: 'merchant', kind: 'sweat' },
          '어머, 그건 {held}잖아요.\n내가 찾는 건 [[{d01}]]! 가늘고 길쭉한 초록 잎이에요.'
        ]},
        { when: { step: { market: 2 }, holding: ['chive', 'cabbage', 'chili', 'eggplant'] }, script: [
          { do: 'emote', who: 'merchant', kind: 'sweat' },
          '어머, 그건 {held}잖아요.\n내가 찾는 건 [[{d02}]]! 하얗고 통통한 뿌리채소예요.'
        ]},
        { when: { step: { market: 1 } }, script: [
          '[[{d01}]] 한 줌만 부탁해요. 가늘고 길쭉한 초록 잎이에요.'
        ]},
        { when: { step: { market: 2 } }, script: [
          '[[{d02}]] 하나만 부탁해요. 하얗고 통통한 뿌리채소예요.'
        ]},
        { script: [
          '[[{d01}]]랑 [[{d02}]], 잊지 말아요! 덕분에 손님들과 다시 말이 통해요.'
        ]}
      ]
    },

    /* ── 미션 02 · 말길 서찰방 ── */
    {
      id: 'postman', name: '서찰방 아저씨', role: '서찰 배달꾼', look: 'postman',
      mission: 'post', x: 40.8, y: 17.6, dir: 'down',
      talk: [
        { when: { mission: { post: 'available' } }, script: [
          '큰일이네… 이 서찰을 오늘 꼭 전해야 하는데, 받는 곳에 적힌 말을 모르겠어.',
          { who: 'player', text: '제가 읽어 볼게요!' },
          { do: 'startMission', id: 'post' },
          { do: 'setStep', id: 'post', step: 1 },
          { do: 'giveItem', id: 'letter' },
          { do: 'openLetter' },
          '어느 집인지 알겠나? 그 집 [[서찰함]]에 넣어 주게!'
        ]},
        { when: { mission: { post: 'active' }, holding: 'letter' }, script: [
          { prompt: '서찰에 적힌 곳을 찾아가 보게. 마을 곳곳에 서찰함이 있다네.', choice: [
            { label: '서찰 다시 읽기', script: [{ do: 'openLetter' }] },
            { label: '다녀올게요!', script: [] }
          ]}
        ]},
        { when: { mission: { post: 'active' } }, script: [
          '서찰을 내려놓았나? 여기, 다시 주겠네.',
          { do: 'giveItem', id: 'letter' }
        ]},
        { script: [
          '서찰이 제때 제자리에 닿았네! 말뜻을 바로 알아야 마음도 닿는 법이지.'
        ]}
      ]
    },
    {
      id: 'pondElder', name: '연못가 할아버지', role: '연못가 초가 주인', look: 'grandpa',
      x: 42.4, y: 24.8, dir: 'left',
      after: { mission: 'post', x: 24.3, y: 21.5, dir: 'right' },
      talk: [
        { when: { mission: { post: 'done' } }, script: [
          '[[모레]] [[해거름]]엔 여기서 윷놀이야! 미리 자리 봐 두는 중이라네.'
        ]},
        { script: [
          '오늘은 왠지 반가운 소식이 올 것만 같구먼.'
        ]}
      ]
    },

    /* ── 미션 03 · 쉬운 말 안내소 ── */
    {
      id: 'grandma', name: '길 찾는 할머니', role: '마을 주민', look: 'grandma',
      mission: 'guide', x: 20.0, y: 29.2, dir: 'up',
      after: { mission: 'guide', x: 30.2, y: 30.3, dir: 'right' },
      talk: [
        { when: { mission: { guide: 'available' } }, script: [
          '여보게, 물 마실 곳을 찾는데 이 안내판이 무슨 말인지 모르겠네.',
          { narr: '「{signOld}」' },
          { who: 'player', text: '쉬운 말로 같이 바꿔 봐요!' },
          { do: 'startMission', id: 'guide' },
          { do: 'setStep', id: 'guide', step: 1 }
        ].concat(quizScript, [
          '이제 알겠어! 이 쉬운 말로 [[안내판]]을 바꿔 달아 주겠나?',
          { do: 'setStep', id: 'guide', step: 2 }
        ])},
        { when: { step: { guide: 1 } }, script: [
          '처음부터 다시 같이 골라 보세.'
        ].concat(quizScript, [
          '이 쉬운 말로 [[안내판]]을 바꿔 달아 주겠나?',
          { do: 'setStep', id: 'guide', step: 2 }
        ])},
        { when: { step: { guide: 2 } }, script: [
          '바로 옆 [[안내판]]을 새로 바꿔 달아 주게.'
        ]},
        { when: { step: { guide: 3 } }, script: [
          '오른쪽으로 가면 마실 물이 있다니, 얼른 가 봐야지.'
        ]},
        { script: [
          '아이고, 시원하다! 쉬운 말로 쓰니 한눈에 들어오는구먼. 고마우이.'
        ]}
      ]
    },

    {
      id: 'duri', name: '두리', role: '장터 손님', look: 'customer',
      x: 6.0, y: 17.3, dir: 'down',
      after: { mission: 'market', x: 5.2, y: 25.3, dir: 'left' },
      talk: [
        { when: { mission: { market: 'done' } }, script: [
          '[[{d01}]]가 부추였다니! 같은 채소도 고장마다 이름이 다르구나.'
        ]},
        { script: [
          '아주머니 말을 다 알아듣진 못했지만, 말씨가 참 정겹더라. 무슨 뜻일까?'
        ]}
      ]
    },

    {
      id: 'elder', name: '마을 어르신', role: '평상 지킴이', look: 'villager',
      x: 27.6, y: 20.8, dir: 'left',
      talk: [
        { when: { palaceRestored: true }, script: [
          '평상에 다시 이야기꽃이 피었구먼. 마을은 말소리가 들려야 제맛이지.'
        ]},
        { when: { mission: { post: 'done' } }, script: [
          '연못가 영감이 모레 해거름에 윷놀이하러 온다더군. 평상을 닦아 둬야겠어.'
        ]},
        { script: [
          '예전엔 이 평상에서 해 지는 줄 모르고 이야기를 나눴지. 요즘은 다들 말수가 줄었어.'
        ]}
      ]
    },

    {
      id: 'cat', name: '나비', role: '마을 고양이', look: 'cat',
      x: 17.5, y: 20.5, dir: 'right', wander: 2.2,
      talk: [
        { script: [
          { narr: '고양이가 꼬리를 살랑이며 당신을 올려다본다.' },
          '야옹.'
        ]}
      ]
    }
  ];
})();
