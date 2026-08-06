package com.itda.domain.chat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.itda.domain.letter.Letter;
import com.itda.domain.letter.LetterDirection;
import com.itda.domain.letter.LetterEmotion;
import com.itda.domain.letter.LetterRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ChatApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    LetterRepository letterRepository;

    private long receivedLetterWithConnect() throws Exception {
        Letter received = letterRepository.save(Letter.builder()
                .direction(LetterDirection.RECEIVED)
                .anonymous(true)
                .senderName("용감한 사자")
                .emotion(LetterEmotion.GRATITUDE)
                .body("익명의 누군가가 당신에게 고마움을 느끼고 있습니다.")
                .preset(true)
                .build());
        mockMvc.perform(patch("/api/letters/" + received.getId() + "/react")
                        .param("reaction", "CONNECT_REQUESTED"))
                .andExpect(status().isOk());
        return received.getId();
    }

    private long openRoom(long letterId, String decision) throws Exception {
        mockMvc.perform(patch("/api/letters/" + letterId + "/decide")
                        .param("decision", decision))
                .andExpect(status().isOk());
        String body = mockMvc.perform(get("/api/chats/by-letter/" + letterId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void 익명_대화를_고르면_대화방이_열리고_도우미가_먼저_인사한다() throws Exception {
        long letterId = receivedLetterWithConnect();
        long roomId = openRoom(letterId, "ANON_CHAT");

        mockMvc.perform(get("/api/chats/" + roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anonymous").value(true))
                .andExpect(jsonPath("$.status").value("OPEN"));

        // 개설과 동시에 AI 동석 도우미의 환영 메시지가 있다
        mockMvc.perform(get("/api/chats/" + roomId + "/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("ASSISTANT"));
    }

    @Test
    void 마음만_전하면_대화방이_생기지_않는다() throws Exception {
        long letterId = receivedLetterWithConnect();
        mockMvc.perform(patch("/api/letters/" + letterId + "/decide")
                        .param("decision", "KEEP_HEART"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/chats/by-letter/" + letterId))
                .andExpect(status().isNotFound());
    }

    @Test
    void 대화방에서_메시지를_주고받는다() throws Exception {
        long roomId = openRoom(receivedLetterWithConnect(), "ANON_CHAT");

        mockMvc.perform(post("/api/chats/" + roomId + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "role", "RECIPIENT",
                                "body", "그때 그 말, 정말 저에게 하신 말이었어요?"
                        ))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/chats/" + roomId + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "role", "SENDER",
                                "body", "네, 오래 마음에 담아두고 있었어요."
                        ))))
                .andExpect(status().isCreated());

        // 환영 1 + 사용자 2
        String body = mockMvc.perform(get("/api/chats/" + roomId + "/messages"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long welcomeId = objectMapper.readTree(body).get(0).get("id").asLong();
        org.assertj.core.api.Assertions.assertThat(objectMapper.readTree(body)).hasSize(3);

        // afterId 커서 — 환영 메시지 이후만
        mockMvc.perform(get("/api/chats/" + roomId + "/messages")
                        .param("afterId", String.valueOf(welcomeId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].role").value("RECIPIENT"));
    }

    @Test
    void 도우미_이름으로는_보낼_수_없다() throws Exception {
        long roomId = openRoom(receivedLetterWithConnect(), "REVEAL");

        mockMvc.perform(post("/api/chats/" + roomId + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "role", "ASSISTANT",
                                "body", "제가 도우미인 척 해볼게요"
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 마친_대화방에는_보낼_수_없다() throws Exception {
        long roomId = openRoom(receivedLetterWithConnect(), "ANON_CHAT");

        mockMvc.perform(patch("/api/chats/" + roomId + "/close"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/chats/" + roomId + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "role", "SENDER",
                                "body", "한 마디만 더요"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void 받지_않기로_하면_대화방도_닫힌다() throws Exception {
        long letterId = receivedLetterWithConnect();
        long roomId = openRoom(letterId, "ANON_CHAT");

        // 대화 중이라도 수신자가 받지 않기로 하면 방이 닫힌다 — 차단은 언제나 무료
        mockMvc.perform(patch("/api/letters/" + letterId + "/react")
                        .param("reaction", "DECLINED"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/chats/" + roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void 키가_없으면_도우미는_안내와_함께_거절된다() throws Exception {
        long roomId = openRoom(receivedLetterWithConnect(), "ANON_CHAT");

        mockMvc.perform(post("/api/chats/" + roomId + "/assist"))
                .andExpect(status().isConflict());
    }
}
