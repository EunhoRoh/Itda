package com.itda.domain.mission;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    Optional<Mission> findFirstByPersonIdAndStepNot(Long personId, MissionStep step);

    List<Mission> findAllByStepNotOrderByUpdatedAtDesc(MissionStep step);
}
