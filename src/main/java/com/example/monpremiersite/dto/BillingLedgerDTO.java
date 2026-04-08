package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.BillingLedger;
import com.example.monpremiersite.entities.LedgerEntryType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BillingLedgerDTO {
    private Long id;
    private LedgerEntryType entryType;
    private BigDecimal amount;
    private BigDecimal runningBalance;
    private Long referenceId;
    private String description;
    private LocalDateTime createdAt;

    public static BillingLedgerDTO fromEntity(BillingLedger l) {
        BillingLedgerDTO d = new BillingLedgerDTO();
        d.id             = l.getId();
        d.entryType      = l.getEntryType();
        d.amount         = l.getAmount();
        d.runningBalance = l.getRunningBalance();
        d.referenceId    = l.getReferenceId();
        d.description    = l.getDescription();
        d.createdAt      = l.getCreatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LedgerEntryType getEntryType() { return entryType; }
    public void setEntryType(LedgerEntryType v) { this.entryType = v; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { this.amount = v; }
    public BigDecimal getRunningBalance() { return runningBalance; }
    public void setRunningBalance(BigDecimal v) { this.runningBalance = v; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long v) { this.referenceId = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
