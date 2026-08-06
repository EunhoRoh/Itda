package com.itda.domain.letter;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LetterRepository extends JpaRepository<Letter, Long> {

    List<Letter> findAllByDirectionOrderByIdDesc(LetterDirection direction);
}
