package com.itda.domain.letter;

/**
 * 수신자가 커넥트를 누른 뒤 발신자의 선택 (docs/12 §15-1).
 * 공개 결정권은 항상 발신자에게 있다.
 */
public enum SenderDecision {
    NONE,       // 아직 결정 전
    REVEAL,     // 실명 공개하고 대화
    ANON_CHAT,  // 익명(닉네임) 유지한 채 대화
    KEEP_HEART  // 마음만 전할게요 (종료)
}
