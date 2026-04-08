package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_ledger")
@Data
public class BillingLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseEntity legalCase;

    @Enumerated(EnumType.STRING)
    private LedgerEntryType entryType;

    private BigDecimal amount;
    private BigDecimal runningBalance;

    private Long referenceId;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
