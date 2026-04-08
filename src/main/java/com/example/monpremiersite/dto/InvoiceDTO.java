package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.Invoice;
import com.example.monpremiersite.entities.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class InvoiceDTO {

    private Long id;
    private String invoiceNumber;
    private InvoiceStatus status;
    private BigDecimal amountHT;
    private BigDecimal taxRate;
    private BigDecimal amountTVA;
    private BigDecimal amountTTC;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private LocalDate invoiceDate;
    private LocalDate issuedDate;
    private LocalDate dueDate;
    private String notes;
    private Boolean emailSent;

    private Long clientId;
    private String clientFullName;
    private String clientEmail;

    private Long caseId;
    private String caseNumber;

    private Long createdById;
    private String createdByName;

    private List<InvoiceLineDTO> lines;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InvoiceDTO fromEntity(Invoice inv) {
        InvoiceDTO d = new InvoiceDTO();
        d.id           = inv.getId();
        d.invoiceNumber = inv.getInvoiceNumber();
        d.status       = inv.getStatus();
        d.amountHT     = inv.getAmountHT();
        d.taxRate      = inv.getTaxRate();
        d.amountTVA    = inv.getAmountTVA();
        d.amountTTC    = inv.getAmountTTC();
        d.amountPaid   = inv.getAmountPaid();
        d.amountDue    = inv.getAmountDue();
        d.invoiceDate  = inv.getInvoiceDate();
        d.issuedDate   = inv.getIssuedDate();
        d.dueDate      = inv.getDueDate();
        d.notes        = inv.getNotes();
        d.emailSent    = inv.getEmailSent();
        d.createdAt    = inv.getCreatedAt();
        d.updatedAt    = inv.getUpdatedAt();

        if (inv.getClient() != null) {
            d.clientId       = inv.getClient().getIdu();
            d.clientFullName = (inv.getClient().getPrenom() + " " + inv.getClient().getNom()).trim();
            d.clientEmail    = inv.getClient().getEmail();
        }
        if (inv.getCaseEntity() != null) {
            d.caseId     = inv.getCaseEntity().getIdc();
            d.caseNumber = inv.getCaseEntity().getCase_number();
        }
        if (inv.getCreatedBy() != null) {
            d.createdById   = inv.getCreatedBy().getIdu();
            d.createdByName = (inv.getCreatedBy().getPrenom() + " " + inv.getCreatedBy().getNom()).trim();
        }
        d.lines = inv.getInvoiceLines().stream()
                .map(InvoiceLineDTO::fromEntity)
                .collect(Collectors.toList());
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String n) { this.invoiceNumber = n; }
    public InvoiceStatus getStatus() { return status; }
    public void setStatus(InvoiceStatus s) { this.status = s; }
    public BigDecimal getAmountHT() { return amountHT; }
    public void setAmountHT(BigDecimal v) { this.amountHT = v; }
    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal v) { this.taxRate = v; }
    public BigDecimal getAmountTVA() { return amountTVA; }
    public void setAmountTVA(BigDecimal v) { this.amountTVA = v; }
    public BigDecimal getAmountTTC() { return amountTTC; }
    public void setAmountTTC(BigDecimal v) { this.amountTTC = v; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal v) { this.amountPaid = v; }
    public BigDecimal getAmountDue() { return amountDue; }
    public void setAmountDue(BigDecimal v) { this.amountDue = v; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate v) { this.invoiceDate = v; }
    public LocalDate getIssuedDate() { return issuedDate; }
    public void setIssuedDate(LocalDate v) { this.issuedDate = v; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate v) { this.dueDate = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public Boolean getEmailSent() { return emailSent; }
    public void setEmailSent(Boolean v) { this.emailSent = v; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long v) { this.clientId = v; }
    public String getClientFullName() { return clientFullName; }
    public void setClientFullName(String v) { this.clientFullName = v; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String v) { this.clientEmail = v; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { this.caseId = v; }
    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String v) { this.caseNumber = v; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long v) { this.createdById = v; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String v) { this.createdByName = v; }
    public List<InvoiceLineDTO> getLines() { return lines; }
    public void setLines(List<InvoiceLineDTO> v) { this.lines = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }
}
