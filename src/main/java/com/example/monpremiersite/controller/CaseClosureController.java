package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.CaseClosureResultDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.InvoiceRepository;
import com.example.monpremiersite.service.EmailService;
import com.example.monpremiersite.service.TrustAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/cases/{caseId}/close")
public class CaseClosureController {

    private final CaseRepository caseRepo;
    private final InvoiceRepository invoiceRepo;
    private final TrustAccountService trustService;
    private final EmailService emailService;

    public CaseClosureController(CaseRepository caseRepo,
                                  InvoiceRepository invoiceRepo,
                                  TrustAccountService trustService,
                                  EmailService emailService) {
        this.caseRepo     = caseRepo;
        this.invoiceRepo  = invoiceRepo;
        this.trustService = trustService;
        this.emailService = emailService;
    }

    @GetMapping("/preview")
    public ResponseEntity<CaseClosureResultDTO> preview(@PathVariable Long caseId) {
        CaseEntity cas = caseRepo.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable: " + caseId));
        return ResponseEntity.ok(buildSummary(cas, false));
    }

    @PostMapping
    public ResponseEntity<CaseClosureResultDTO> close(@PathVariable Long caseId) {
        CaseEntity cas = caseRepo.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable: " + caseId));

        cas.setStatus("CLOSED");
        caseRepo.save(cas);

        trustService.closeActiveTrustAccount(caseId);

        CaseClosureResultDTO result = buildSummary(cas, true);
        emailService.sendCaseClosureEmail(cas, result);

        return ResponseEntity.ok(result);
    }

    private CaseClosureResultDTO buildSummary(CaseEntity cas, boolean closed) {
        CaseClosureResultDTO dto = new CaseClosureResultDTO();
        dto.caseNumber  = cas.getCase_number();
        dto.clientName  = cas.getUser() != null
                ? cas.getUser().getPrenom() + " " + cas.getUser().getNom() : "—";
        dto.closedDate  = closed ? LocalDate.now() : null;

        TrustAccount ta = trustService.getActiveTrustAccount(cas.getIdc());
        if (ta != null) {
            dto.totalDeposited = ta.getTotalDeposited();
            dto.totalAllocated = ta.getTotalReleased();
            dto.totalRefunded  = ta.getTotalRefunded();
            dto.trustBalance   = ta.getBalance();
        }

        List<Invoice> invoices = invoiceRepo.findByCaseEntity_Idc(cas.getIdc());
        for (Invoice inv : invoices) {
            if (inv.getStatus() == InvoiceStatus.VOID) continue;
            dto.totalInvoicedTTC = dto.totalInvoicedTTC.add(safe(inv.getTotal()));
            if (inv.getStatus() == InvoiceStatus.ISSUED || inv.getStatus() == InvoiceStatus.PARTIAL) {
                dto.unpaidInvoices++;
                dto.unpaidAmount = dto.unpaidAmount.add(safe(inv.getAmountDue()));
            }
            if (inv.getStatus() == InvoiceStatus.DRAFT) {
                dto.draftInvoices++;
            }
        }

        List<String> warnings = new ArrayList<>();
        if (dto.unpaidInvoices > 0) {
            warnings.add(dto.unpaidInvoices + " facture(s) impayée(s) — " + fmt(dto.unpaidAmount) + " DT à régler par le client");
        }
        if (dto.trustBalance.compareTo(BigDecimal.ZERO) > 0) {
            warnings.add(fmt(dto.trustBalance) + " DT restant dans le séquestre — à rembourser au client");
        }
        if (dto.draftInvoices > 0) {
            warnings.add(dto.draftInvoices + " facture(s) en brouillon non émises");
        }
        dto.warnings   = warnings;
        dto.allSettled = warnings.isEmpty();
        return dto;
    }

    private BigDecimal safe(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }

    private String fmt(BigDecimal v) {
        return v != null ? String.format("%.3f", v) : "0.000";
    }
}
