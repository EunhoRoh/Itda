package com.itda.domain.letter;

/**
 * 마음 배달 감정 (docs/12 §2·§5).
 * deliverable=false(서운함·화남)는 편지로 배달하지 않고 릴레이 중재로 라우팅한다 (결정로그 #29).
 */
public enum LetterEmotion {
    GRATITUDE(true),   // 고마움
    FONDNESS(true),    // 호감
    APOLOGY(true),     // 미안함
    RECONCILE(true),   // 화해·오해 풀기
    CHEER(true),       // 응원
    MEMORY_KEEP(true), // 추억 간직
    GREETING(true),    // 안부
    ADMIRE(true),      // 닮고 싶음
    RESENT(false),     // 서운함 → 중재 경로
    ANGER(false);      // 화남 → 중재 경로

    private final boolean deliverable;

    LetterEmotion(boolean deliverable) {
        this.deliverable = deliverable;
    }

    public boolean deliverable() {
        return deliverable;
    }
}
