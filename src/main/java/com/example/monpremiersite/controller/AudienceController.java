package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.AudienceDTO;
import com.example.monpremiersite.entities.Audience;
import com.example.monpremiersite.repository.AudienceRepository;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.TribunalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/audiences")
public class AudienceController {

    private final AudienceRepository repo;
    private final CaseRepository caseRepo;
    private final TribunalRepository tribunalRepo;

    public AudienceController(AudienceRepository repo, CaseRepository caseRepo, TribunalRepository tribunalRepo) {
        this.repo = repo;
        this.caseRepo = caseRepo;
        this.tribunalRepo = tribunalRepo;
    }

    @GetMapping
    public List<AudienceDTO> getAll() {
        return repo.findAll().stream().map(AudienceDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/case/{caseId}")
    public List<AudienceDTO> byCase(@PathVariable Long caseId) {
        return repo.findByCaseEntity_IdcOrderByHearingDateAsc(caseId)
                .stream().map(AudienceDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AudienceDTO> get(@PathVariable Long id) {
        return repo.findById(id).map(a -> ResponseEntity.ok(AudienceDTO.fromEntity(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        if (body.get("caseId") == null)
            return ResponseEntity.badRequest().body(Map.of("error", "CASE_REQUIRED", "message", "caseId est obligatoire"));

        Long caseId = ((Number) body.get("caseId")).longValue();
        var caseOpt = caseRepo.findById(caseId);
        if (caseOpt.isEmpty()) return ResponseEntity.notFound().build();

        var caseEntity = caseOpt.get();

        // AUTOMATION 1: tribunal obligatoire sur le dossier
        if (caseEntity.getTribunal() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "TRIBUNAL_REQUIRED",
                "message", "Vous devez d'abord remplir le Tribunal dans l'onglet Tribunal avant de créer une audience."
            ));
        }

        Audience a = new Audience();
        a.setCaseEntity(caseEntity);
        // AUTOMATION 2: tribunal auto-rempli depuis le dossier (ignore tribunalId du body)
        a.setTribunal(caseEntity.getTribunal());
        if (body.get("hearingDate") != null)
            a.setHearingDate(LocalDateTime.parse((String) body.get("hearingDate")));
        if (body.get("hearingType") != null) a.setHearingType((String) body.get("hearingType"));
        if (body.get("roomNumber") != null) a.setRoomNumber((String) body.get("roomNumber"));
        if (body.get("judgeName") != null) a.setJudgeName((String) body.get("judgeName"));
        if (body.get("description") != null) a.setDescription((String) body.get("description"));
        if (body.get("notes") != null) a.setNotes((String) body.get("notes"));
        a.setStatus("SCHEDULED");
        return ResponseEntity.ok(AudienceDTO.fromEntity(repo.save(a)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AudienceDTO> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repo.findById(id).map(a -> {
            String status = (String) body.get("status");
            if (status != null) a.setStatus(status);
            if ("POSTPONED".equals(status)) {
                if (body.get("postponeReason") != null)
                    a.setPostponeReason((String) body.get("postponeReason"));
                a.setPostponedDate(java.time.LocalDateTime.now());
                if (body.get("newHearingDate") != null) {
                    try {
                        String nd = (String) body.get("newHearingDate");
                        if (nd.length() == 16) nd = nd + ":00";
                        a.setHearingDate(java.time.LocalDateTime.parse(nd));
                    } catch (Exception ignored) {}
                }
            }
            if ("CANCELLED".equals(status)) {
                if (body.get("cancellationReason") != null)
                    a.setCancellationReason((String) body.get("cancellationReason"));
                a.setCancelledDate(java.time.LocalDateTime.now());
            }
            return ResponseEntity.ok(AudienceDTO.fromEntity(repo.save(a)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}