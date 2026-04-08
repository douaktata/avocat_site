package com.example.monpremiersite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CaseClosureResultDTO {
    public String caseNumber;
    public String clientName;
    public LocalDate closedDate;

    public BigDecimal totalDeposited  = BigDecimal.ZERO;
    public BigDecimal totalInvoicedTTC = BigDecimal.ZERO;
    public BigDecimal totalAllocated  = BigDecimal.ZERO;
    public BigDecimal totalRefunded   = BigDecimal.ZERO;
    public BigDecimal trustBalance    = BigDecimal.ZERO;

    public int unpaidInvoices = 0;
    public BigDecimal unpaidAmount = BigDecimal.ZERO;
    public int draftInvoices = 0;

    public List<String> warnings;
    public boolean allSettled = false;
}
