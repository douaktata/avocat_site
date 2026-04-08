package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.RegisterRequestDTO;
import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.RoleRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/staff")
public class StaffController {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;

    public StaffController(UserRepository userRepo, RoleRepository roleRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody RegisterRequestDTO req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(400).body(Map.of("message", "Email already in use"));
        }
        String roleName = (req.getRole() != null) ? req.getRole().toUpperCase() : "SECRETAIRE";
        if (!roleName.equals("SECRETAIRE") && !roleName.equals("STAGIAIRE")) {
            return ResponseEntity.status(400).body(Map.of("message", "Role must be SECRETAIRE or STAGIAIRE"));
        }
        Role role = roleRepo.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        User user = new User();
        user.setNom(req.getNom());
        user.setPrenom(req.getPrenom());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setTel(req.getTel());
        user.setAdresse(req.getAdresse());
        user.setCIN(req.getCIN());
        user.setDate_naissance(req.getDate_naissance());
        user.setCreated_at(LocalDateTime.now());
        user.setRoles(new HashSet<>(Set.of(role)));
        User saved = userRepo.save(user);
        return ResponseEntity.status(201).body(Map.of("idu", saved.getIdu(), "email", saved.getEmail()));
    }
}
