package com.itda.domain.letter;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.itda.domain.letter.dto.RefineRequest;
import com.itda.domain.letter.dto.RefineResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

/**
 * 감정 메시지 표현 다듬기 (docs/12 §3·§4).
 * 원칙: "AI가 검수한다"고 표방하지 않는다(결정로그 #36) — 표현을 다듬는 3안 제안일 뿐,
 * 최종 선택과 책임은 발신자에게 있다(Argyle 2023 PNAS 구조·moral crumple zone 근거).
 * 모델·공급자는 설정으로 교체 가능 — itda.refine.model (기본 claude-haiku-4-5: 짧은 한국어
 * 재작성에 충분하고 요청당 비용이 1원 미만).
 */
@Service
public class LetterRefineService {

    private static final String SYSTEM_PROMPT = """
            당신은 관계 회복 앱 '잇다'의 표현 다듬기 도우미입니다.
            사용자가 쓴 감정 메시지를 받는 사람이 편안히 받아들일 수 있게 다듬은 3가지 안을 만듭니다.

            규칙:
            1. 비폭력대화(NVC) 원칙 — 비난형 '너' 진술을 '나' 진술로, 판단 대신 관찰과 감정으로.
            2. 분노 단어는 고통 단어로 바꿉니다("화났어" → "힘들었어/괴로웠어") — 반발을 줄이는 실험 근거.
            3. 사실을 새로 만들지 않습니다. 원문에 없는 사건·약속·과장을 추가하지 않습니다.
            4. 용서나 답장을 요구하는 문장을 넣지 않습니다.
            5. 원문의 핵심 마음(고마움/미안함/그리움 등)은 반드시 유지합니다.
            6. 각 안은 원문과 비슷한 길이의 자연스러운 한국어로.

            3가지 안의 톤: ① 담백하게 ② 따뜻하게 ③ 정중하게.
            출력은 반드시 JSON 문자열 배열만: ["안1","안2","안3"]
            다른 텍스트, 설명, 마크다운 없이 JSON 배열만 출력합니다.
            """;

    private final String model;
    private final String apiKey;
    private final ObjectMapper objectMapper;
    private volatile AnthropicClient client;

    public LetterRefineService(
            @Value("${itda.refine.model:claude-haiku-4-5}") String model,
            @Value("${itda.refine.api-key:${ANTHROPIC_API_KEY:}}") String apiKey,
            ObjectMapper objectMapper) {
        this.model = model;
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
    }

    public RefineResponse refine(RefineRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("표현 다듬기가 아직 연결되지 않았어요. (ANTHROPIC_API_KEY 필요)");
        }

        String userPrompt = "감정: " + request.emotion()
                + (request.relationLabel() != null ? "\n관계: " + request.relationLabel() : "")
                + "\n원문:\n" + request.body();

        Message message = client().messages().create(MessageCreateParams.builder()
                .model(model)
                .maxTokens(1024L)
                .system(SYSTEM_PROMPT)
                .addUserMessage(userPrompt)
                .build());

        String text = message.content().stream()
                .flatMap(block -> block.text().stream())
                .map(t -> t.text())
                .reduce("", String::concat)
                .trim();
        if (text.isBlank()) {
            throw new IllegalStateException("다듬은 문장을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
        }

        try {
            List<String> drafts = objectMapper.readValue(text,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            return new RefineResponse(drafts.stream().limit(3).toList());
        } catch (Exception e) {
            throw new IllegalStateException("다듬은 문장을 정리하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
    }

    private AnthropicClient client() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
                }
            }
        }
        return client;
    }
}
