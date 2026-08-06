package com.itda.domain.person;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
// Spring Boot 4: MockMvc 자동설정이 webmvc 모듈로, Jackson은 3.x(tools.jackson)로 이동
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PersonApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private long createPerson(String nickname, String status, boolean safetyConcern) throws Exception {
        String body = mockMvc.perform(post("/api/people")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nickname", nickname,
                                "relationType", "FRIEND",
                                "status", status,
                                "safetyConcern", safetyConcern
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void 사람을_등록하고_상태별로_조회한다() throws Exception {
        createPerson("지훈", "DRIFTED", false);
        createPerson("수진", "CONNECTED", false);

        mockMvc.perform(get("/api/people").param("status", "DRIFTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nickname").value("지훈"));
    }

    @Test
    void 안전_우려가_있으면_재연락이_차단된다() throws Exception {
        long id = createPerson("아무개", "ESTRANGED", true);

        mockMvc.perform(get("/api/people/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reconnectAllowed").value(false));
    }

    @Test
    void 관계_상태를_변경한다() throws Exception {
        long id = createPerson("지훈", "DRIFTED", false);

        mockMvc.perform(patch("/api/people/" + id + "/status").param("status", "CONNECTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONNECTED"))
                // 애프터케어 기준점 — 재연결 시점이 기록된다 (docs/12 §15-5)
                .andExpect(jsonPath("$.reconnectedAt").isNotEmpty());
    }

    @Test
    void 연락_주기를_설정하고_해제한다() throws Exception {
        long id = createPerson("지훈", "DRIFTED", false);

        mockMvc.perform(patch("/api/people/" + id + "/contact-cycle").param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactCycleDays").value(30));

        mockMvc.perform(patch("/api/people/" + id + "/contact-cycle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactCycleDays").isEmpty());
    }

    @Test
    void 안전_우려_관계에는_연락_주기를_설정할_수_없다() throws Exception {
        long id = createPerson("아무개", "ESTRANGED", true);

        mockMvc.perform(patch("/api/people/" + id + "/contact-cycle").param("days", "30"))
                .andExpect(status().isConflict());

        // 해제(days 미전달)는 보호 관계에서도 허용
        mockMvc.perform(patch("/api/people/" + id + "/contact-cycle"))
                .andExpect(status().isOk());
    }

    @Test
    void 사람에게_추억을_기록하고_조회한다() throws Exception {
        long id = createPerson("지훈", "DRIFTED", false);

        mockMvc.perform(post("/api/people/" + id + "/memories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "category", "TRAVEL",
                                "emotion", "LONGING",
                                "year", 2016,
                                "note", "밤바다에서 라면 먹던 날"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("TRAVEL"));

        mockMvc.perform(get("/api/people/" + id + "/memories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].note").value("밤바다에서 라면 먹던 날"));
    }
}
