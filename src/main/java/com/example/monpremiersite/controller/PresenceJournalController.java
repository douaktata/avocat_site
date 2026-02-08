package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.PresenceJournalDTO;
import com.example.monpremiersite.entities.PresenceJournal;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.mapper.PresenceJournalMapper;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.service.PresenceJournalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/presence-journals")
public class PresenceJournalController {
    private final PresenceJournalService service;
    private final UserRepository userRepository;

    public PresenceJournalController(PresenceJournalService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<PresenceJournalDTO> all() {
        System.out.println("=== GET ALL /presence-journals ===");
        return service.findAll().stream()
                .map(PresenceJournalMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PresenceJournalDTO> get(@PathVariable Long id) {
        System.out.println("=== GET /presence-journals/{id} - ID: " + id);
        Optional<PresenceJournal> presenceJournal = service.findById(id);
        return presenceJournal.map(pj -> ResponseEntity.ok(PresenceJournalMapper.toDTO(pj)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PresenceJournalDTO> create(@RequestBody PresenceJournalDTO dto) {
        System.out.println("\n=== POST /presence-journals ===");
        System.out.println("JSON reçu - recordedById: " + dto.getRecordedById());
        System.out.println("JSON reçu - visitorName: " + dto.getVisitorName());
        System.out.println("JSON reçu - visitorLastname: " + dto.getVisitorLastname());
        
        // 1. On crée l'entité manuellement
        PresenceJournal entity = new PresenceJournal();
        entity.setVisitorName(dto.getVisitorName());
        entity.setVisitorLastname(dto.getVisitorLastname());
        entity.setVisitorCin(dto.getVisitorCin());
        entity.setReason(dto.getReason());
        entity.setArrivalTime(dto.getArrivalTime() != null ? dto.getArrivalTime() : LocalDateTime.now());
        
        // 2. Récupération de l'utilisateur via l'ID fourni dans le DTO
        System.out.println("Recherche de l'utilisateur ID: " + dto.getRecordedById());
        User secretary = userRepository.findById(dto.getRecordedById()).orElse(null);
        
        if (secretary != null) {
            System.out.println("✅ Utilisateur trouvé: " + secretary.getNom() + " " + secretary.getPrenom() + " (ID: " + secretary.getIdu() + ")");
            entity.setRecordedBy(secretary);
        } else {
            System.out.println("❌ Utilisateur ID " + dto.getRecordedById() + " non trouvé!");
            return ResponseEntity.badRequest().build();
        }
        
        // 3. Sauvegarde
        System.out.println("Sauvegarde en cours...");
        PresenceJournal saved = service.save(entity);
        System.out.println("✅ Sauvegardé avec ID: " + saved.getId());
        
        // 4. On crée le DTO de retour MANUELLEMENT (sans mapper complexe)
        System.out.println("Création du DTO de réponse...");
        PresenceJournalDTO response = new PresenceJournalDTO();
        response.setId(saved.getId());
        response.setVisitorName(saved.getVisitorName());
        response.setVisitorLastname(saved.getVisitorLastname());
        response.setVisitorCin(saved.getVisitorCin());
        response.setReason(saved.getReason());
        response.setArrivalTime(saved.getArrivalTime());
        
        // Extraction manuelle des données utilisateur
        if (saved.getRecordedBy() != null) {
            response.setRecordedById(saved.getRecordedBy().getIdu());
            String nom = saved.getRecordedBy().getNom();
            String prenom = saved.getRecordedBy().getPrenom();
            String fullName = ((nom != null ? nom : "") + " " + (prenom != null ? prenom : "")).trim();
            response.setRecordedByName(fullName);
            System.out.println("✅ DTO retour - recordedById: " + response.getRecordedById());
            System.out.println("✅ DTO retour - recordedByName: " + response.getRecordedByName());
        } else {
            System.out.println("⚠️ recordedBy est NULL!");
        }
        
        System.out.println("=== FIN POST ===\n");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresenceJournalDTO> update(@PathVariable Long id, @RequestBody PresenceJournal presenceJournal) {
        System.out.println("=== PUT /presence-journals/{id} - ID: " + id);
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        presenceJournal.setId(id);
        PresenceJournal updated = service.save(presenceJournal);
        return ResponseEntity.ok(PresenceJournalMapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        System.out.println("=== DELETE /presence-journals/{id} - ID: " + id);
        if (!service.findById(id).isPresent()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recorded-by/{recordedById}")
    public List<PresenceJournalDTO> findByRecordedBy(@PathVariable Long recordedById) {
        System.out.println("=== GET /presence-journals/recorded-by/{recordedById} - recordedById: " + recordedById);
        return service.findByRecordedById(recordedById).stream()
                .map(PresenceJournalMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/visitor/{visitorName}")
    public List<PresenceJournalDTO> findByVisitorName(@PathVariable String visitorName) {
        System.out.println("=== GET /presence-journals/visitor/{visitorName} - visitorName: " + visitorName);
        return service.findByVisitorName(visitorName).stream()
                .map(PresenceJournalMapper::toDTO)
                .collect(Collectors.toList());
    }
}
