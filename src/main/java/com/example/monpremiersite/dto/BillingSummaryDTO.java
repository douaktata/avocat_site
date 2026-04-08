package com.example.monpremiersite.dto;

import java.math.BigDecimal;

public class BillingSummaryDTO {
    private BigDecimal totalDeposited    = BigDecimal.ZERO;
    private BigDecimal totalInvoicedHT   = BigDecimal.ZERO;
    private BigDecimal totalInvoicedTTC  = BigDecimal.ZERO;
    private BigDecimal totalAllocated    = BigDecimal.ZERO;
    private BigDecimal trustBalance      = BigDecimal.ZERO;
    private BigDecimal totalUnpaid       = BigDecimal.ZERO;
    private String status; // REFUND_DUE | PAYMENT_DUE | SETTLED | IN_PROGRESS

    public BigDecimal getTotalDeposited() { return totalDeposited; }
    public void setTotalDeposited(BigDecimal v) { this.totalDeposited = v; }
    public BigDecimal getTotalInvoicedHT() { return totalInvoicedHT; }
    public void setTotalInvoicedHT(BigDecimal v) { this.totalInvoicedHT = v; }
    public BigDecimal getTotalInvoicedTTC() { return totalInvoicedTTC; }
    public void setTotalInvoicedTTC(BigDecimal v) { this.totalInvoicedTTC = v; }
    public BigDecimal getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(BigDecimal v) { this.totalAllocated = v; }
    public BigDecimal getTrustBalance() { return trustBalance; }
    public void setTrustBalance(BigDecimal v) { this.trustBalance = v; }
    public BigDecimal getTotalUnpaid() { return totalUnpaid; }
    public void setTotalUnpaid(BigDecimal v) { this.totalUnpaid = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
}
