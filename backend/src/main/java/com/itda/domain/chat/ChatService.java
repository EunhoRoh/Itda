package com.itda.domain.chat;

import com.itda.domain.chat.dto.ChatMessageResponse;
import com.itda.domain.chat.dto.ChatRoomResponse;
import com.itda.domain.letter.Letter;
import com.itda.domain.letter.SenderDecision;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    /**
     * 커넥트 결정 직후 대화방 개설 (docs/12 §15-2). KEEP_HEART는 방을 만들지 않는다.
     * 개설과 동시에 AI 동석 도우미가 환영 메시지를 남긴다 — 첫 마디의 어색함을 줄이는 워밍업
     * (Aknin & Sandstrom 2024의 워밍업 효과를 대화방에도 적용).
     */
    @Transactional
    public void openForLetter(Letter letter, SenderDecision decision) {
        if (decision == SenderDecision.KEEP_HEART) {
            return;
        }
        if (chatRoomRepository.findByLetterId(letter.getId()).isPresent()) {
            return;
        }
        boolean anonymous = decision == SenderDecision.ANON_CHAT;
        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .letterId(letter.getId())
                .anonymous(anonymous)
                .build());
        chatMessageRepository.save(ChatMessage.builder()
                .roomId(room.getId())
                .role(ChatRole.ASSISTANT)
                .body(welcomeMessage(anonymous))
                .build());
    }

    /** 수신자가 뒤늦게 '받고 싶지 않아요'를 누르면 열려 있던 방도 닫는다 — 차단은 언제나 무료. */
    @Transactional
    public void closeIfOpen(Long letterId) {
        chatRoomRepository.findByLetterId(letterId)
                .filter(ChatRoom::isOpen)
                .ifPresent(ChatRoom::close);
    }

    public ChatRoomResponse getRoomByLetter(Long letterId) {
        return ChatRoomResponse.from(chatRoomRepository.findByLetterId(letterId)
                .orElseThrow(() -> new EntityNotFoundException("아직 열린 대화방이 없어요.")));
    }

    public ChatRoomResponse getRoomResponse(Long roomId) {
        return ChatRoomResponse.from(getRoom(roomId));
    }

    public List<ChatMessageResponse> listMessages(Long roomId, Long afterId) {
        getRoom(roomId);
        return chatMessageRepository
                .findAllByRoomIdAndIdGreaterThanOrderByIdAsc(roomId, afterId == null ? 0L : afterId)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse post(Long roomId, ChatRole role, String body) {
        ChatRoom room = getRoom(roomId);
        if (!room.isOpen()) {
            throw new IllegalStateException("마친 대화예요. 마음은 기록으로 남아 있어요.");
        }
        if (role == ChatRole.ASSISTANT) {
            throw new IllegalArgumentException("도우미 이름으로는 보낼 수 없어요.");
        }
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .roomId(roomId)
                .role(role)
                .body(body)
                .build());
        return ChatMessageResponse.from(saved);
    }

    @Transactional
    public ChatMessageResponse postAssistant(Long roomId, String body) {
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .roomId(roomId)
                .role(ChatRole.ASSISTANT)
                .body(body)
                .build());
        return ChatMessageResponse.from(saved);
    }

    @Transactional
    public ChatRoomResponse close(Long roomId) {
        ChatRoom room = getRoom(roomId);
        room.close();
        return ChatRoomResponse.from(room);
    }

    /** 도우미 호출용 — 최근 대화 맥락 (오래된 것부터) */
    public List<ChatMessage> recentMessages(Long roomId) {
        ChatRoom room = getRoom(roomId);
        if (!room.isOpen()) {
            throw new IllegalStateException("마친 대화예요.");
        }
        List<ChatMessage> recent = chatMessageRepository.findTop12ByRoomIdOrderByIdDesc(roomId);
        return recent.reversed();
    }

    public boolean isAnonymous(Long roomId) {
        return getRoom(roomId).isAnonymous();
    }

    private ChatRoom getRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("대화방을 찾을 수 없어요. id=" + roomId));
    }

    private String welcomeMessage(boolean anonymous) {
        if (anonymous) {
            return "두 마음이 이어졌어요. 서로 익명인 채로 시작하는 대화예요 — 누구인지 맞히려 하기보다, "
                    + "전하고 싶었던 마음부터 천천히 꺼내봐요. 제가 옆에서 함께할게요.";
        }
        return "두 마음이 이어졌어요. 이름을 밝히는 데는 큰 용기가 필요했을 거예요. "
                + "서두르지 않아도 괜찮으니, 함께했던 기억 하나로 시작해봐요. 제가 옆에서 함께할게요.";
    }
}
