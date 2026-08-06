package com.itda.domain.memory;

/**
 * 추억 카테고리 — 입력 마찰을 줄이기 위한 선택형 (docs/04-MVP-기능정의.md §2).
 * 초기 9종에서 확장(결정 #28): 회상 단서가 많을수록 첫 마디를 쓰기 쉬워진다.
 */
public enum MemoryCategory {
    TRAVEL,       // 함께한 여행
    SCHOOL_DAYS,  // 학창 시절
    FOOD,         // 같이 먹던 것
    LAUGHTER,     // 함께 웃었던 일
    HELP,         // 힘들 때 도와준 일
    ACHIEVEMENT,  // 함께 이룬 것
    DAILY,        // 사소한 일상
    GIFT,         // 선물
    MUSIC,        // 함께 듣던 노래
    PLACE,        // 자주 가던 곳
    SHOW,         // 같이 본 것 (영화·드라마·경기)
    SPORTS,       // 같이 땀 흘린 기억 (축구·등산·운동)
    TALK,         // 나눈 이야기
    JOKE,         // 둘만 아는 농담
    CUSTOM        // 직접 입력
}
