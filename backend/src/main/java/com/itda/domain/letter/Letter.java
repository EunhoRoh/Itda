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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LetterStatus status;

    @Builder
    private Letter(LetterDirection direction, Long personId, boolean anonymous,
                   String senderName, LetterEmotion emotion, String body, boolean preset) {
        this.direction = direction;
        this.personId = personId;
        this.anonymous = anonymous;
        this.senderName = senderName;
        this.emotion = emotion;
        this.body = body;
        this.preset = preset;
        this.status = LetterStatus.DELIVERED;
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
