package com.itda.domain.letter.dto;

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
        boolean preset
) {
}
