package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.TrustAccountDTO;
import com.example.monpremiersite.dto.TrustDepositDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrustAccountService {

    private final TrustAccountRepository trustRepo;
    private final TrustDepositRepository depositRepo;
    private final CaseRepository caseRepo;
    private final BillingLedgerService ledgerService;
    private final EmailService emailService;
    private final InvoiceRepository invoiceRepo;

    public TrustAccountService(TrustAccountRepository trustRepo,
                               TrustDepositRepository depositRepo,
                               CaseRepository caseRepo,
                               BillingLedgerService ledgerService,
                               EmailService emailService,
                               InvoiceRepository invoiceRepo) {
        this.trustRepo     = trustRepo;
        this.depositRepo   = depositRepo;
        this.caseRepo      = caseRepo;
        this.ledgerService = ledgerService;
        this.emailService  = emailService;
        this.invoiceRepo   = invoiceRepo;
    }

    public TrustAccountDTO createTrustAccount(Long caseId, BigDecimal requestedAmount, String notes) {
        CaseEntity cas = caseRepo.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable: " + caseId));
        TrustAccount ta = new TrustAccount();
        ta.setLegalCase(cas);
        ta.setRequestedAmount(requestedAmount != null ? requestedAmount : BigDecimal.ZERO);
        ta.setNotes(notes);
        return TrustAccountDTO.fromEntity(trustRepo.save(ta));
    }

    public TrustAccount getActiveTrustAccount(Long caseId) {
        return trustRepo.findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(
                caseId, List.of(TrustStatus.ACTIVE, TrustStatus.PENDING))
                .orElse(null);
    }

    public TrustAccountDTO getTrustAccount(Long caseId) {
        TrustAccount ta = getActiveTrustAccount(caseId);
        return ta != null ? TrustAccountDTO.fromEntity(ta) : null;
    }

    public TrustDepositDTO addDeposit(Long caseId, BigDecimal amount, PaymentMethod method,
                                      LocalDate paymentDate, String checkNumber,
                                      String bankName, String notes, User receivedBy) {
        TrustAccount ta = trustRepo.findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(
                caseId, List.of(TrustStatus.ACTIVE, TrustStatus.PENDING))
                .orElseThrow(() -> new IllegalStateException("Aucun compte séquestre pour ce dossier"));

        TrustDeposit dep = new TrustDeposit();
        dep.setTrustAccount(ta);
        dep.setAmount(amount);
        dep.setPaymentMethod(method);
        dep.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        dep.setCheckNumber(checkNumber);
        dep.setBankName(bankName);
        dep.setNotes(notes);
        dep.setReceivedBy(receivedBy);
        dep.setReceiptNumber(generateReceiptNumber());
        dep = depositRepo.save(dep);

        ta.setTotalDeposited(ta.getTotalDeposited().add(amount));
        if (ta.getStatus() == TrustStatus.PENDING) {
            ta.setStatus(TrustStatus.ACTIVE);
        }
        trustRepo.save(ta);

        ledgerService.recordEntry(caseId, LedgerEntryType.DEPOSIT, amount, dep.getId(),
                "Dépôt " + method.name() + " — " + amount.toPlainString() + " TND (" + dep.getReceiptNumber() + ")");

        emailService.sendDepositReceiptEmail(dep);
        return TrustDepositDTO.fromEntity(dep);
    }

    public TrustAccountDTO processRefund(Long caseId, BigDecimal amount, String notes) {
        List<Invoice> activeInvoices = invoiceRepo.findByCaseEntity_IdcAndStatusIn(
                caseId, List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL));
        if (!activeInvoices.isEmpty()) {
            throw new IllegalStateException(
                "Impossible de rembourser : " + activeInvoices.size() + " facture(s) encore active(s) (ISSUED/PARTIAL). Veuillez les régler avant de clôturer le séquestre.");
        }

        TrustAccount ta = trustRepo.findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(
                caseId, List.of(TrustStatus.ACTIVE, TrustStatus.PENDING))
                .orElseThrow(() -> new IllegalStateException("Aucun compte séquestre pour ce dossier"));
        if (ta.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Solde séquestre insuffisant pour rembourser " + amount + " TND");
        }
        ta.setTotalRefunded(ta.getTotalRefunded().add(amount));
        ta.setStatus(TrustStatus.CLOSED);
        trustRepo.save(ta);
        ledgerService.recordEntry(caseId, LedgerEntryType.REFUND, amount, ta.getId(),
                "Remboursement client — " + amount.toPlainString() + " TND");
        return TrustAccountDTO.fromEntity(ta);
    }

    public List<TrustDepositDTO> getDeposits(Long caseId) {
        TrustAccount ta = getActiveTrustAccount(caseId);
        if (ta == null) return List.of();
        return depositRepo.findByTrustAccount_IdOrderByPaymentDateDesc(ta.getId())
                .stream().map(TrustDepositDTO::fromEntity).collect(Collectors.toList());
    }

    public void closeActiveTrustAccount(Long caseId) {
        trustRepo.findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(
                caseId, List.of(TrustStatus.ACTIVE, TrustStatus.PENDING))
                .ifPresent(ta -> {
                    ta.setStatus(TrustStatus.CLOSED);
                    trustRepo.save(ta);
                });
    }

    public List<TrustAccountDTO> getAllTrustAccounts(Long caseId) {
        return trustRepo.findByLegalCase_IdcOrderByCreatedAtDesc(caseId)
                .stream().map(TrustAccountDTO::fromEntity).collect(Collectors.toList());
    }

    private String generateReceiptNumber() {
        String year   = String.valueOf(Year.now().getValue());
        String prefix = "RD-" + year + "-";
        long count    = depositRepo.countByReceiptNumberStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }
}
