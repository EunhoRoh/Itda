package com.itda.domain.chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findAllByRoomIdAndIdGreaterThanOrderByIdAsc(Long roomId, Long afterId);

    List<ChatMessage> findTop12ByRoomIdOrderByIdDesc(Long roomId);
}
