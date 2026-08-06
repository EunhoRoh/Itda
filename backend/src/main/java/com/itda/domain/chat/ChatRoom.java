package com.itda.domain.chat;

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

/**
 * 커넥트 후 대화방 (docs/12 §15-2).
 * 발신자가 실명 공개(REVEAL) 또는 익명 대화(ANON_CHAT)를 고르면 열린다.
 * 마음만 전하기(KEEP_HEART)는 방이 생기지 않는다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long letterId;

    // ANON_CHAT이면 true — 발신자는 익명 닉네임으로만 표시된다
    @Column(nullable = false)
    private boolean anonymous;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChatRoomStatus status;

    @Builder
    private ChatRoom(Long letterId, boolean anonymous) {
        this.letterId = letterId;
        this.anonymous = anonymous;
        this.status = ChatRoomStatus.OPEN;
    }

    public void close() {
        if (status == ChatRoomStatus.CLOSED) {
            throw new IllegalStateException("이미 마친 대화예요.");
        }
        this.status = ChatRoomStatus.CLOSED;
    }

    public boolean isOpen() {
        return status == ChatRoomStatus.OPEN;
    }
}
