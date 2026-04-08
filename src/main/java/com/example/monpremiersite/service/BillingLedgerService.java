package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.BillingLedgerDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.BillingLedgerRepository;
import com.example.monpremiersite.repository.CaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BillingLedgerService {

    private final BillingLedgerRepository ledgerRepo;
    private final CaseRepository caseRepo;

    public BillingLedgerService(BillingLedgerRepository ledgerRepo, CaseRepository caseRepo) {
        this.ledgerRepo = ledgerRepo;
        this.caseRepo   = caseRepo;
    }

    public void recordEntry(Long caseId, LedgerEntryType type,
                            BigDecimal amount, Long referenceId, String description) {
        CaseEntity cas = caseRepo.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable: " + caseId));

        BigDecimal lastBalance = ledgerRepo
                .findTopByLegalCase_IdcOrderByCreatedAtDesc(caseId)
                .map(BillingLedger::getRunningBalance)
                .orElse(BigDecimal.ZERO);

        BigDecimal running;
        if (type == LedgerEntryType.DEPOSIT) {
            running = lastBalance.add(amount);
        } else if (type == LedgerEntryType.ALLOCATION || type == LedgerEntryType.REFUND) {
            running = lastBalance.subtract(amount);
        } else {
            running = lastBalance; // INVOICE — informatif uniquement
        }

        BillingLedger entry = new BillingLedger();
        entry.setLegalCase(cas);
        entry.setEntryType(type);
        entry.setAmount(amount);
        entry.setRunningBalance(running);
        entry.setReferenceId(referenceId);
        entry.setDescription(description);
        ledgerRepo.save(entry);
    }

    public List<BillingLedgerDTO> getLedger(Long caseId) {
        return ledgerRepo.findByLegalCase_IdcOrderByCreatedAtAsc(caseId)
                .stream().map(BillingLedgerDTO::fromEntity).collect(Collectors.toList());
    }
}
