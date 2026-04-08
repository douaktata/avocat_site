package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "provisions")
public class Provision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provision_number", unique = true)
    private String provisionNumber;

    @Enumerated(EnumType.STRING)
    private ProvisionType type;

    @Enumerated(EnumType.STRING)
    private ProvisionStatus status = ProvisionStatus.DEMANDEE;

    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "terms_text", columnDefinition = "TEXT")
    private String termsText;

    @Column(name = "requested_date")
    private LocalDate requestedDate;

    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    @Column(name = "is_refundable")
    private Boolean isRefundable = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avocat_id")
    private User avocat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
