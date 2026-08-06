package com.itda.domain.letter;

/**
 * 수신자 반응 게이트 (docs/12 §6·§15-1) — 모든 전환은 수신자 동의 단계다.
 */
public enum LetterStatus {
    DELIVERED,         // 도착 (미반응)
    HEART_RECEIVED,    // 마음만 받을게요
    CONNECT_REQUESTED, // 더 얘기하고 싶어요 (발신자가 공개 여부 결정 대기)
    DECLINED           // 받고 싶지 않아요 (해당 발신자 재발신 차단)
}
