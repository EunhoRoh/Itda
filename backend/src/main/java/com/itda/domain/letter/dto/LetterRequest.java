package com.itda.domain.letter.dto;

import com.itda.domain.letter.HintContext;
import com.itda.domain.letter.HintPeriod;
import com.itda.domain.letter.LetterEmotion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LetterRequest(
        @NotNull Long personId,
        boolean anonymous,
        @NotBlank @Size(max = 30) String senderName,
        @NotNull LetterEmotion emotion,
        @NotBlank @Size(max = 500) String body,
        boolean preset,
        // 래퍼 타입 — 이 필드를 보내지 않는 옛 클라이언트도 400 없이 받아준다
        Boolean refined,
        HintContext hintContext,
        HintPeriod hintPeriod,
        @Size(max = 60) String hintNow
) {
}
