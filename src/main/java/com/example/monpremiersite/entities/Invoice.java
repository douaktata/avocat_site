package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    private BigDecimal amountHT  = BigDecimal.ZERO;
    private BigDecimal taxRate   = new BigDecimal("0.19");
    private BigDecimal amountTVA = BigDecimal.ZERO;
    private BigDecimal amountTTC = BigDecimal.ZERO;
    private BigDecimal amountPaid = BigDecimal.ZERO;

    private LocalDate invoiceDate;
    private LocalDate issuedDate;
    private LocalDate dueDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Boolean emailSent = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private CaseEntity caseEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceLine> invoiceLines = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    public BigDecimal getAmountDue() {
        BigDecimal ttc  = amountTTC  != null ? amountTTC  : BigDecimal.ZERO;
        BigDecimal paid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        return ttc.subtract(paid);
    }

    /** Legacy compatibility for EmailService/PDFService */
    @Transient
    public BigDecimal getSubtotal() { return amountHT != null ? amountHT : BigDecimal.ZERO; }
    @Transient
    public BigDecimal getTaxAmount() { return amountTVA != null ? amountTVA : BigDecimal.ZERO; }
    @Transient
    public BigDecimal getTotal()     { return amountTTC != null ? amountTTC : BigDecimal.ZERO; }

    /** Recalculate all totals from lines */
    public void recalculate() {
        BigDecimal ht = invoiceLines.stream()
                .map(l -> l.getQuantity() != null && l.getUnitPrice() != null
                        ? l.getQuantity().multiply(l.getUnitPrice()) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.amountHT  = ht;
        BigDecimal rate = taxRate != null ? taxRate : new BigDecimal("0.19");
        this.amountTVA = ht.multiply(rate).setScale(3, java.math.RoundingMode.HALF_UP);
        this.amountTTC = this.amountHT.add(this.amountTVA);
    }

    @PrePersist
    protected void onCreate() {
        if (invoiceDate == null) invoiceDate = LocalDate.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
