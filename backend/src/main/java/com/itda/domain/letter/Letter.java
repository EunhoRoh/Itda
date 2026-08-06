package com.itda.domain.letter;

import com.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Letter extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LetterDirection direction;

    // SENT일 때 수신자(내 사람들 중), RECEIVED일 때는 null 가능(발신자가 앱 사용자)
    private Long personId;

    @Column(nullable = false)
    private boolean anonymous;

    // 익명이면 '용감한 사자'류 닉네임, 실명이면 표시 이름
    @Column(nullable = false, length = 30)
    private String senderName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LetterEmotion emotion;

    @Column(nullable = false, length = 500)
    private String body;

    // 준비 문구에서 골랐는지 (익명은 준비 문구만 허용 — 결정로그 #37)
    @Column(nullable = false)
    private boolean preset;

    // AI가 표현을 다듬은 문장인지 — 수신자에게 고지할 의무가 있다 (docs/12 §3:
    // 재작성 사실을 숨기면 나중에 알았을 때 진정성 불신이 생긴다)
    @Column(nullable = false)
    private boolean refined;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LetterStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SenderDecision senderDecision;

    // 발신자 힌트 (docs/12 §15-6) — 익명 마음의 커넥트율을 올리는 단서. 전부 nullable.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private HintContext hintContext;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private HintPeriod hintPeriod;

    // 지금의 나 한 줄 — 실명 전용 자유 텍스트 (익명은 서버가 거부)
    @Column(length = 60)
    private String hintNow;

    @Builder
    private Letter(LetterDirection direction, Long personId, boolean anonymous,
                   String senderName, LetterEmotion emotion, String body, boolean preset,
                   boolean refined, HintContext hintContext, HintPeriod hintPeriod, String hintNow) {
        this.direction = direction;
        this.personId = personId;
        this.anonymous = anonymous;
        this.senderName = senderName;
        this.emotion = emotion;
        this.body = body;
        this.preset = preset;
        this.refined = refined;
        this.hintContext = hintContext;
        this.hintPeriod = hintPeriod;
        this.hintNow = hintNow;
        this.status = LetterStatus.DELIVERED;
        this.senderDecision = SenderDecision.NONE;
    }

    // 수신자가 커넥트를 눌렀을 때만 발신자가 결정할 수 있다 (회원 도입 시 계정별 권한으로 분리)
    public void decide(SenderDecision decision) {
        if (status != LetterStatus.CONNECT_REQUESTED) {
            throw new IllegalStateException("상대가 대화를 원할 때 결정할 수 있어요.");
        }
        if (decision == SenderDecision.NONE) {
            throw new IllegalArgumentException("잘못된 선택이에요.");
        }
        if (senderDecision != SenderDecision.NONE) {
            throw new IllegalStateException("이미 결정했어요.");
        }
        this.senderDecision = decision;
    }

    public void react(LetterStatus reaction) {
        if (direction != LetterDirection.RECEIVED) {
            throw new IllegalStateException("받은 마음에만 반응할 수 있어요.");
        }
        if (reaction == LetterStatus.DELIVERED) {
            throw new IllegalArgumentException("잘못된 반응이에요.");
        }
        if (status == LetterStatus.DECLINED) {
            throw new IllegalStateException("이미 받지 않기로 한 마음이에요.");
        }
        this.status = reaction;
    }
}
