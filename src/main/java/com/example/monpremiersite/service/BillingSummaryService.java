package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.BillingSummaryDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class BillingSummaryService {

    private final TrustAccountRepository trustRepo;
    private final InvoiceRepository invoiceRepo;

    public BillingSummaryService(TrustAccountRepository trustRepo,
                                 InvoiceRepository invoiceRepo) {
        this.trustRepo   = trustRepo;
        this.invoiceRepo = invoiceRepo;
    }

    public BillingSummaryDTO getCaseSummary(Long caseId) {
        BillingSummaryDTO dto = new BillingSummaryDTO();

        trustRepo.findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(
                caseId, List.of(TrustStatus.ACTIVE, TrustStatus.PENDING))
                .ifPresent(ta -> {
            dto.setTotalDeposited(ta.getTotalDeposited());
            dto.setTotalAllocated(ta.getTotalReleased());
            dto.setTrustBalance(ta.getBalance());
        });

        List<Invoice> invoices = invoiceRepo.findByCaseEntity_Idc(caseId);
        BigDecimal invoicedHT  = BigDecimal.ZERO;
        BigDecimal invoicedTTC = BigDecimal.ZERO;
        BigDecimal unpaid      = BigDecimal.ZERO;
        for (Invoice inv : invoices) {
            if (inv.getStatus() == InvoiceStatus.VOID) continue;
            invoicedHT  = invoicedHT.add(safe(inv.getAmountHT()));
            invoicedTTC = invoicedTTC.add(safe(inv.getAmountTTC()));
            if (inv.getStatus() == InvoiceStatus.ISSUED || inv.getStatus() == InvoiceStatus.PARTIAL) {
                unpaid = unpaid.add(inv.getAmountDue());
            }
        }
        dto.setTotalInvoicedHT(invoicedHT);
        dto.setTotalInvoicedTTC(invoicedTTC);
        dto.setTotalUnpaid(unpaid);

        BigDecimal balance = dto.getTrustBalance();
        if (balance.compareTo(BigDecimal.ZERO) > 0 && unpaid.compareTo(BigDecimal.ZERO) == 0) {
            dto.setStatus("REFUND_DUE");
        } else if (unpaid.compareTo(balance) > 0) {
            dto.setStatus("PAYMENT_DUE");
        } else if (balance.compareTo(BigDecimal.ZERO) == 0 && unpaid.compareTo(BigDecimal.ZERO) == 0) {
            dto.setStatus("SETTLED");
        } else {
            dto.setStatus("IN_PROGRESS");
        }
        return dto;
    }

    private BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
