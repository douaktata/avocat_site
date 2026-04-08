package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.CaseDTO;
import com.example.monpremiersite.entities.CaseEntity;
import com.example.monpremiersite.entities.CasePhase;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.TribunalRepository;
import com.example.monpremiersite.service.TrustAccountService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cases")
public class CaseController {
    private final CaseRepository repo;
    private final TribunalRepository tribunalRepo;
    private final TrustAccountService trustService;

    @PersistenceContext
    private EntityManager em;

    public CaseController(CaseRepository repo, TribunalRepository tribunalRepo,
                          TrustAccountService trustService) {
        this.repo = repo;
        this.tribunalRepo = tribunalRepo;
        this.trustService = trustService;
    }

    @GetMapping
    public List<CaseDTO> all() {
        return repo.findAll().stream().map(CaseDTO::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseDTO> get(@PathVariable Long id) {
        return repo.findById(id).map(entity -> ResponseEntity.ok(CaseDTO.fromEntity(entity)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/client/{clientId}")
    public List<CaseDTO> byClient(@PathVariable Long clientId) {
        return repo.findByUser_Idu(clientId).stream().map(CaseDTO::fromEntity).collect(Collectors.toList());
    }

    @PostMapping
    public CaseDTO create(@RequestBody CaseEntity c) { return CaseDTO.fromEntity(repo.save(c)); }

    @PutMapping("/{id}")
    public ResponseEntity<CaseDTO> update(@PathVariable Long id, @RequestBody CaseEntity c) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        c.setIdc(id);
        return ResponseEntity.ok(CaseDTO.fromEntity(repo.save(c)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CaseDTO> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return repo.findById(id).map(c -> {
            String newStatus = body.get("status");
            c.setStatus(newStatus);
            CaseDTO saved = CaseDTO.fromEntity(repo.save(c));
            if ("CLOSED".equalsIgnoreCase(newStatus)) {
                trustService.closeActiveTrustAccount(id);
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<CaseDTO> updatePriority(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return repo.findById(id).map(c -> {
            c.setPriority(body.get("priority"));
            return ResponseEntity.ok(CaseDTO.fromEntity(repo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/tribunal-info")
    public ResponseEntity<CaseDTO> updateTribunalInfo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repo.findById(id).map(c -> {
            if (body.get("tribunalId") != null)
                tribunalRepo.findById(((Number) body.get("tribunalId")).longValue()).ifPresent(c::setTribunal);
            if (body.containsKey("courtCaseNumber")) c.setCourtCaseNumber((String) body.get("courtCaseNumber"));
            if (body.containsKey("judgeAssigned")) c.setJudgeAssigned((String) body.get("judgeAssigned"));
            if (body.containsKey("notesJudicial")) c.setNotesJudicial((String) body.get("notesJudicial"));
            if (body.get("casePhase") != null) {
                try { c.setCasePhase(CasePhase.valueOf((String) body.get("casePhase"))); } catch (Exception ignored) {}
            }
            if (body.get("dateFiledAtTribunal") != null) {
                try { c.setDateFiledAtTribunal(LocalDate.parse((String) body.get("dateFiledAtTribunal"))); } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(CaseDTO.fromEntity(repo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();

        // 1. payment_allocations (ref invoices + trust_accounts)
        em.createNativeQuery("DELETE FROM payment_allocations WHERE invoice_id IN (SELECT id FROM invoices WHERE case_id = :id)").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM payment_allocations WHERE trust_account_id IN (SELECT id FROM trust_accounts WHERE case_id = :id)").setParameter("id", id).executeUpdate();

        // 2. invoice children
        em.createNativeQuery("DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE case_id = :id)").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM late_fee_records WHERE invoice_id IN (SELECT id FROM invoices WHERE case_id = :id)").setParameter("id", id).executeUpdate();

        // 3. invoices
        em.createNativeQuery("DELETE FROM invoices WHERE case_id = :id").setParameter("id", id).executeUpdate();

        // 4. billing, provisions
        em.createNativeQuery("DELETE FROM billing_ledger WHERE case_id = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM provisions WHERE case_id = :id").setParameter("id", id).executeUpdate();

        // 6. trust deposits then trust accounts
        em.createNativeQuery("DELETE FROM trust_deposits WHERE trust_account_id IN (SELECT id FROM trust_accounts WHERE case_id = :id)").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM trust_accounts WHERE case_id = :id").setParameter("id", id).executeUpdate();

        // 7. remaining case children
        em.createNativeQuery("DELETE FROM case_phase_history WHERE case_id = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM evenements WHERE case_id = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM case_notes WHERE idc = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM documents WHERE idc = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM audiences WHERE idc = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM trial WHERE idc = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM legal_deadlines WHERE case_id = :id").setParameter("id", id).executeUpdate();
        em.createNativeQuery("DELETE FROM timesheets WHERE case_id = :id").setParameter("id", id).executeUpdate();

        // 8. unlink appointments (preserve them, just remove the case reference)
        em.createNativeQuery("UPDATE appointments SET case_id = NULL WHERE case_id = :id").setParameter("id", id).executeUpdate();

        // 9. remove case's own appointment_id reference, then delete
        em.createNativeQuery("UPDATE cases SET appointment_id = NULL WHERE idc = :id").setParameter("id", id).executeUpdate();
        repo.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
