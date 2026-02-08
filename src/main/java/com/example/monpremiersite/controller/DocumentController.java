package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.DocumentDTO;
import com.example.monpremiersite.entities.DocumentEntity;
import com.example.monpremiersite.repository.DocumentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentRepository repo;

    public DocumentController(DocumentRepository repo) { this.repo = repo; }

    @GetMapping
    public List<DocumentDTO> all() { 
        return repo.findAll().stream()
                .map(DocumentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> get(@PathVariable Long id) { 
        return repo.findById(id)
                .map(doc -> ResponseEntity.ok(DocumentDTO.fromEntity(doc)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public DocumentDTO create(@RequestBody DocumentEntity d) { 
        return DocumentDTO.fromEntity(repo.save(d));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> update(@PathVariable Long id, @RequestBody DocumentEntity d) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        d.setIdd(id);
        return ResponseEntity.ok(DocumentDTO.fromEntity(repo.save(d)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
