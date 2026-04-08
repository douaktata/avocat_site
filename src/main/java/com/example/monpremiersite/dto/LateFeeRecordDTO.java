package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.LateFeeRecord;
import java.math.BigDecimal;
import java.time.LocalDate;

public class LateFeeRecordDTO {

    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal amount;
    private BigDecimal overrideAmount;
    private BigDecimal effectiveAmount;
    private LocalDate appliedDate;
    private String notes;

    public LateFeeRecordDTO() {}

    public static LateFeeRecordDTO fromEntity(LateFeeRecord record) {
        LateFeeRecordDTO dto = new LateFeeRecordDTO();
        dto.id = record.getId();
        if (record.getInvoice() != null) {
            dto.invoiceId = record.getInvoice().getId();
            dto.invoiceNumber = record.getInvoice().getInvoiceNumber();
        }
        dto.amount = record.getAmount();
        dto.overrideAmount = record.getOverrideAmount();
        dto.effectiveAmount = record.getOverrideAmount() != null ? record.getOverrideAmount() : record.getAmount();
        dto.appliedDate = record.getAppliedDate();
        dto.notes = record.getNotes();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInvoiceId() { return invoiceId; }
    public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getOverrideAmount() { return overrideAmount; }
    public void setOverrideAmount(BigDecimal overrideAmount) { this.overrideAmount = overrideAmount; }
    public BigDecimal getEffectiveAmount() { return effectiveAmount; }
    public void setEffectiveAmount(BigDecimal effectiveAmount) { this.effectiveAmount = effectiveAmount; }
    public LocalDate getAppliedDate() { return appliedDate; }
    public void setAppliedDate(LocalDate appliedDate) { this.appliedDate = appliedDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
