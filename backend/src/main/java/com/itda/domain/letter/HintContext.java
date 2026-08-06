package com.itda.domain.letter;

/**
 * 발신자 힌트 — 우리가 어떻게 아는 사이인지 (docs/12 §15-6).
 * 익명 마음의 커넥트율을 올리는 핵심 정보. 익명일 때는 자유 텍스트 대신
 * 이 선택지만 허용한다(#37 준비 문구 원칙의 연장 — 부정 내용 우회 차단).
 */
public enum HintContext {
    SCHOOL,        // 학교에서 만난 사이 (동창)
    TEACHER,       // 스승과 제자로 만난 사이 (은사님)
    WORK,          // 직장에서 만난 사이
    PART_TIME,     // 알바하며 만난 사이
    MILITARY,      // 군대에서 만난 사이
    HOBBY,         // 동호회·취미로 만난 사이 (축구, 등산, 밴드 …)
    NEIGHBORHOOD,  // 동네에서 만난 사이
    FAMILY,        // 가족·친척
    OTHER          // 그 밖의 인연
}
