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
        java.util.Map<String, Object> json = new java.util.HashMap<>(Map.of(
                "personId", personId,
                "anonymous", anonymous,
                "senderName", anonymous ? "용감한 사자" : "은호",
                "emotion", emotion,
                "body", "고마웠어요.",
                "preset", preset
        ));
        if (anonymous) {
            json.put("hintContext", "SCHOOL"); // 익명은 관계 힌트 필수 (docs/12 §15-6)
        }
        return objectMapper.writeValueAsString(json);
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
    void 커넥트_후_발신자가_공개_여부를_결정한다() throws Exception {
        Letter received = letterRepository.save(Letter.builder()
                .direction(LetterDirection.RECEIVED)
                .anonymous(true)
                .senderName("용감한 사자")
                .emotion(LetterEmotion.FONDNESS)
                .body("익명의 누군가가 당신에게 호감을 느끼고 있습니다.")
                .preset(true)
                .build());

        // 커넥트 전에는 결정 불가
        mockMvc.perform(patch("/api/letters/" + received.getId() + "/decide")
                        .param("decision", "REVEAL"))
                .andExpect(status().isConflict());

        mockMvc.perform(patch("/api/letters/" + received.getId() + "/react")
                        .param("reaction", "CONNECT_REQUESTED"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/letters/" + received.getId() + "/decide")
                        .param("decision", "ANON_CHAT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderDecision").value("ANON_CHAT"));

        // 재결정 불가
        mockMvc.perform(patch("/api/letters/" + received.getId() + "/decide")
                        .param("decision", "REVEAL"))
                .andExpect(status().isConflict());
    }

    @Test
    void 같은_사람에게는_일주일에_한_번만_보낼_수_있다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, false, "GRATITUDE", false)))
                .andExpect(status().isCreated());

        // 결정 #34·#38 — 반복 도달 시도 자체가 스토킹 벡터라 서버가 막는다
        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(letterJson(personId, false, "GRATITUDE", false)))
                .andExpect(status().isConflict());
    }

    @Test
    void 익명은_관계_힌트가_필수다() throws Exception {
        long personId = createPerson("지훈", false);

        // hintContext 없이 익명 발신 → 409
        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "personId", personId,
                                "anonymous", true,
                                "senderName", "용감한 사자",
                                "emotion", "GRATITUDE",
                                "body", "익명의 누군가가 당신에게 고마움을 느끼고 있습니다.",
                                "preset", true
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void 익명은_자유_소개를_쓸_수_없다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "personId", personId,
                                "anonymous", true,
                                "senderName", "용감한 사자",
                                "emotion", "GRATITUDE",
                                "body", "익명의 누군가가 당신에게 고마움을 느끼고 있습니다.",
                                "preset", true,
                                "hintContext", "SCHOOL",
                                "hintNow", "지금은 서울에서 일해요"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void 힌트는_응답에_담긴다() throws Exception {
        long personId = createPerson("지훈", false);

        mockMvc.perform(post("/api/letters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "personId", personId,
                                "anonymous", true,
                                "senderName", "용감한 사자",
                                "emotion", "GRATITUDE",
                                "body", "익명의 누군가가 당신에게 고마움을 느끼고 있습니다.",
                                "preset", true,
                                "hintContext", "MILITARY",
                                "hintPeriod", "Y5_10"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hintContext").value("MILITARY"))
                .andExpect(jsonPath("$.hintPeriod").value("Y5_10"));
    }

    @Test
    void 키가_없으면_표현_다듬기는_안내와_함께_거절된다() throws Exception {
        mockMvc.perform(post("/api/letters/refine")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "emotion", "GRATITUDE",
                                "body", "그때 고마웠어"
                        ))))
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
