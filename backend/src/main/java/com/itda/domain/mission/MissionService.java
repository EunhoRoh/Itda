package com.itda.domain.mission;

import com.itda.domain.mission.dto.MissionResponse;
import com.itda.domain.person.Person;
import com.itda.domain.person.PersonService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionService {

    private final MissionRepository missionRepository;
    private final PersonService personService;

    /** 진행 중 미션이 있으면 그대로 반환 (멱등) — 없으면 새로 시작 */
    @Transactional
    public MissionResponse startOrResume(Long personId) {
        Person person = personService.getPerson(personId);
        if (!person.reconnectAllowed()) {
            // 안전 스크리닝 통과 못한 관계는 재연락 유도 금지 (결정로그 #12)
            throw new IllegalStateException("안전을 위해 이 관계에는 재연락 미션을 열지 않아요.");
        }
        return missionRepository.findFirstByPersonIdAndStepNot(personId, MissionStep.DONE)
                .map(MissionResponse::from)
                .orElseGet(() -> MissionResponse.from(
                        missionRepository.save(Mission.builder().person(person).build())));
    }

    public List<MissionResponse> findActive() {
        return missionRepository.findAllByStepNotOrderByUpdatedAtDesc(MissionStep.DONE).stream()
                .map(MissionResponse::from)
                .toList();
    }

    @Transactional
    public MissionResponse advance(Long missionId) {
        Mission mission = getMission(missionId);
        mission.advance();
        return MissionResponse.from(mission);
    }

    @Transactional
    public MissionResponse recordResult(Long missionId, MissionResult result) {
        Mission mission = getMission(missionId);
        mission.recordResult(result);
        return MissionResponse.from(mission);
    }

    private Mission getMission(Long id) {
        return missionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("진행 중인 미션이 없어요. id=" + id));
    }
}
