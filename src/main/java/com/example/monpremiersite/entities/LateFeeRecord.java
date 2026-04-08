package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "late_fee_records")
@Data
public class LateFeeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private BigDecimal amount;

    private BigDecimal overrideAmount;  // if TRESORIER manually overrides

    @Column(nullable = false)
    private LocalDate appliedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
