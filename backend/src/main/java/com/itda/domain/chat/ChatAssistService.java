package com.itda.domain.chat;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.itda.domain.chat.dto.ChatMessageResponse;
import java.util.List;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 대화방 AI 동석 도우미 (docs/12 §15-2, docs/07 중재 원칙 준용).
 * 중재자가 아니라 동석자다 — 판정하지 않고, 편들지 않고, 화해를 강요하지 않는다.
 * 익명 방에서는 발신자 신원 추측에 절대 응하지 않는다(익명 약속은 AI도 지킨다).
 * 모델은 itda.assist.model 설정으로 교체 가능 (기본은 refine과 같은 claude-haiku-4-5).
 */
@Service
public class ChatAssistService {

    private static final String SYSTEM_PROMPT = """
            당신은 관계 회복 앱 '잇다'의 대화방에 동석한 도우미입니다.
            오랫동안 끊겼던 두 사람이 다시 이어진 직후의 조심스러운 대화에 함께 있습니다.

            역할과 규칙:
            1. 당신은 중재자나 심판이 아니라 동석자입니다. 누가 옳은지 판정하지 않고, 어느 쪽 편도 들지 않습니다.
            2. 화해·용서·재연결을 강요하거나 재촉하지 않습니다. "천천히 가도 괜찮다"가 기본 태도입니다.
            3. 익명 대화방에서는 발신자가 누구인지 추측하거나 단서를 주지 않습니다. 신원 질문이 나오면
               "누구인지보다, 어떤 마음인지에 머물러 봐요"처럼 부드럽게 방향을 돌립니다.
            4. 대화가 잘 흐르면 끼어들지 않아도 됩니다 — 짧은 공감 한 줄이면 충분합니다.
            5. 어색한 침묵이나 막힌 대화에는 함께한 기억, 고마웠던 순간 같은 안전한 화제를 하나만 제안합니다.
            6. 긴장이나 날 선 표현이 보이면 감정을 비난 없이 반영하고("서로 조심스러운 마음이 느껴져요"),
               필요하면 쉬어가기를 제안합니다.
            7. 답은 한국어 1~3문장. 따뜻하고 담백하게. 목록·마크다운·이모지 없이 평문으로만.
            """;

    @Getter
    private final String model;
    private final String apiKey;
    private volatile AnthropicClient client;

    public ChatAssistService(
            @Value("${itda.assist.model:claude-haiku-4-5}") String model,
            @Value("${itda.refine.api-key:${ANTHROPIC_API_KEY:}}") String apiKey) {
        this.model = model;
        this.apiKey = apiKey;
    }

    public String assist(List<ChatMessage> recent, boolean anonymous) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("도우미가 아직 연결되지 않았어요. (ANTHROPIC_API_KEY 필요)");
        }

        StringBuilder transcript = new StringBuilder();
        transcript.append(anonymous
                ? "이 방은 익명 대화방입니다. 보낸이는 익명 닉네임으로만 표시됩니다.\n"
                : "이 방은 실명 대화방입니다.\n");
        transcript.append("최근 대화:\n");
        for (ChatMessage m : recent) {
            String who = switch (m.getRole()) {
                case SENDER -> "보낸이";
                case RECIPIENT -> "받은이";
                case ASSISTANT -> "도우미(당신)";
            };
            transcript.append(who).append(": ").append(m.getBody()).append('\n');
        }
        transcript.append("\n지금 이 대화에 도움이 될 한 마디를 해주세요.");

        Message message = client().messages().create(MessageCreateParams.builder()
                .model(model)
                .maxTokens(300L)
                .system(SYSTEM_PROMPT)
                .addUserMessage(transcript.toString())
                .build());

        String text = message.content().stream()
                .flatMap(block -> block.text().stream())
                .map(t -> t.text())
                .reduce("", String::concat)
                .trim();
        if (text.isBlank()) {
            throw new IllegalStateException("도우미의 답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return text;
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
