package com.example.monpremiersite.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_lines")
@Data
public class InvoiceLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private String description;

    private BigDecimal quantity  = BigDecimal.ONE;
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private InvoiceLineType type = InvoiceLineType.HONORAIRES;

    private Integer sortOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Transient
    public BigDecimal getLineTotal() {
        if (quantity == null || unitPrice == null) return BigDecimal.ZERO;
        return quantity.multiply(unitPrice);
    }

    /** Legacy: subtotal = lineTotal */
    @Transient
    public BigDecimal getSubtotal() { return getLineTotal(); }
}
