package com.itda.domain.memory.dto;

import com.itda.domain.memory.EmotionTag;
import com.itda.domain.memory.MemoryCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MemoryRequest(
        @NotNull MemoryCategory category,
        EmotionTag emotion,
        @Min(1900) @Max(2100) Integer year,
        @Size(max = 200) String note,
        String photoUrl
) {
}
