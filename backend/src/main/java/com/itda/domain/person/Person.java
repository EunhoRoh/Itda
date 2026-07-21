package com.itda.domain.person;

import com.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Person extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 실명 대신 별칭 저장 가능 — 민감정보 최소화 원칙 (docs/02-기술스택.md)
    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RelationType relationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RelationStatus status;

    // 안전 스크리닝 결과 — true면 재연락·화해 유도 기능을 차단하고 보호 안내로 분기 (결정로그 #12)
    @Column(nullable = false)
    private boolean safetyConcern;

    private LocalDate lastContactAt;

    // 연락 주기(일 단위), null이면 리마인더 없음
    private Integer contactCycleDays;

    @Builder
    private Person(String nickname, RelationType relationType, RelationStatus status,
                   boolean safetyConcern, LocalDate lastContactAt, Integer contactCycleDays) {
        this.nickname = nickname;
        this.relationType = relationType;
        this.status = status;
        this.safetyConcern = safetyConcern;
        this.lastContactAt = lastContactAt;
        this.contactCycleDays = contactCycleDays;
    }

    public boolean reconnectAllowed() {
        return !safetyConcern;
    }

    public void changeStatus(RelationStatus status) {
        this.status = status;
    }

    public void recordContact(LocalDate date) {
        this.lastContactAt = date;
    }

    public void changeContactCycle(Integer days) {
        this.contactCycleDays = days;
    }
}
