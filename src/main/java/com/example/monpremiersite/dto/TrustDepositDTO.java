package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.PaymentMethod;
import com.example.monpremiersite.entities.TrustDeposit;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TrustDepositDTO {
    private Long id;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private LocalDate paymentDate;
    private String receiptNumber;
    private String receivedByName;
    private String checkNumber;
    private String bankName;
    private String notes;
    private Boolean emailSent;
    private LocalDateTime createdAt;

    public static TrustDepositDTO fromEntity(TrustDeposit dep) {
        TrustDepositDTO d = new TrustDepositDTO();
        d.id            = dep.getId();
        d.amount        = dep.getAmount();
        d.paymentMethod = dep.getPaymentMethod();
        d.paymentDate   = dep.getPaymentDate();
        d.receiptNumber = dep.getReceiptNumber();
        d.checkNumber   = dep.getCheckNumber();
        d.bankName      = dep.getBankName();
        d.notes         = dep.getNotes();
        d.emailSent     = dep.getEmailSent();
        d.createdAt     = dep.getCreatedAt();
        if (dep.getReceivedBy() != null) {
            d.receivedByName = (dep.getReceivedBy().getPrenom()
                    + " " + dep.getReceivedBy().getNom()).trim();
        }
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { this.amount = v; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod v) { this.paymentMethod = v; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate v) { this.paymentDate = v; }
    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String v) { this.receiptNumber = v; }
    public String getReceivedByName() { return receivedByName; }
    public void setReceivedByName(String v) { this.receivedByName = v; }
    public String getCheckNumber() { return checkNumber; }
    public void setCheckNumber(String v) { this.checkNumber = v; }
    public String getBankName() { return bankName; }
    public void setBankName(String v) { this.bankName = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public Boolean getEmailSent() { return emailSent; }
    public void setEmailSent(Boolean v) { this.emailSent = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
