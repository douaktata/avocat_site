package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.ProvisionDTO;
import com.example.monpremiersite.entities.ProvisionType;
import com.example.monpremiersite.repository.ProvisionRepository;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.service.ProvisionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/provisions")
public class ProvisionController {

    @Autowired
    private ProvisionService provisionService;

    @Autowired
    private ProvisionRepository provisionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ProvisionDTO> getById(@PathVariable Long id) {
        return provisionRepository.findById(id)
                .map(p -> ResponseEntity.ok(ProvisionDTO.fromEntity(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/case/{caseId}")
    public List<ProvisionDTO> getByCase(@PathVariable Long caseId) {
        return provisionService.getByCase(caseId);
    }

    @GetMapping("/client/{clientId}")
    public List<ProvisionDTO> getByClient(@PathVariable Long clientId) {
        return provisionRepository.findByClientIdu(clientId)
                .stream()
                .map(ProvisionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            if (body.get("caseId") == null) return ResponseEntity.badRequest().body(Map.of("message", "caseId est obligatoire"));
            if (body.get("clientId") == null) return ResponseEntity.badRequest().body(Map.of("message", "Ce dossier n'a pas de client assigné"));
            Long caseId = Long.valueOf(body.get("caseId").toString());
            // Resolve avocat from JWT, not from client-supplied avocatId
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Long avocatId = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + email))
                    .getIdu();
            Long clientId = Long.valueOf(body.get("clientId").toString());
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String description = body.get("description") != null ? body.get("description").toString() : null;
            String termsText = body.get("termsText") != null ? body.get("termsText").toString() : null;
            ProvisionType type = ProvisionType.valueOf(body.get("type").toString());
            return ResponseEntity.ok(provisionService.requestProvision(caseId, avocatId, clientId, amount, description, termsText, type));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
    }

    @PutMapping("/{id}/mark-received")
    public ResponseEntity<ProvisionDTO> markReceived(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String receivedDateStr = body.get("receivedDate").toString();
        if (receivedDateStr.length() == 16) receivedDateStr = receivedDateStr + ":00";
        LocalDateTime receivedDate = LocalDateTime.parse(receivedDateStr);
        ProvisionDTO dto = provisionService.recordPayment(id, receivedDate);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/refund")
    public ResponseEntity<Void> refund(@PathVariable Long id) {
        provisionService.refund(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!provisionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        provisionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
