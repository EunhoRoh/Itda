package com.itda.domain.letter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class LetterApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    LetterRepository letterRepository;

    private long createPerson(String nickname, boolean safetyConcern) throws Exception {
        String body = mockMvc.perform(post("/api/people")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nickname", nickname,
                                "relationType", "FRIEND",
                                "status", "DRIFTED",
                                "safetyConcern", safetyConcern
                        ))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private String letterJson(long personId, boolean anonymous, String emotion, boolean preset)
            throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "personId", personId,
                "anonymous", anonymous,
                "senderName", anonymous ? "용감한 사자" : "은호",
                "emotion", emotion,
                "body", "고마웠어요.",
                "preset", preset
        ));
    }

    @Test
    void 긍정_감정은_익명_준비문구로_보낼_수_있다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, true, "GRATITUDE", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.senderName").value("용감한 사자"));

        mockMvc.perform(get("/api/letters").param("direction", "SENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].emotion").value("GRATITUDE"));
    }

    @Test
    void 부정_감정은_배달하지_않고_중재로_안내한다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, true, "ANGER", true)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, false, "RESENT", true)))
                .andExpect(status().isConflict());
    }

    @Test
    void 익명은_직접_작성_문구를_보낼_수_없다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, true, "GRATITUDE", false)))
                .andExpect(status().isConflict());

        // 실명은 직접 작성 허용
        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, false, "GRATITUDE", false)))
                .andExpect(status().isCreated());
    }

    @Test
    void 안전_우려_관계에는_마음을_보낼_수_없다() throws Exception {
        long personId = createPerson("아무개", true);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, true, "GRATITUDE", true)))
                .andExpect(status().isConflict());
    }

    @Test
    void 익명은_하루_3명까지만_보낼_수_있다() throws Exception {
        for (int i = 0; i < 3; i++) {
            long personId = createPerson("사람" + i, false);
            mockMvc.perform(post("/api/letters")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(letterJson(personId, true, "GRATITUDE", true)))
                    .andExpect(status().isCreated());
        }
        long fourth = createPerson("네번째", false);
        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(fourth, true, "GRATITUDE", true)))
                .andExpect(status().isConflict());
    }

    @Test
    void 받은_마음에_반응하면_상태가_바뀐다() throws Exception {
        Letter received = letterRepository.save(Letter.builder()
                .direction(LetterDirection.RECEIVED)
                .anonymous(true)
                .senderName("다정한 펭귄")
                .emotion(LetterEmotion.RECONCILE)
                .body("익명의 누군가가 당신과 오해를 풀고 싶어 해요.")
                .preset(true)
                .build());

        mockMvc.perform(patch("/api/letters/" + received.getId() + "/react")
                        .param("reaction", "CONNECT_REQUESTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONNECT_REQUESTED"));
    }
}
