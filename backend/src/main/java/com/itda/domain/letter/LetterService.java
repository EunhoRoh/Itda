package com.itda.domain.letter;

import com.itda.domain.letter.dto.LetterRequest;
import com.itda.domain.letter.dto.LetterResponse;
import com.itda.domain.person.Person;
import com.itda.domain.person.PersonService;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LetterService {

    // 하루 익명 발신 한도 (docs/12 §5)
    static final int DAILY_ANONYMOUS_LIMIT = 3;

    private final LetterRepository letterRepository;
    private final PersonService personService;

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
        if (request.anonymous() && countTodayAnonymous() >= DAILY_ANONYMOUS_LIMIT) {
            throw new IllegalStateException("익명 마음은 하루 3명까지만 보낼 수 있어요. 내일 다시 보내요.");
        }

        Letter letter = letterRepository.save(Letter.builder()
                .direction(LetterDirection.SENT)
                .personId(person.getId())
                .anonymous(request.anonymous())
                .senderName(request.senderName())
                .emotion(request.emotion())
                .body(request.body())
                .preset(request.preset())
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
        Letter letter = letterRepository.findById(letterId)
                .orElseThrow(() -> new EntityNotFoundException("마음을 찾을 수 없어요. id=" + letterId));
        letter.react(reaction);
        return LetterResponse.from(letter);
    }

    private long countTodayAnonymous() {
        return letterRepository.findAllByDirectionOrderByIdDesc(LetterDirection.SENT).stream()
                .filter(Letter::isAnonymous)
                .filter(l -> l.getCreatedAt() != null
                        && l.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .count();
    }
}
