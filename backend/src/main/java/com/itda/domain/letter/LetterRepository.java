package com.itda.domain.letter;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LetterRepository extends JpaRepository<Letter, Long> {

    List<Letter> findAllByDirectionOrderByIdDesc(LetterDirection direction);

    /** 오늘 익명으로 마음을 받은 서로 다른 사람 수 — 한도는 '3통'이 아니라 '3명' (docs/12 §5) */
    @Query("""
            select count(distinct l.personId) from Letter l
            where l.direction = com.itda.domain.letter.LetterDirection.SENT
              and l.anonymous = true
              and l.createdAt >= :since
            """)
    long countTodayAnonymousRecipients(LocalDateTime since);

    /** 같은 수신자에게 최근 보낸 마음 — 동일 수신자 쿨다운 판정 (결정 #34·#38) */
    boolean existsByDirectionAndPersonIdAndCreatedAtAfter(
            LetterDirection direction, Long personId, LocalDateTime after);

    /** 이 수신자가 이미 거절했는지 — 거부 후 재전송은 영구 금지 (결정 #38, 대법원 2022도12037) */
    boolean existsByDirectionAndPersonIdAndStatus(
            LetterDirection direction, Long personId, LetterStatus status);
}
