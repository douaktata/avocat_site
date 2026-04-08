package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.TribunalDTO;
import com.example.monpremiersite.entities.Tribunal;
import com.example.monpremiersite.repository.TribunalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tribunals")
public class TribunalController {

    @Autowired
    private TribunalRepository tribunalRepository;

    @GetMapping
    public List<TribunalDTO> getAll() {
        return tribunalRepository.findByIsActiveTrue()
                .stream()
                .map(TribunalDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TribunalDTO> getById(@PathVariable Long id) {
        return tribunalRepository.findById(id)
                .map(t -> ResponseEntity.ok(TribunalDTO.fromEntity(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TribunalDTO create(@RequestBody Map<String, Object> body) {
        Tribunal tribunal = new Tribunal();
        if (body.get("name") != null) tribunal.setName((String) body.get("name"));
        if (body.get("ville") != null) tribunal.setVille((String) body.get("ville"));
        if (body.get("adresse") != null) tribunal.setAdresse((String) body.get("adresse"));
        if (body.get("telephone") != null) tribunal.setTelephone((String) body.get("telephone"));
        if (body.get("email") != null) tribunal.setEmail((String) body.get("email"));
        tribunal.setIsActive(true);
        Tribunal saved = tribunalRepository.save(tribunal);
        return TribunalDTO.fromEntity(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TribunalDTO> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return tribunalRepository.findById(id).map(tribunal -> {
            if (body.get("name") != null) tribunal.setName((String) body.get("name"));
            if (body.get("ville") != null) tribunal.setVille((String) body.get("ville"));
            if (body.get("adresse") != null) tribunal.setAdresse((String) body.get("adresse"));
            if (body.get("telephone") != null) tribunal.setTelephone((String) body.get("telephone"));
            if (body.get("email") != null) tribunal.setEmail((String) body.get("email"));
            if (body.get("isActive") != null) tribunal.setIsActive((Boolean) body.get("isActive"));
            Tribunal saved = tribunalRepository.save(tribunal);
            return ResponseEntity.ok(TribunalDTO.fromEntity(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return tribunalRepository.findById(id).map(tribunal -> {
            tribunal.setIsActive(false);
            tribunalRepository.save(tribunal);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
