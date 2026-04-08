package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.RegisterRequestDTO;
import com.example.monpremiersite.dto.UserFullDTO;
import com.example.monpremiersite.entities.Role;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.RoleRepository;
import com.example.monpremiersite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository repo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository repo, RoleRepository roleRepo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserFullDTO> all() {
        return repo.findAll().stream().map(UserFullDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserFullDTO> get(@PathVariable Long id) {
        return repo.findById(id).map(u -> ResponseEntity.ok(UserFullDTO.fromEntity(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-role/{roleName}")
    public List<UserFullDTO> byRole(@PathVariable String roleName) {
        return repo.findByRoles_Role_name(roleName.toUpperCase()).stream()
                .map(UserFullDTO::fromEntity).collect(Collectors.toList());
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@RequestBody RegisterRequestDTO req) {
        if (repo.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(400).body(Map.of("message", "Email already in use"));
        }
        String roleName = (req.getRole() != null) ? req.getRole().toUpperCase() : "SECRETAIRE";
        if (!roleName.equals("SECRETAIRE") && !roleName.equals("STAGIAIRE") && !roleName.equals("AVOCAT")) {
            return ResponseEntity.status(400).body(Map.of("message", "Role must be SECRETAIRE, STAGIAIRE or AVOCAT"));
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
        User saved = repo.save(user);
        return ResponseEntity.status(201).body(Map.of("idu", saved.getIdu(), "email", saved.getEmail()));
    }

    @PostMapping
    public UserFullDTO create(@RequestBody User u) { return UserFullDTO.fromEntity(repo.save(u)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserFullDTO> update(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        return repo.findById(id).map(existing -> {
            if (updates.get("nom") != null) existing.setNom(updates.get("nom"));
            if (updates.get("prenom") != null) existing.setPrenom(updates.get("prenom"));
            if (updates.get("email") != null) existing.setEmail(updates.get("email"));
            if (updates.get("tel") != null) existing.setTel(updates.get("tel"));
            if (updates.get("adresse") != null) existing.setAdresse(updates.get("adresse"));
            if (updates.get("CIN") != null) existing.setCIN(updates.get("CIN"));
            if (updates.get("statut") != null) existing.setStatut(updates.get("statut"));
            if (updates.get("date_naissance") != null && !updates.get("date_naissance").isBlank()) {
                try { existing.setDate_naissance(java.time.LocalDate.parse(updates.get("date_naissance"))); } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(UserFullDTO.fromEntity(repo.save(existing)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@PathVariable Long id,
                                                               @RequestBody Map<String, String> body) {
        String current = body.get("currentPassword");
        String newPwd  = body.get("newPassword");
        return repo.findById(id).map(user -> {
            Map<String, String> err = new HashMap<>();
            if (!passwordEncoder.matches(current, user.getPassword())) {
                err.put("message", "Mot de passe actuel incorrect.");
                return ResponseEntity.status(400).<Map<String, String>>body(err);
            }
            user.setPassword(passwordEncoder.encode(newPwd));
            repo.save(user);
            Map<String, String> ok = new HashMap<>();
            ok.put("message", "Mot de passe modifié avec succès.");
            return ResponseEntity.ok(ok);
        }).orElse(ResponseEntity.notFound().<Map<String, String>>build());
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file) {
        return repo.findById(id).map(user -> {
            try {
                String ext = "";
                String orig = file.getOriginalFilename();
                if (orig != null && orig.contains(".")) ext = orig.substring(orig.lastIndexOf('.'));
                String filename = "user_" + id + ext;
                Path uploadDir = Paths.get("uploads/photos");
                Files.createDirectories(uploadDir);
                Files.copy(file.getInputStream(), uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                String url = "/uploads/photos/" + filename;
                user.setPhoto_url(url);
                repo.save(user);
                Map<String, String> ok = new HashMap<>();
                ok.put("photo_url", url);
                return ResponseEntity.ok(ok);
            } catch (IOException e) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Erreur lors de l'upload.");
                return ResponseEntity.status(500).<Map<String, String>>body(err);
            }
        }).orElse(ResponseEntity.notFound().<Map<String, String>>build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
