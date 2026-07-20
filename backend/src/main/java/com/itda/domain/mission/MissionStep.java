package com.itda.domain.mission;

/**
 * 재연락 미션 단계 (docs/04-MVP-기능정의.md §3)
 * WARMUP(워밍업) → BOOSTER(용기 부스터) → DRAFT(초안 작성) → SENT(보냄, 결과 대기) → DONE(종료)
 */
public enum MissionStep {
    WARMUP, BOOSTER, DRAFT, SENT, DONE;

    public MissionStep next() {
        return switch (this) {
            case WARMUP -> BOOSTER;
            case BOOSTER -> DRAFT;
            case DRAFT -> SENT;
            case SENT, DONE -> throw new IllegalStateException("더 진행할 단계가 없어요.");
        };
    }
}
