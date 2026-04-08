package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.InvoiceDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases/{caseId}/invoices")
public class CaseInvoiceController {

    private final InvoiceService invoiceService;

    public CaseInvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<InvoiceDTO> list(@PathVariable Long caseId) {
        return invoiceService.findByCase(caseId);
    }

    @PostMapping
    public ResponseEntity<InvoiceDTO> create(@PathVariable Long caseId,
                                              @RequestBody Map<String, Object> body) {
        List<InvoiceLine> lines = parseLines(body);
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse(body.get("dueDate").toString()) : null;
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;
        return ResponseEntity.ok(invoiceService.createInvoice(caseId, lines, dueDate, notes, null));
    }

    @PutMapping("/{invoiceId}")
    public ResponseEntity<InvoiceDTO> update(@PathVariable Long caseId,
                                              @PathVariable Long invoiceId,
                                              @RequestBody Map<String, Object> body) {
        List<InvoiceLine> lines = parseLines(body);
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse(body.get("dueDate").toString()) : null;
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;
        return ResponseEntity.ok(invoiceService.updateInvoice(invoiceId, lines, dueDate, notes));
    }

    @PatchMapping("/{invoiceId}/issue")
    public ResponseEntity<InvoiceDTO> issue(@PathVariable Long caseId,
                                             @PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.issueInvoice(invoiceId));
    }

    @PatchMapping("/{invoiceId}/void")
    public ResponseEntity<InvoiceDTO> voidInvoice(@PathVariable Long caseId,
                                                    @PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.voidInvoice(invoiceId));
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<Void> delete(@PathVariable Long caseId,
                                        @PathVariable Long invoiceId) {
        invoiceService.deleteInvoice(invoiceId);
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private List<InvoiceLine> parseLines(Map<String, Object> body) {
        List<InvoiceLine> result = new ArrayList<>();
        Object rawLines = body.get("lines");
        if (rawLines instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> lineMap = (Map<String, Object>) m;
                    InvoiceLine line = new InvoiceLine();
                    if (lineMap.get("description") != null)
                        line.setDescription(lineMap.get("description").toString());
                    if (lineMap.get("quantity") != null)
                        line.setQuantity(new BigDecimal(lineMap.get("quantity").toString()));
                    if (lineMap.get("unitPrice") != null)
                        line.setUnitPrice(new BigDecimal(lineMap.get("unitPrice").toString()));
                    if (lineMap.get("type") != null) {
                        try { line.setType(InvoiceLineType.valueOf(lineMap.get("type").toString())); }
                        catch (IllegalArgumentException ignored) { line.setType(InvoiceLineType.HONORAIRES); }
                    }
                    if (lineMap.get("sortOrder") != null)
                        line.setSortOrder(Integer.parseInt(lineMap.get("sortOrder").toString()));
                    result.add(line);
                }
            }
        }
        return result;
    }
}
