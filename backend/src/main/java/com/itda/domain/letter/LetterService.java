package com.itda.domain.letter;

import com.itda.domain.chat.ChatService;
import com.itda.domain.letter.dto.LetterRequest;
import com.itda.domain.letter.dto.LetterResponse;
import com.itda.domain.person.Person;
import com.itda.domain.person.PersonService;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LetterService {

    // 하루 익명 발신 한도 — '3통'이 아니라 서로 다른 3명 (docs/12 §5)
    static final int DAILY_ANONYMOUS_LIMIT = 3;

    // 같은 수신자에게 다시 보낼 수 있기까지의 간격 (결정 #34·#38 — 법적 필수)
    static final int SAME_RECIPIENT_COOLDOWN_DAYS = 7;

    private final LetterRepository letterRepository;
    private final PersonService personService;
    private final ChatService chatService;

    @Transactional
    public LetterResponse send(LetterRequest request) {
        Person person = personService.getPerson(request.personId());

        // 안전 불변식들 — UI가 아니라 서버가 보장한다 (docs/12 §1, 결정로그 #12·#29·#37)
        if (!person.reconnectAllowed()) {
            throw new IllegalStateException("안전을 위해 이 관계에는 마음을 보내지 않아요.");
        }
        if (!request.emotion().deliverable()) {
            throw new IllegalStateException(
                    "이 마음은 일방 전달보다 대화로 풀 때 풀려요. 화해 브리지를 준비 중이에요.");
        }
        if (request.anonymous() && !request.preset()) {
            throw new IllegalStateException("익명일 때는 준비된 문구로만 보낼 수 있어요.");
        }
        if (request.anonymous() && Boolean.TRUE.equals(request.refined())) {
            throw new IllegalStateException("익명 문구는 다듬을 대상이 아니에요.");
        }
        // 거부 후 재전송 영구 금지 + 동일 수신자 쿨다운 (결정 #38 — 대법원 2022도12037:
        // 수신 여부와 무관하게 '반복 도달 시도' 자체가 스토킹. UX 옵션이 아니라 법적 필수)
        // 주: 거절 차단은 회원 도입으로 편지 1행이 양방향이 되어야 실제로 발동한다(현재는 방어 코드).
        // 지금 실효를 갖는 것은 쿨다운과 Person.reconnectAllowed다.
        if (letterRepository.existsByDirectionAndPersonIdAndStatus(
                LetterDirection.SENT, person.getId(), LetterStatus.DECLINED)) {
            throw new IllegalStateException("이분은 마음을 받지 않기로 하셨어요. 그 결정을 존중해 주세요.");
        }
        if (letterRepository.existsByDirectionAndPersonIdAndCreatedAtAfter(
                LetterDirection.SENT, person.getId(),
                LocalDateTime.now().minusDays(SAME_RECIPIENT_COOLDOWN_DAYS))) {
            throw new IllegalStateException(
                    "같은 분에게는 일주일에 한 번만 보낼 수 있어요. 기다림도 마음의 일부예요.");
        }
        if (request.anonymous() && countTodayAnonymousRecipients() >= DAILY_ANONYMOUS_LIMIT) {
            throw new IllegalStateException("익명 마음은 하루 3명까지만 보낼 수 있어요. 내일 다시 보내요.");
        }
        // 발신자 힌트 (docs/12 §15-6): 익명은 '어떻게 아는 사이'가 필수 — 맥락 없는 익명은
        // 수신자에게 호기심이 아니라 불안을 준다. 자유 텍스트 힌트는 익명에서 금지(#37의 연장).
        if (request.anonymous() && request.hintContext() == null) {
            throw new IllegalStateException("익명 마음에는 어떻게 아는 사이인지 하나만 골라주세요.");
        }
        if (request.anonymous() && request.hintNow() != null && !request.hintNow().isBlank()) {
            throw new IllegalStateException("익명일 때는 자유 소개 대신 준비된 선택지만 쓸 수 있어요.");
        }

        Letter letter = letterRepository.save(Letter.builder()
                .direction(LetterDirection.SENT)
                .personId(person.getId())
                .anonymous(request.anonymous())
                .senderName(request.senderName())
                .emotion(request.emotion())
                .body(request.body())
                .preset(request.preset())
                .refined(Boolean.TRUE.equals(request.refined()))
                .hintContext(request.hintContext())
                .hintPeriod(request.hintPeriod())
                .hintNow(request.hintNow())
                .build());
        return LetterResponse.from(letter);
    }

    public List<LetterResponse> findByDirection(LetterDirection direction) {
        return letterRepository.findAllByDirectionOrderByIdDesc(direction).stream()
                .map(LetterResponse::from)
                .toList();
    }

    @Transactional
    public LetterResponse react(Long letterId, LetterStatus reaction) {
        Letter letter = getLetter(letterId);
        letter.react(reaction);
        // 뒤늦게 받지 않기로 하면 열려 있던 대화방도 닫는다 — 차단은 언제나 무료
        if (reaction == LetterStatus.DECLINED) {
            chatService.closeIfOpen(letter.getId());
        }
        return LetterResponse.from(letter);
    }

    @Transactional
    public LetterResponse decide(Long letterId, SenderDecision decision) {
        Letter letter = getLetter(letterId);
        letter.decide(decision);
        // 실명 공개·익명 대화를 고르면 대화방이 열린다 (docs/12 §15-2)
        chatService.openForLetter(letter, decision);
        return LetterResponse.from(letter);
    }

    private Letter getLetter(Long letterId) {
        return letterRepository.findById(letterId)
                .orElseThrow(() -> new EntityNotFoundException("마음을 찾을 수 없어요. id=" + letterId));
    }

    private long countTodayAnonymousRecipients() {
        return letterRepository.countTodayAnonymousRecipients(LocalDate.now().atStartOfDay());
    }
}
