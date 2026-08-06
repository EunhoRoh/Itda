package com.itda.domain.letter;

/** 발신자 힌트 — 함께한 시기. 수신자가 발신자를 추측할 단서 (docs/12 §15-6). */
public enum HintPeriod {
    OVER_10Y,  // 10년도 더 전
    Y5_10,     // 5~10년 전
    Y2_5,      // 2~5년 전
    RECENT     // 최근 2년 안
}
