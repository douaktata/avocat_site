package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.TrustAccountDTO;
import com.example.monpremiersite.dto.TrustDepositDTO;
import com.example.monpremiersite.dto.BillingLedgerDTO;
import com.example.monpremiersite.entities.PaymentMethod;
import com.example.monpremiersite.entities.TrustAccount;
import com.example.monpremiersite.entities.User;
import com.example.monpremiersite.repository.UserRepository;
import com.example.monpremiersite.security.UserDetailsImpl;
import com.example.monpremiersite.service.TrustAccountService;
import com.example.monpremiersite.service.BillingLedgerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases/{caseId}/trust")
public class TrustController {

    private final TrustAccountService trustService;
    private final BillingLedgerService ledgerService;
    private final UserRepository userRepository;

    public TrustController(TrustAccountService trustService,
                           BillingLedgerService ledgerService,
                           UserRepository userRepository) {
        this.trustService  = trustService;
        this.ledgerService = ledgerService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<TrustAccountDTO> get(@PathVariable Long caseId) {
        TrustAccount ta = trustService.getActiveTrustAccount(caseId);
        if (ta == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(TrustAccountDTO.fromEntity(ta));
    }

    @GetMapping("/all")
    public ResponseEntity<List<TrustAccountDTO>> getAll(@PathVariable Long caseId) {
        return ResponseEntity.ok(trustService.getAllTrustAccounts(caseId));
    }

    @PostMapping("/request")
    public ResponseEntity<TrustAccountDTO> create(@PathVariable Long caseId,
                                                   @RequestBody Map<String, Object> body) {
        BigDecimal amount = body.get("requestedAmount") != null
                ? new BigDecimal(body.get("requestedAmount").toString()) : BigDecimal.ZERO;
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;
        return ResponseEntity.ok(trustService.createTrustAccount(caseId, amount, notes));
    }

    @GetMapping("/deposits")
    public List<TrustDepositDTO> deposits(@PathVariable Long caseId) {
        return trustService.getDeposits(caseId);
    }

    @PostMapping("/deposits")
    public ResponseEntity<TrustDepositDTO> addDeposit(@PathVariable Long caseId,
                                                       @RequestBody Map<String, Object> body,
                                                       Authentication authentication) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        PaymentMethod method = PaymentMethod.valueOf(body.get("paymentMethod").toString());
        LocalDate date = body.get("paymentDate") != null
                ? LocalDate.parse(body.get("paymentDate").toString()) : LocalDate.now();
        String checkNumber = body.get("checkNumber") != null ? body.get("checkNumber").toString() : null;
        String bankName    = body.get("bankName")    != null ? body.get("bankName").toString()    : null;
        String notes       = body.get("notes")       != null ? body.get("notes").toString()       : null;

        User receivedBy = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl ud) {
            receivedBy = userRepository.findById(ud.getIdu()).orElse(null);
        }

        return ResponseEntity.ok(
                trustService.addDeposit(caseId, amount, method, date, checkNumber, bankName, notes, receivedBy));
    }

    @PostMapping("/refund")
    public ResponseEntity<TrustAccountDTO> refund(@PathVariable Long caseId,
                                                   @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;
        return ResponseEntity.ok(trustService.processRefund(caseId, amount, notes));
    }

    @GetMapping("/ledger")
    public List<BillingLedgerDTO> ledger(@PathVariable Long caseId) {
        return ledgerService.getLedger(caseId);
    }
}
