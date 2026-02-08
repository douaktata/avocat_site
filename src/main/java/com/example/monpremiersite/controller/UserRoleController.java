package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.UserRoleDTO;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.entities.UserRole;
import com.example.monpremiersite.entities.UserRoleId;
import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.repository.UserRoleRepository;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.repository.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user-roles")
public class UserRoleController {
    private final UserRoleRepository repo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    public UserRoleController(UserRoleRepository repo, UserRepository userRepo, RoleRepository roleRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }

    @GetMapping
    public List<UserRoleDTO> all() {
        return repo.findAll().stream()
                .map(ur -> new UserRoleDTO(ur.getUser().getIdu(), ur.getRole().getIdr()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{idu}/{idr}")
    public ResponseEntity<UserRoleDTO> get(@PathVariable Long idu, @PathVariable Long idr) {
        UserRoleId id = new UserRoleId(idu, idr);
        return repo.findById(id)
                .map(ur -> new UserRoleDTO(ur.getUser().getIdu(), ur.getRole().getIdr()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserRoleDTO> create(@RequestBody UserRoleDTO dto) {
        // Récupère User et Role depuis la DB
        User user = userRepo.findById(dto.getIdu()).orElse(null);
        Role role = roleRepo.findById(dto.getIdr()).orElse(null);

        if (user == null || role == null) {
            // Si l'un des deux n'existe pas, retourne 400 Bad Request
            return ResponseEntity.badRequest().build();
        }

        // Crée l'objet UserRole
        UserRole ur = new UserRole(); // constructeur qui initialise aussi l'EmbeddedId
        ur.setRole(role);
        ur.setUser(user);
        ur.setId(new UserRoleId(user.getIdu(), role.getIdr())); // important!

        // Sauvegarde dans la DB
        UserRole saved = repo.save(ur);

        // Retourne la confirmation avec les IDs
        return ResponseEntity.ok(new UserRoleDTO(saved.getUser().getIdu(), saved.getRole().getIdr()));
    }

    @DeleteMapping("/{idu}/{idr}")
    public ResponseEntity<Void> delete(@PathVariable Long idu, @PathVariable Long idr) {
        UserRoleId id = new UserRoleId(idu, idr);
        if (!repo.existsById(id))
            return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
