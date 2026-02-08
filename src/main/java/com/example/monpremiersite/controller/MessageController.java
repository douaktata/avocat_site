package com.example.monpremiersite.controller;

import com.example.monpremiersite.entities.Message;
import com.example.monpremiersite.repository.MessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {
    private final MessageRepository repo;

    public MessageController(MessageRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Message> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Message> get(@PathVariable Long id) { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }

    @PostMapping
    public Message create(@RequestBody Message m) { return repo.save(m); }

    @PutMapping("/{id}")
    public ResponseEntity<Message> update(@PathVariable Long id, @RequestBody Message m) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        m.setIdm(id);
        return ResponseEntity.ok(repo.save(m));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
