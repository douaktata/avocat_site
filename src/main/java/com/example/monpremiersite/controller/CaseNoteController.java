package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.CaseNoteDTO;
import com.example.monpremiersite.entities.CaseNote;
import com.example.monpremiersite.repository.CaseNoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/case-notes")
public class CaseNoteController {
    private final CaseNoteRepository repo;

    public CaseNoteController(CaseNoteRepository repo) { this.repo = repo; }

    @GetMapping
    public List<CaseNoteDTO> all() { 
        return repo.findAll().stream()
                .map(CaseNoteDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseNoteDTO> get(@PathVariable Long id) { 
        return repo.findById(id)
                .map(note -> ResponseEntity.ok(CaseNoteDTO.fromEntity(note)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CaseNoteDTO create(@RequestBody CaseNote n) { 
        return CaseNoteDTO.fromEntity(repo.save(n));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaseNoteDTO> update(@PathVariable Long id, @RequestBody CaseNote n) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        n.setIdn(id);
        return ResponseEntity.ok(CaseNoteDTO.fromEntity(repo.save(n)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
