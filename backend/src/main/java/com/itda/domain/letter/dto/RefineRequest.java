package com.itda.domain.letter.dto;

import com.itda.domain.letter.LetterEmotion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RefineRequest(
        @NotNull LetterEmotion emotion,
        @Size(max = 20) String relationLabel,
        @NotBlank @Size(max = 500) String body
) {
}
