package com.itda.domain.letter.dto;

import com.itda.domain.letter.Letter;
import com.itda.domain.letter.LetterDirection;
import com.itda.domain.letter.LetterEmotion;
import com.itda.domain.letter.LetterStatus;
import java.time.LocalDateTime;

public record LetterResponse(
        Long id,
        LetterDirection direction,
        Long personId,
        boolean anonymous,
        String senderName,
        LetterEmotion emotion,
        String body,
        boolean preset,
        LetterStatus status,
        LocalDateTime createdAt
) {
    public static LetterResponse from(Letter letter) {
        return new LetterResponse(
                letter.getId(),
                letter.getDirection(),
                letter.getPersonId(),
                letter.isAnonymous(),
                letter.getSenderName(),
                letter.getEmotion(),
                letter.getBody(),
                letter.isPreset(),
                letter.getStatus(),
                letter.getCreatedAt()
        );
    }
}
