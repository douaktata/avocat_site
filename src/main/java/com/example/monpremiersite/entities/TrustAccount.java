package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trust_accounts")
@Data
public class TrustAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseEntity legalCase;

    private BigDecimal requestedAmount = BigDecimal.ZERO;
    private BigDecimal totalDeposited  = BigDecimal.ZERO;
    private BigDecimal totalReleased   = BigDecimal.ZERO;
    private BigDecimal totalRefunded   = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private TrustStatus status = TrustStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "trustAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TrustDeposit> deposits = new ArrayList<>();

    @Transient
    public BigDecimal getBalance() {
        BigDecimal d = totalDeposited  != null ? totalDeposited  : BigDecimal.ZERO;
        BigDecimal r = totalReleased   != null ? totalReleased   : BigDecimal.ZERO;
        BigDecimal f = totalRefunded   != null ? totalRefunded   : BigDecimal.ZERO;
        return d.subtract(r).subtract(f);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
