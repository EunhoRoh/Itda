package com.itda.domain.chat.dto;

import com.itda.domain.chat.ChatRoom;
import com.itda.domain.chat.ChatRoomStatus;

public record ChatRoomResponse(
        Long id,
        Long letterId,
        boolean anonymous,
        ChatRoomStatus status
) {
    public static ChatRoomResponse from(ChatRoom room) {
        return new ChatRoomResponse(room.getId(), room.getLetterId(), room.isAnonymous(), room.getStatus());
    }
}
