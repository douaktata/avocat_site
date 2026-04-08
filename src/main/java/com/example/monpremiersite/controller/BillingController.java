package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.BillingSummaryDTO;
import com.example.monpremiersite.service.BillingSummaryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingSummaryService summaryService;

    public BillingController(BillingSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping("/cases/{caseId}/summary")
    public BillingSummaryDTO caseSummary(@PathVariable Long caseId) {
        return summaryService.getCaseSummary(caseId);
    }
}
