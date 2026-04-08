package com.example.monpremiersite.dto;

import com.example.monpremiersite.entities.TrustAccount;
import com.example.monpremiersite.entities.TrustStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TrustAccountDTO {
    private Long id;
    private Long caseId;
    private String caseNumber;
    private String clientName;
    private BigDecimal requestedAmount;
    private BigDecimal totalDeposited;
    private BigDecimal totalReleased;
    private BigDecimal totalRefunded;
    private BigDecimal balance;
    private TrustStatus status;
    private String notes;
    private LocalDateTime createdAt;

    public static TrustAccountDTO fromEntity(TrustAccount t) {
        TrustAccountDTO d = new TrustAccountDTO();
        d.id              = t.getId();
        d.requestedAmount = t.getRequestedAmount();
        d.totalDeposited  = t.getTotalDeposited();
        d.totalReleased   = t.getTotalReleased();
        d.totalRefunded   = t.getTotalRefunded();
        d.balance         = t.getBalance();
        d.status          = t.getStatus();
        d.notes           = t.getNotes();
        d.createdAt       = t.getCreatedAt();
        if (t.getLegalCase() != null) {
            d.caseId     = t.getLegalCase().getIdc();
            d.caseNumber = t.getLegalCase().getCase_number();
            if (t.getLegalCase().getUser() != null) {
                d.clientName = (t.getLegalCase().getUser().getPrenom()
                        + " " + t.getLegalCase().getUser().getNom()).trim();
            }
        }
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { this.caseId = v; }
    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String v) { this.caseNumber = v; }
    public String getClientName() { return clientName; }
    public void setClientName(String v) { this.clientName = v; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal v) { this.requestedAmount = v; }
    public BigDecimal getTotalDeposited() { return totalDeposited; }
    public void setTotalDeposited(BigDecimal v) { this.totalDeposited = v; }
    public BigDecimal getTotalReleased() { return totalReleased; }
    public void setTotalReleased(BigDecimal v) { this.totalReleased = v; }
    public BigDecimal getTotalRefunded() { return totalRefunded; }
    public void setTotalRefunded(BigDecimal v) { this.totalRefunded = v; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal v) { this.balance = v; }
    public TrustStatus getStatus() { return status; }
    public void setStatus(TrustStatus v) { this.status = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
