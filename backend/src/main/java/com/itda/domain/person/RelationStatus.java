package com.itda.domain.person;

/**
 * 관계 상태 — 상태에 따라 앱이 제공하는 여정이 달라진다 (docs/04-MVP-기능정의.md).
 * CONNECTED(이어진) → 유지 리마인더, DRIFTED(멀어진) → 재연락 미션, ESTRANGED(틀어진) → 회복 프로그램(Phase 2)
 */
public enum RelationStatus {
    CONNECTED, DRIFTED, ESTRANGED
}
