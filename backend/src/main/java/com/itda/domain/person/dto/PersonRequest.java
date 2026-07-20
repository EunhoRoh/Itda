package com.itda.domain.person.dto;

import com.itda.domain.person.RelationStatus;
import com.itda.domain.person.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PersonRequest(
        @NotBlank @Size(max = 50) String nickname,
        @NotNull RelationType relationType,
        @NotNull RelationStatus status,
        boolean safetyConcern,
        LocalDate lastContactAt,
        Integer contactCycleDays
) {
}
