package com.itda.domain.memory;

import com.itda.domain.memory.dto.MemoryRequest;
import com.itda.domain.memory.dto.MemoryResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/people/{personId}/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemoryResponse create(@PathVariable Long personId, @Valid @RequestBody MemoryRequest request) {
        return memoryService.create(personId, request);
    }

    @GetMapping
    public List<MemoryResponse> findAll(@PathVariable Long personId) {
        return memoryService.findAllByPerson(personId);
    }
}
