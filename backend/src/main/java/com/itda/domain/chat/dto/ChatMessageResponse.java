package com.itda.domain.chat.dto;

import com.itda.domain.chat.ChatMessage;
import com.itda.domain.chat.ChatRole;
import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        ChatRole role,
        String body,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(), message.getRole(), message.getBody(), message.getCreatedAt());
    }
}
