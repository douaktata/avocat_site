package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.InvoiceDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepo;
    private final InvoiceLineRepository lineRepo;
    private final CaseRepository caseRepo;
    private final BillingLedgerService ledgerService;
    private final EmailService emailService;
    private final TrustAccountService trustService;

    public InvoiceService(InvoiceRepository invoiceRepo,
                          InvoiceLineRepository lineRepo,
                          CaseRepository caseRepo,
                          BillingLedgerService ledgerService,
                          EmailService emailService,
                          TrustAccountService trustService) {
        this.invoiceRepo   = invoiceRepo;
        this.lineRepo      = lineRepo;
        this.caseRepo      = caseRepo;
        this.ledgerService = ledgerService;
        this.emailService  = emailService;
        this.trustService  = trustService;
    }

    // ── READ ──────────────────────────────────────────────────────────────

    public Optional<Invoice> findById(Long id) {
        return invoiceRepo.findById(id);
    }

    public List<InvoiceDTO> findByCase(Long caseId) {
        return invoiceRepo.findByCaseEntity_IdcOrderByCreatedAtDesc(caseId)
                .stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
    }

    public List<Invoice> findByClientId(Long clientId) {
        return invoiceRepo.findByClient_Idu(clientId);
    }

    public List<InvoiceDTO> findAll() {
        return invoiceRepo.findAll().stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
    }

    // ── CREATE (DRAFT) ────────────────────────────────────────────────────

    public InvoiceDTO createInvoice(Long caseId, List<InvoiceLine> lines,
                                    LocalDate dueDate, String notes, User createdBy) {
        CaseEntity cas = caseRepo.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable: " + caseId));

        Invoice inv = new Invoice();
        inv.setCaseEntity(cas);
        inv.setClient(cas.getUser());
        inv.setCreatedBy(createdBy);
        inv.setDueDate(dueDate);
        inv.setNotes(notes);
        inv.setStatus(InvoiceStatus.DRAFT);
        inv = invoiceRepo.save(inv);

        for (InvoiceLine line : lines) {
            line.setInvoice(inv);
            lineRepo.save(line);
            inv.getInvoiceLines().add(line);
        }
        inv.recalculate();
        return InvoiceDTO.fromEntity(invoiceRepo.save(inv));
    }

    // ── UPDATE (DRAFT only) ───────────────────────────────────────────────

    public InvoiceDTO updateInvoice(Long invoiceId, List<InvoiceLine> newLines,
                                    LocalDate dueDate, String notes) {
        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable: " + invoiceId));
        if (inv.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Seules les factures DRAFT peuvent être modifiées");
        }
        lineRepo.deleteAll(inv.getInvoiceLines());
        inv.getInvoiceLines().clear();
        inv.setDueDate(dueDate);
        inv.setNotes(notes);
        invoiceRepo.save(inv);

        for (InvoiceLine line : newLines) {
            line.setInvoice(inv);
            lineRepo.save(line);
            inv.getInvoiceLines().add(line);
        }
        inv.recalculate();
        return InvoiceDTO.fromEntity(invoiceRepo.save(inv));
    }

    // ── ISSUE (DRAFT → ISSUED) ────────────────────────────────────────────

    public InvoiceDTO issueInvoice(Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable: " + invoiceId));
        if (inv.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Seules les factures DRAFT peuvent être émises");
        }
        inv.setInvoiceNumber(generateInvoiceNumber());
        inv.setIssuedDate(LocalDate.now());
        inv.setStatus(InvoiceStatus.ISSUED);
        inv.setEmailSent(false);
        inv = invoiceRepo.save(inv);

        // Auto-create new PENDING trust account if none active after closure
        if (inv.getCaseEntity() != null) {
            TrustAccount activeTrust = trustService.getActiveTrustAccount(inv.getCaseEntity().getIdc());
            if (activeTrust == null) {
                trustService.createTrustAccount(inv.getCaseEntity().getIdc(), BigDecimal.ZERO,
                    "Provision automatique — nouvelle facture émise après clôture du séquestre précédent");
            }
        }

        if (inv.getCaseEntity() != null) {
            BigDecimal ttc = inv.getAmountTTC() != null ? inv.getAmountTTC() : BigDecimal.ZERO;
            ledgerService.recordEntry(inv.getCaseEntity().getIdc(),
                    LedgerEntryType.INVOICE, ttc, inv.getId(),
                    "Facture émise " + inv.getInvoiceNumber() + " — " + ttc.toPlainString() + " TND TTC");
        }
        emailService.sendInvoiceEmail(inv);
        inv.setEmailSent(true);
        return InvoiceDTO.fromEntity(invoiceRepo.save(inv));
    }

    // ── VOID ──────────────────────────────────────────────────────────────

    public InvoiceDTO voidInvoice(Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable: " + invoiceId));
        if (inv.getStatus() == InvoiceStatus.PAID || inv.getStatus() == InvoiceStatus.VOID) {
            throw new IllegalStateException("Impossible d'annuler une facture " + inv.getStatus());
        }
        inv.setStatus(InvoiceStatus.VOID);
        return InvoiceDTO.fromEntity(invoiceRepo.save(inv));
    }

    // ── DELETE ────────────────────────────────────────────────────────────

    public void deleteInvoice(Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable: " + invoiceId));
        if (inv.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Seules les factures DRAFT peuvent être supprimées");
        }
        invoiceRepo.delete(inv);
    }

    // ── NUMBERING ─────────────────────────────────────────────────────────

    private String generateInvoiceNumber() {
        String year   = String.valueOf(Year.now().getValue());
        String prefix = "FA-" + year + "-";
        long count    = invoiceRepo.countByInvoiceNumberStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    /** Legacy save — used by InvoiceController old endpoints */
    public Invoice save(Invoice invoice) {
        return invoiceRepo.save(invoice);
    }
}
