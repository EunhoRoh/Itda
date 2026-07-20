package com.itda.domain.memory;

import com.itda.domain.person.Person;
import com.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "memories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Memory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemoryCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EmotionTag emotion;

    // 정확한 날짜를 강요하지 않는다 — 연도만 (docs/04-MVP-기능정의.md §2)
    @Column(name = "memory_year")
    private Integer year;

    @Column(length = 200)
    private String note;

    private String photoUrl;

    @Builder
    private Memory(Person person, MemoryCategory category, EmotionTag emotion,
                   Integer year, String note, String photoUrl) {
        this.person = person;
        this.category = category;
        this.emotion = emotion;
        this.year = year;
        this.note = note;
        this.photoUrl = photoUrl;
    }
}
