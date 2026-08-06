package com.itda.domain.chat.dto;

import com.itda.domain.chat.ChatRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotNull ChatRole role,
        @NotBlank @Size(max = 500) String body
) {
}
