/* 가갸궁 — 전역 설정
 * stage: 현재 개발 단계(1: 기반, 2: 미션·엔딩, 3: 완성도). devNote 대사는 stage 1에서만 표시됩니다.
 *
 * 주소 뒤에 붙이는 옵션
 *   ?debug=1  [C] 충돌 영역 보기  [1][2][3] 미션 즉시 완료  [0] 상태 초기화
 *   ?event=1  행사 공용 기기 모드 — 진행 상황을 저장하지 않고, 한동안 아무도 만지지 않으면
 *             시작 화면으로 돌아가며 상태를 지웁니다. 엔딩에 ‘다음 체험자에게 넘기기’ 버튼이 생깁니다.
 */
window.GG = window.GG || {};
GG.DATA = GG.DATA || {};
(function () {
  const q = location.search;
  GG.CONFIG = {
    stage: 3,
    debug: /[?&]debug=1/.test(q),
    eventMode: /[?&]event=1/.test(q),
    playerSpeed: 74,      // px/s (월드 픽셀)
    textSpeed: 46,        // 글자/초
    interactRange: 22,    // 상호작용 거리 (월드 픽셀)

    /* 진행 상황 저장 (개인 기기에서 새로고침해도 이어하기). 행사 모드에서는 꺼집니다. */
    save: true,
    saveMaxHours: 12,     // 이보다 오래된 저장은 버림

    /* 행사 모드: 이 시간(초) 동안 입력이 없으면 처음 화면으로 */
    idleResetSec: 150,

    /* 만족도 설문 주소 (예: 구글 설문지). 비워 두면 엔딩에 설문 버튼이 나타나지 않습니다. */
    surveyUrl: ''
  };
})();
