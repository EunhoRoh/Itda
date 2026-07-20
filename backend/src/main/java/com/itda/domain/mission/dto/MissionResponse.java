package com.itda.domain.mission.dto;

import com.itda.domain.mission.Mission;
import com.itda.domain.mission.MissionResult;
import com.itda.domain.mission.MissionStep;

public record MissionResponse(
        Long id,
        Long personId,
        String personNickname,
        MissionStep step,
        MissionResult result
) {
    public static MissionResponse from(Mission mission) {
        return new MissionResponse(
                mission.getId(),
                mission.getPerson().getId(),
                mission.getPerson().getNickname(),
                mission.getStep(),
                mission.getResult()
        );
    }
}
