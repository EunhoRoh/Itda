package com.itda.domain.mission;

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
class MissionApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

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

    private long startMission(long personId) throws Exception {
        String body = mockMvc.perform(post("/api/people/" + personId + "/missions"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void 미션은_워밍업부터_시작하고_단계를_진행한다() throws Exception {
        long personId = createPerson("지훈", false);
        long missionId = startMission(personId);

        mockMvc.perform(get("/api/missions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].step").value("WARMUP"));

        mockMvc.perform(patch("/api/missions/" + missionId + "/advance"))
                .andExpect(jsonPath("$.step").value("BOOSTER"));
        mockMvc.perform(patch("/api/missions/" + missionId + "/advance"))
                .andExpect(jsonPath("$.step").value("DRAFT"));
        mockMvc.perform(patch("/api/missions/" + missionId + "/advance"))
                .andExpect(jsonPath("$.step").value("SENT"));
    }

    @Test
    void 같은_사람에게_미션을_다시_시작하면_진행_중_미션을_돌려준다() throws Exception {
        long personId = createPerson("지훈", false);
        long first = startMission(personId);
        long second = startMission(personId);

        org.junit.jupiter.api.Assertions.assertEquals(first, second);
    }

    @Test
    void 안전_우려_관계에는_미션을_열_수_없다() throws Exception {
        long personId = createPerson("아무개", true);

        mockMvc.perform(post("/api/people/" + personId + "/missions"))
                .andExpect(status().isConflict());
    }

    @Test
    void 답장이_오면_미션이_끝나고_마지막_연락일이_갱신된다() throws Exception {
        long personId = createPerson("지훈", false);
        long missionId = startMission(personId);
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(patch("/api/missions/" + missionId + "/advance"));
        }

        mockMvc.perform(patch("/api/missions/" + missionId + "/result").param("result", "REPLIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.step").value("DONE"))
                .andExpect(jsonPath("$.result").value("REPLIED"));

        mockMvc.perform(get("/api/people/" + personId))
                .andExpect(jsonPath("$.lastContactAt").isNotEmpty());
    }

    @Test
    void 아직_답이_없으면_미션은_열린_채_유지된다() throws Exception {
        long personId = createPerson("지훈", false);
        long missionId = startMission(personId);
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(patch("/api/missions/" + missionId + "/advance"));
        }

        mockMvc.perform(patch("/api/missions/" + missionId + "/result").param("result", "NO_REPLY"))
                .andExpect(jsonPath("$.step").value("SENT"));

        mockMvc.perform(get("/api/missions/active"))
                .andExpect(jsonPath("$.length()").value(1));
    }
}
