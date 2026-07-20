package com.itda.domain.mission;

import com.itda.domain.mission.dto.MissionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;

    @PostMapping("/people/{personId}/missions")
    @ResponseStatus(HttpStatus.CREATED)
    public MissionResponse startOrResume(@PathVariable Long personId) {
        return missionService.startOrResume(personId);
    }

    @GetMapping("/missions/active")
    public List<MissionResponse> findActive() {
        return missionService.findActive();
    }

    @PatchMapping("/missions/{missionId}/advance")
    public MissionResponse advance(@PathVariable Long missionId) {
        return missionService.advance(missionId);
    }

    @PatchMapping("/missions/{missionId}/result")
    public MissionResponse recordResult(@PathVariable Long missionId, @RequestParam MissionResult result) {
        return missionService.recordResult(missionId, result);
    }
}
