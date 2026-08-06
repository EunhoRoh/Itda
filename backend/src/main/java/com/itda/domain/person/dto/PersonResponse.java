package com.itda.domain.person.dto;

import com.itda.domain.person.Person;
import com.itda.domain.person.RelationStatus;
import com.itda.domain.person.RelationType;
import java.time.LocalDate;

public record PersonResponse(
        Long id,
        String nickname,
        RelationType relationType,
        RelationStatus status,
        boolean reconnectAllowed,
        LocalDate lastContactAt,
        Integer contactCycleDays,
        LocalDate reconnectedAt
) {
    public static PersonResponse from(Person person) {
        return new PersonResponse(
                person.getId(),
                person.getNickname(),
                person.getRelationType(),
                person.getStatus(),
                person.reconnectAllowed(),
                person.getLastContactAt(),
                person.getContactCycleDays(),
                person.getReconnectedAt()
        );
    }
}
