package com.itda.domain.chat;

import com.itda.domain.chat.dto.ChatMessageRequest;
import com.itda.domain.chat.dto.ChatMessageResponse;
import com.itda.domain.chat.dto.ChatRoomResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatAssistService chatAssistService;

    @GetMapping("/by-letter/{letterId}")
    public ChatRoomResponse byLetter(@PathVariable Long letterId) {
        return chatService.getRoomByLetter(letterId);
    }

    @GetMapping("/{roomId}")
    public ChatRoomResponse room(@PathVariable Long roomId) {
        return chatService.getRoomResponse(roomId);
    }

    @GetMapping("/{roomId}/messages")
    public List<ChatMessageResponse> messages(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long afterId) {
        return chatService.listMessages(roomId, afterId);
    }

    @PostMapping("/{roomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse post(
            @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageRequest request) {
        return chatService.post(roomId, request.role(), request.body());
    }

    /** AI 동석 도우미 한 마디 — 결과는 방의 모든 참여자에게 보인다 */
    @PostMapping("/{roomId}/assist")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse assist(@PathVariable Long roomId) {
        List<ChatMessage> recent = chatService.recentMessages(roomId);
        String reply = chatAssistService.assist(recent, chatService.isAnonymous(roomId));
        return chatService.postAssistant(roomId, reply);
    }

    @PatchMapping("/{roomId}/close")
    public ChatRoomResponse close(@PathVariable Long roomId) {
        return chatService.close(roomId);
    }
}
