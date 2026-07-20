package com.itda.domain.memory;

import com.itda.domain.memory.dto.MemoryRequest;
import com.itda.domain.memory.dto.MemoryResponse;
import com.itda.domain.person.Person;
import com.itda.domain.person.PersonService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final PersonService personService;

    @Transactional
    public MemoryResponse create(Long personId, MemoryRequest request) {
        Person person = personService.getPerson(personId);
        Memory memory = Memory.builder()
                .person(person)
                .category(request.category())
                .emotion(request.emotion())
                .year(request.year())
                .note(request.note())
                .photoUrl(request.photoUrl())
                .build();
        return MemoryResponse.from(memoryRepository.save(memory));
    }

    public List<MemoryResponse> findAllByPerson(Long personId) {
        personService.getPerson(personId);
        return memoryRepository.findAllByPersonIdOrderByYearDesc(personId).stream()
                .map(MemoryResponse::from)
                .toList();
    }
}
