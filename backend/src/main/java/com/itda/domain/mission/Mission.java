package com.itda.domain.mission;

import com.itda.domain.person.Person;
import com.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Mission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionStep step;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MissionResult result;

    @Builder
    private Mission(Person person) {
        this.person = person;
        this.step = MissionStep.WARMUP;
    }

    public void advance() {
        this.step = step.next();
    }

    public void recordResult(MissionResult result) {
        if (step != MissionStep.SENT) {
            throw new IllegalStateException("메시지를 보낸 뒤에 결과를 기록할 수 있어요.");
        }
        this.result = result;
        switch (result) {
            case REPLIED -> {
                this.step = MissionStep.DONE;
                person.recordContact(LocalDate.now());
            }
            case NOT_SENT -> this.step = MissionStep.DONE;
            case NO_REPLY -> { /* 열린 채 유지 — 나중에 REPLIED로 갱신 가능 */ }
        }
    }
}
