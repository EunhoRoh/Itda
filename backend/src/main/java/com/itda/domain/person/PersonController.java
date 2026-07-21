package com.itda.domain.person;

import com.itda.domain.person.dto.PersonRequest;
import com.itda.domain.person.dto.PersonResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/people")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonResponse create(@Valid @RequestBody PersonRequest request) {
        return personService.create(request);
    }

    @GetMapping
    public List<PersonResponse> findAll(@RequestParam(required = false) RelationStatus status) {
        return personService.findAll(status);
    }

    @GetMapping("/{id}")
    public PersonResponse findOne(@PathVariable Long id) {
        return personService.findOne(id);
    }

    @PatchMapping("/{id}/status")
    public PersonResponse changeStatus(@PathVariable Long id, @RequestParam RelationStatus status) {
        return personService.changeStatus(id, status);
    }

    // days 미전달 시 주기 해제
    @PatchMapping("/{id}/contact-cycle")
    public PersonResponse changeContactCycle(
            @PathVariable Long id, @RequestParam(required = false) Integer days) {
        return personService.changeContactCycle(id, days);
    }
}
