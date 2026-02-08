package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.TrialDTO;
import com.example.monpremiersite.entities.Trial;
import com.example.monpremiersite.repository.TrialRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/trials")
public class TrialController {
    private final TrialRepository repo;

    public TrialController(TrialRepository repo) { this.repo = repo; }

    @GetMapping
    public List<TrialDTO> all() { 
        return repo.findAll().stream()
                .map(TrialDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrialDTO> get(@PathVariable Long id) { 
        return repo.findById(id)
                .map(trial -> ResponseEntity.ok(TrialDTO.fromEntity(trial)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TrialDTO create(@RequestBody Trial t) { 
        return TrialDTO.fromEntity(repo.save(t));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrialDTO> update(@PathVariable Long id, @RequestBody Trial t) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        t.setIdt(id);
        return ResponseEntity.ok(TrialDTO.fromEntity(repo.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
