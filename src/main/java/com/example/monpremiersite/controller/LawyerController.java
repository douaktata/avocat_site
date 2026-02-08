package com.example.monpremiersite.controller;

import com.example.monpremiersite.entities.Lawyer;
import com.example.monpremiersite.repository.LawyerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lawyers")
public class LawyerController {
    private final LawyerRepository repo;

    public LawyerController(LawyerRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Lawyer> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Lawyer> get(@PathVariable Long id) { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }

    @PostMapping
    public Lawyer create(@RequestBody Lawyer l) { return repo.save(l); }

    @PutMapping("/{id}")
    public ResponseEntity<Lawyer> update(@PathVariable Long id, @RequestBody Lawyer l) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        l.setIdl(id);
        return ResponseEntity.ok(repo.save(l));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
