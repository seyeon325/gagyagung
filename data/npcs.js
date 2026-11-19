/* NPC 와 대사
 *
 * x, y   : 발 위치 (타일 단위, 1타일 = 16px)
 * look   : js/art/characters.js 의 외형 이름
 * mission: 이 NPC가 맡은 미션 id (머리 위 ! 표시에 사용)
 * talk   : 위에서부터 조건(when)이 맞는 첫 번째 대사를 사용합니다.
 *
 * 대사 노드
 *   '문장'                          → 지금 대화 상대가 말함
 *   { who:'player', text:'…' }      → 플레이어가 말함
 *   { who:'NPC id', text:'…' }      → 다른 NPC가 끼어들어 말함
 *   { narr:'…' }                    → 해설
 *   { do:'동작', … }                → 상태 변경
 *       setFlag · clearFlag · startMission · completeMission · setStep{id,step}
 *       giveItem{id} · takeHeld · pickItem · openLetter · replaceSign
 *       npcWalk{id,to:[x,y],then:{…}} · toast · sfx · ending · devNote
 *   { choice:[ {label, script, retry} ], prompt:'…' }   retry:true → 고른 뒤 같은 질문을 다시
 *   { if:{조건}, then:[…], else:[…] }
 *
 * 조건(when/if): flag, notFlag, mission:{id:상태}, step:{id:번호}, holding:'물건'|[…],
 *               holdingAny, minDone, allDone, palaceRestored
 * 치환: {done} {total} · {held} 들고 있는 물건 · {item} 살펴보는 바구니의 물건
 *       {d01} {d01.std} 지역어와 표준어 (data/dialect.js)
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
          '앗, 새로 온 [[우리말 가꿈이]]구나! 기다리고 있었어.',
          '요즘 마을이 좀 이상해. 말을 이어 주던 [[말빛]]이 흐려진 뒤로, 다들 서로의 말을 잘 못 알아듣거든.',
          '장터, 서찰방, 안내소에 곤란한 사람들이 있대.\n머리 위에 [[노란 느낌표]]가 뜬 사람을 찾아가 봐!',
          { do: 'setFlag', flag: 'met_gaon' },
          { do: 'toast', text: '목표 · 주민 세 명을 도와 말빛 되찾기' }
        ]},
        { when: { palaceRestored: true }, script: [
          '와, 궁궐까지 환해졌어! 다들 서로 이야기하느라 바빠졌네.',
          '말이 통하니까 마을이 이렇게 따뜻해지는구나.'
        ]},
        { when: { allDone: true }, script: [
          '마을에 색이 돌아왔어! 이제 궁궐 마당의 [[말빛 등]]에 가 봐.'
        ]},
        { script: [
          '서쪽 길로 가면 [[장터]], 동쪽 길로 가면 [[서찰방]]이야.\n안내소는 바로 이 위쪽 건물이고!',
          '북쪽 큰 문 너머가 가갸궁 궁궐이야. 지금은 말빛 등이 꺼져 있어.'
        ]}
      ]
    },

    {
      id: 'keeper', name: '궁지기 할아버지', role: '궁궐 문지기', look: 'keeper',
      x: 20.2, y: 16.3, dir: 'down',
      talk: [
        { when: { palaceRestored: true }, script: [
          '허허, 말빛 등이 다시 환하게 타오르는구먼.',
          '말은 혼자 지키는 게 아니라네. 서로 귀 기울여 들을 때 비로소 살아 있는 법이지.'
        ]},
        { when: { allDone: true }, script: [
          '세 곳 모두에 말빛이 돌아왔구먼! 장하네, 가꿈이.',
          '자, 궁궐 마당의 [[말빛 등]]으로 가 보게나.'
        ]},
        { when: { minDone: 1 }, script: [
          '벌써 {done}곳에서 말빛이 돌아왔구먼. 마을이 한결 밝아졌어.',
          '남은 곳도 부탁하네.'
        ]},
        { script: [
          '이 문 너머가 가갸궁의 정전일세. 그 앞에 선 석등이 바로 [[말빛 등]]이지.',
          '말빛은 사람들이 서로의 말에 귀 기울일 때 밝아진다네.',
          '장터, 서찰방, 안내소에 다시 말이 통하게 되면 저 등에도 불이 들어올 걸세.'
        ]}
      ]
    },

    /* ── 미션 01 · 충남 말 장터 ── */
    {
      id: 'merchant', name: '장터 아주머니', role: '채소 가게', look: 'merchant',
      mission: 'market', x: 3.5, y: 24.7, dir: 'down',
      talk: [
        { when: { mission: { market: 'available' } }, script: [
          '어서 와요. …아이고, 미안해요. 내가 오늘 기운이 좀 없네.',
          '내가 어릴 때부터 쓰던 우리 고장 말로 채소 이름을 말하면, 요새 손님들이 고개만 갸웃하다 가 버려.',
          '그 말 속에는 이 동네 사람들이 살아온 이야기가 고스란히 들어 있는데 말이야.',
          { who: 'player', text: '아주머니 말씀, 제가 귀 기울여 들어 볼게요!' },
          '정말? 고마워요. 그럼 내 말을 천천히 잘 들어 봐요.',
          { do: 'startMission', id: 'market' },
          { do: 'setStep', id: 'market', step: 1 },
          '오늘 저녁엔 전을 부칠 거라 [[{d01}]]가 한 줌 있어야 해요.',
          '전 부칠 때 넣는, 가늘고 길쭉한 초록 잎이에요. 장터 [[바구니]] 어딘가에 있을 거예요.'
        ]},
        { when: { step: { market: 1 }, holding: 'chive' }, script: [
          { do: 'emote', who: 'merchant', kind: 'heart' },
          '맞아요, 이게 바로 [[{d01}]]예요! 이제 전 부칠 준비는 다 됐네.',
          { do: 'takeHeld' },
          { do: 'setStep', id: 'market', step: 2 },
          '하나만 더 부탁해도 될까요? 깍두기를 담그려면 [[{d02}]]가 하나 있어야 해요.',
          '하얗고 통통한 뿌리채소예요. 윗부분은 살짝 푸르스름하고.'
        ]},
        { when: { step: { market: 2 }, holding: 'radish' }, script: [
          { do: 'emote', who: 'merchant', kind: 'heart' },
          '그래요, 바로 이 [[{d02}]]! 정말 고마워요.',
          { do: 'takeHeld' },
          '내가 말한 [[{d01}]]는 ‘{d01.std}’, [[{d02}]]는 ‘{d02.std}’를 이르는 말이에요.\n충청을 비롯해 여러 고장에서 오래 써 온 말이지요.',
          '같은 채소라도 고장마다 부르는 이름이 달라요. 그 이름에는 그 동네 밥상과 살림 이야기가 담겨 있고.',
          '귀 기울여 알아들어 줘서 고마워요. 이제 손님들과도 이야기가 잘 통하겠어!',
          { do: 'completeMission', id: 'market' }
        ]},
        { when: { step: { market: 1 }, holding: ['radish', 'cabbage', 'chili', 'eggplant'] }, script: [
          { do: 'emote', who: 'merchant', kind: 'sweat' },
          '어머, 그건 {held}잖아요. 그것도 싱싱하지만…',
          '내가 찾는 건 [[{d01}]]! 전 부칠 때 넣는, 가늘고 길쭉한 초록 잎이에요.'
        ]},
        { when: { step: { market: 2 }, holding: ['chive', 'cabbage', 'chili', 'eggplant'] }, script: [
          { do: 'emote', who: 'merchant', kind: 'sweat' },
          '어머, 그건 {held}잖아요. 그것도 싱싱하지만…',
          '내가 찾는 건 [[{d02}]]! 하얗고 통통한 뿌리채소예요.'
        ]},
        { when: { step: { market: 1 } }, script: [
          '[[{d01}]] 한 줌만 부탁해요. 전 부칠 때 넣는, 가늘고 길쭉한 초록 잎이에요.'
        ]},
        { when: { step: { market: 2 } }, script: [
          '[[{d02}]] 하나만 부탁해요. 하얗고 통통한 뿌리채소예요.'
        ]},
        { script: [
          '덕분에 손님들과 다시 이야기가 통하네! 말이 통하니 마음도 통하는 것 같아요.',
          '[[{d01}]]랑 [[{d02}]], 잊지 말아요!'
        ]}
      ]
    },

    /* ── 미션 02 · 말길 서찰방 ── */
    {
      id: 'postman', name: '서찰방 아저씨', role: '서찰 배달꾼', look: 'postman',
      mission: 'post', x: 40.8, y: 17.6, dir: 'down',
      talk: [
        { when: { mission: { post: 'available' } }, script: [
          '큰일이네, 큰일이야… 이 서찰을 오늘 꼭 전해야 하는데.',
          '받는 분이 어디에 사는지, 언제 오라는 건지 서찰에 적혀 있긴 해.\n그런데 말빛이 흐려져서 그런지 도통 뜻이 들어오질 않아.',
          { who: 'player', text: '제가 같이 읽어 볼게요. 뜻을 알면 직접 전해 드릴게요!' },
          '자네가? 그럼 정말 고맙지! 자, 이게 그 서찰일세.',
          { do: 'startMission', id: 'post' },
          { do: 'setStep', id: 'post', step: 1 },
          { do: 'giveItem', id: 'letter' },
          { do: 'openLetter' },
          '어떤가, 어느 집으로 가야 할지 알겠나?',
          '알았으면 그 집 [[서찰함]]에 넣어 주게. 서찰은 들고 있으면 언제든 다시 읽을 수 있다네.'
        ]},
        { when: { mission: { post: 'active' }, holding: 'letter' }, script: [
          { prompt: '서찰에 적힌 곳을 잘 살펴보게. 마을 곳곳에 서찰함이 있다네.', choice: [
            { label: '서찰 다시 읽기', script: [{ do: 'openLetter' }] },
            { label: '괜찮아요, 다녀올게요!', script: ['그래, 부탁하네!'] }
          ]}
        ]},
        { when: { mission: { post: 'active' } }, script: [
          '서찰을 어디 두고 왔나? 여기, 다시 주겠네. 장터 채소를 드느라 내려놓았나 보군.',
          { do: 'giveItem', id: 'letter' }
        ]},
        { script: [
          '서찰이 제때 제자리에 닿았네! 말뜻을 바로 아는 게 이렇게 중요하구먼.'
        ]}
      ]
    },
    {
      id: 'pondElder', name: '연못가 할아버지', role: '연못가 초가 주인', look: 'grandpa',
      x: 42.4, y: 24.8, dir: 'left',
      talk: [
        { when: { mission: { post: 'done' } }, script: [
          '[[모레]] [[해거름]]엔 느티나무 평상에 가야지! 윷가락부터 챙겨 둬야겠어.'
        ]},
        { script: [
          '연못 구경이 제일이지. 그런데 오늘은 왠지 반가운 소식이 올 것만 같구먼.'
        ]}
      ]
    },

    /* ── 미션 03 · 쉬운 말 안내소 ── */
    {
      id: 'grandma', name: '길 찾는 할머니', role: '마을 주민', look: 'grandma',
      mission: 'guide', x: 20.0, y: 29.2, dir: 'up',
      talk: [
        { when: { mission: { guide: 'available' } }, script: [
          '여보게, 젊은이. 이 안내문 좀 같이 봐 줄 수 있겠나?',
          '글자는 다 보이는데, 무슨 말인지 도무지 모르겠어.\n목이 말라 물 마실 곳을 찾는 중인데 말이야.',
          { who: 'player', text: '제가 쉬운 말로 바꿔 볼게요!' },
          '아이고, 고마워라.',
          { do: 'startMission', id: 'guide' },
          { do: 'setStep', id: 'guide', step: 1 },
          '안내판에는 이렇게 쓰여 있다네.',
          { narr: '「{signOld}」' }
        ].concat(quizScript, [
          '이제 다 알겠어! ‘본 안내판 기준’도 ‘이 안내판에서’라고 쓰면 되겠구먼.',
          '이 쉬운 말로 [[안내판]]을 새로 바꿔 달아 주겠나?',
          { do: 'setStep', id: 'guide', step: 2 }
        ])},
        { when: { step: { guide: 1 } }, script: [
          '어디까지 했더라? 처음부터 다시 같이 골라 보세.'
        ].concat(quizScript, [
          '이 쉬운 말로 [[안내판]]을 새로 바꿔 달아 주겠나?',
          { do: 'setStep', id: 'guide', step: 2 }
        ])},
        { when: { step: { guide: 2 } }, script: [
          '바로 옆 [[안내판]]을 새로 바꿔 달아 주게.'
        ]},
        { when: { step: { guide: 3 } }, script: [
          '오른쪽으로 가면 마실 물이 있다니, 얼른 가 봐야지.'
        ]},
        { script: [
          '아이고, 시원하다! 쉬운 말로 쓰니 이렇게 한눈에 들어오는구먼. 고마우이.'
        ]}
      ]
    },

    {
      id: 'duri', name: '두리', role: '장터 손님', look: 'customer',
      x: 6.0, y: 17.3, dir: 'down',
      talk: [
        { when: { mission: { market: 'done' } }, script: [
          '[[{d01}]]가 부추였다니! 아주머니 말을 알아듣고 나니 장 보는 게 훨씬 재미있어.',
          '같은 채소도 고장마다 부르는 이름이 다르다니, 신기하지?'
        ]},
        { script: [
          '나는 다른 고장에서 왔거든. 아주머니가 쓰시는 말을 다 알아듣진 못했어.',
          '그래도 말씨가 참 정겹더라. 무슨 뜻인지 알고 싶어.'
        ]}
      ]
    },

    {
      id: 'elder', name: '마을 어르신', role: '평상 지킴이', look: 'villager',
      x: 27.6, y: 20.8, dir: 'left',
      talk: [
        { when: { palaceRestored: true }, script: [
          '평상에 다시 이야기꽃이 피었구먼. 역시 마을은 말소리가 들려야 제맛이지.'
        ]},
        { when: { mission: { post: 'done' } }, script: [
          '연못가 영감이 모레 해거름에 윷놀이하러 온다더군. 평상을 잘 닦아 둬야겠어.'
        ]},
        { when: { minDone: 1 }, script: [
          '어디선가 웃음소리가 다시 들려오는구먼. 자네가 애쓰고 있다지?'
        ]},
        { script: [
          '예전엔 이 느티나무 평상에 앉아 해 지는 줄 모르고 이야기를 나눴지.',
          '말빛이 흐려지고 나서는 다들 말수가 줄었어. 마을이 이렇게 조용할 수가 없네.'
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
