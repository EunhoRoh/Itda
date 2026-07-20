package com.itda.global.config;

import com.itda.domain.memory.EmotionTag;
import com.itda.domain.memory.Memory;
import com.itda.domain.memory.MemoryCategory;
import com.itda.domain.memory.MemoryRepository;
import com.itda.domain.person.Person;
import com.itda.domain.person.PersonRepository;
import com.itda.domain.person.RelationStatus;
import com.itda.domain.person.RelationType;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 개발용 샘플 관계 데이터 — 홈 화면 추천이 비어 보이지 않게.
 * TODO: 회원 도메인 도입 시 제거
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    private final PersonRepository personRepository;
    private final MemoryRepository memoryRepository;

    @Override
    public void run(String... args) {
        if (personRepository.count() > 0) {
            return;
        }

        Person jihoon = personRepository.save(Person.builder()
                .nickname("지훈")
                .relationType(RelationType.FRIEND)
                .status(RelationStatus.DRIFTED)
                .lastContactAt(LocalDate.of(2023, 5, 2))
                .build());
        memoryRepository.save(Memory.builder()
                .person(jihoon)
                .category(MemoryCategory.TRAVEL)
                .emotion(EmotionTag.LONGING)
                .year(2016)
                .note("밤바다에서 라면 먹던 날")
                .build());

        Person mother = personRepository.save(Person.builder()
                .nickname("어머니")
                .relationType(RelationType.FAMILY)
                .status(RelationStatus.DRIFTED)
                .lastContactAt(LocalDate.of(2026, 2, 17))
                .contactCycleDays(14)
                .build());
        memoryRepository.save(Memory.builder()
                .person(mother)
                .category(MemoryCategory.FOOD)
                .emotion(EmotionTag.GRATITUDE)
                .year(2024)
                .note("김장하고 수육 먹던 날")
                .build());

        personRepository.save(Person.builder()
                .nickname("수진")
                .relationType(RelationType.FRIEND)
                .status(RelationStatus.CONNECTED)
                .lastContactAt(LocalDate.of(2026, 7, 12))
                .contactCycleDays(30)
                .build());
    }
}
