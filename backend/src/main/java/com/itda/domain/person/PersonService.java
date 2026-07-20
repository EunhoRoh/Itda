package com.itda.domain.person;

import com.itda.domain.person.dto.PersonRequest;
import com.itda.domain.person.dto.PersonResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonService {

    private final PersonRepository personRepository;

    @Transactional
    public PersonResponse create(PersonRequest request) {
        Person person = Person.builder()
                .nickname(request.nickname())
                .relationType(request.relationType())
                .status(request.status())
                .safetyConcern(request.safetyConcern())
                .lastContactAt(request.lastContactAt())
                .contactCycleDays(request.contactCycleDays())
                .build();
        return PersonResponse.from(personRepository.save(person));
    }

    public List<PersonResponse> findAll(RelationStatus status) {
        List<Person> people = (status == null)
                ? personRepository.findAll()
                : personRepository.findAllByStatus(status);
        return people.stream().map(PersonResponse::from).toList();
    }

    public PersonResponse findOne(Long id) {
        return PersonResponse.from(getPerson(id));
    }

    @Transactional
    public PersonResponse changeStatus(Long id, RelationStatus status) {
        Person person = getPerson(id);
        person.changeStatus(status);
        return PersonResponse.from(person);
    }

    public Person getPerson(Long id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("등록되지 않은 사람입니다. id=" + id));
    }
}
