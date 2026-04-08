package com.example.monpremiersite.controller;

import com.example.monpremiersite.entities.Slot;
import com.example.monpremiersite.repository.SlotRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/slots")
public class SlotController {

    private final SlotRepository repo;

    public SlotController(SlotRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Slot> all() { return repo.findAll(); }

    @PostMapping
    public Slot create(@RequestBody Slot s) { return repo.save(s); }

    @PutMapping("/{id}")
    public ResponseEntity<Slot> update(@PathVariable Long id, @RequestBody Slot s) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        s.setId(id);
        return ResponseEntity.ok(repo.save(s));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
