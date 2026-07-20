package com.itda.domain.memory.dto;

import com.itda.domain.memory.EmotionTag;
import com.itda.domain.memory.Memory;
import com.itda.domain.memory.MemoryCategory;

public record MemoryResponse(
        Long id,
        Long personId,
        MemoryCategory category,
        EmotionTag emotion,
        Integer year,
        String note,
        String photoUrl
) {
    public static MemoryResponse from(Memory memory) {
        return new MemoryResponse(
                memory.getId(),
                memory.getPerson().getId(),
                memory.getCategory(),
                memory.getEmotion(),
                memory.getYear(),
                memory.getNote(),
                memory.getPhotoUrl()
        );
    }
}
