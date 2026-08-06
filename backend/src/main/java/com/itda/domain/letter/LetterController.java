package com.itda.domain.letter;

import com.itda.domain.letter.dto.LetterRequest;
import com.itda.domain.letter.dto.LetterResponse;
import com.itda.domain.letter.dto.RefineRequest;
import com.itda.domain.letter.dto.RefineResponse;
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
@RequestMapping("/api/letters")
@RequiredArgsConstructor
public class LetterController {

    private final LetterService letterService;
    private final LetterRefineService letterRefineService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LetterResponse send(@Valid @RequestBody LetterRequest request) {
        return letterService.send(request);
    }

    @GetMapping
    public List<LetterResponse> find(@RequestParam LetterDirection direction) {
        return letterService.findByDirection(direction);
    }

    @PatchMapping("/{letterId}/react")
    public LetterResponse react(@PathVariable Long letterId, @RequestParam LetterStatus reaction) {
        return letterService.react(letterId, reaction);
    }

    @PatchMapping("/{letterId}/decide")
    public LetterResponse decide(@PathVariable Long letterId, @RequestParam SenderDecision decision) {
        return letterService.decide(letterId, decision);
    }

    @PostMapping("/refine")
    public RefineResponse refine(@Valid @RequestBody RefineRequest request) {
        return letterRefineService.refine(request);
    }
}
