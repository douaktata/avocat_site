package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.RoleDTO;
import com.example.monpremiersite.dto.UserDTO;
import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.repository.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/roles")
public class RoleController {
    private final RoleRepository repo;

    public RoleController(RoleRepository repo) { this.repo = repo; }

    @GetMapping
    public List<RoleDTO> all() {
        return repo.findAll().stream()
                .map(role -> {
                    var users = role.getUsers().stream()
                            .map(user -> new UserDTO(user.getNom(), user.getPrenom()))
                            .collect(Collectors.toSet());
                    return new RoleDTO(role.getIdr(), role.getRole_name(), users);
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(role -> {
                    var users = role.getUsers().stream()
                            .map(user -> new UserDTO(user.getNom(), user.getPrenom()))
                            .collect(Collectors.toSet());
                    return new RoleDTO(role.getIdr(), role.getRole_name(), users);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Role create(@RequestBody Role r) { return repo.save(r); }

    @PutMapping("/{id}")
    public ResponseEntity<Role> update(@PathVariable Long id, @RequestBody Role r) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        r.setIdr(id);
        return ResponseEntity.ok(repo.save(r));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
