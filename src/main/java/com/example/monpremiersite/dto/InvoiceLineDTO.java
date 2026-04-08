package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.InvoiceLine;
import com.example.monpremiersite.entities.InvoiceLineType;
import java.math.BigDecimal;

public class InvoiceLineDTO {

    private Long id;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private InvoiceLineType type;
    private Integer sortOrder;
    private String notes;

    public InvoiceLineDTO() {}

    public static InvoiceLineDTO fromEntity(InvoiceLine l) {
        InvoiceLineDTO d = new InvoiceLineDTO();
        d.id          = l.getId();
        d.description = l.getDescription();
        d.quantity    = l.getQuantity();
        d.unitPrice   = l.getUnitPrice();
        d.lineTotal   = l.getLineTotal();
        d.type        = l.getType();
        d.sortOrder   = l.getSortOrder();
        d.notes       = l.getNotes();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal v) { this.quantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal v) { this.lineTotal = v; }
    public InvoiceLineType getType() { return type; }
    public void setType(InvoiceLineType v) { this.type = v; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer v) { this.sortOrder = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
}
