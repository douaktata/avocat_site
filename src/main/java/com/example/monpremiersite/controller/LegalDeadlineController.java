package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.LegalDeadlineCreateDTO;
import com.example.monpremiersite.dto.LegalDeadlineDTO;
import com.example.monpremiersite.service.LegalDeadlineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deadlines")
public class LegalDeadlineController {

    private final LegalDeadlineService service;

    public LegalDeadlineController(LegalDeadlineService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<LegalDeadlineDTO>> getAll(
            @RequestParam(required = false) Long caseId,
            @RequestParam(required = false) String statut) {
        return ResponseEntity.ok(service.getAll(caseId, statut));
    }

    @PostMapping
    public ResponseEntity<LegalDeadlineDTO> create(@RequestBody LegalDeadlineCreateDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LegalDeadlineDTO> update(@PathVariable Long id,
                                                    @RequestBody LegalDeadlineCreateDTO dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/respected")
    public ResponseEntity<LegalDeadlineDTO> markRespected(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.markRespected(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/urgent")
    public ResponseEntity<List<LegalDeadlineDTO>> getUrgent() {
        return ResponseEntity.ok(service.getUrgent());
    }
}
