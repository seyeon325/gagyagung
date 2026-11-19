/* 가갸궁 — 전역 설정
 * stage: 현재 개발 단계(1: 기반, 2: 미션·엔딩, 3: 완성도). devNote 대사는 stage 1에서만 표시됩니다.
 * debug: 주소 뒤에 ?debug=1 을 붙이면 켜집니다.
 *   [C] 충돌 영역 보기  [1][2][3] 미션 즉시 완료  [0] 상태 초기화
 */
window.GG = window.GG || {};
GG.DATA = GG.DATA || {};
GG.CONFIG = {
  stage: 3,
  debug: /[?&]debug=1/.test(location.search),
  playerSpeed: 74,      // px/s (월드 픽셀)
  textSpeed: 42,        // 글자/초
  interactRange: 22     // 상호작용 거리 (월드 픽셀)
};
