package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.CaseDTO;
import com.example.monpremiersite.entities.CaseEntity;
import com.example.monpremiersite.repository.CaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cases")
public class CaseController {
    private final CaseRepository repo;

    public CaseController(CaseRepository repo) { this.repo = repo; }

    @GetMapping
    public List<CaseDTO> all() { return repo.findAll().stream().map(CaseDTO::fromEntity).collect(Collectors.toList()); }

    @GetMapping("/{id}")
    public ResponseEntity<CaseDTO> get(@PathVariable Long id) { return repo.findById(id).map(entity -> ResponseEntity.ok(CaseDTO.fromEntity(entity))).orElse(ResponseEntity.notFound().build()); }

    @PostMapping
    public CaseDTO create(@RequestBody CaseEntity c) { return CaseDTO.fromEntity(repo.save(c)); }

    @PutMapping("/{id}")
    public ResponseEntity<CaseDTO> update(@PathVariable Long id, @RequestBody CaseEntity c) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        c.setIdc(id);
        return ResponseEntity.ok(CaseDTO.fromEntity(repo.save(c)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
