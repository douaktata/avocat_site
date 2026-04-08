package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.InvoiceDTO;
import com.example.monpremiersite.dto.InvoiceLineDTO;
import com.example.monpremiersite.dto.LateFeeRecordDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.InvoiceLineRepository;
import com.example.monpremiersite.service.EmailService;
import com.example.monpremiersite.service.InvoicePDFService;
import com.example.monpremiersite.service.InvoiceService;
import com.example.monpremiersite.service.LateFeeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceLineRepository lineRepo;
    private final InvoicePDFService pdfService;
    private final LateFeeService lateFeeService;
    private final EmailService emailService;

    public InvoiceController(InvoiceService invoiceService,
                             InvoiceLineRepository lineRepo,
                             InvoicePDFService pdfService,
                             LateFeeService lateFeeService,
                             EmailService emailService) {
        this.invoiceService = invoiceService;
        this.lineRepo       = lineRepo;
        this.pdfService     = pdfService;
        this.lateFeeService = lateFeeService;
        this.emailService   = emailService;
    }

    @GetMapping
    public List<InvoiceDTO> all() {
        return invoiceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDTO> get(@PathVariable Long id) {
        return invoiceService.findById(id)
                .map(inv -> ResponseEntity.ok(InvoiceDTO.fromEntity(inv)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InvoiceDTO> create(@RequestBody Invoice invoice) {
        Invoice saved = invoiceService.save(invoice);
        emailService.sendInvoiceEmail(saved);
        return ResponseEntity.ok(InvoiceDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceDTO> update(@PathVariable Long id, @RequestBody Invoice invoice) {
        return invoiceService.findById(id).map(existing -> {
            invoice.setId(id);
            return ResponseEntity.ok(InvoiceDTO.fromEntity(invoiceService.save(invoice)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (invoiceService.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/case/{caseId}")
    public List<InvoiceDTO> byCase(@PathVariable Long caseId) {
        return invoiceService.findByCase(caseId);
    }

    // ── Line items ─────────────────────────────────────────────────────────

    @GetMapping("/{id}/lines")
    public List<InvoiceLineDTO> getLines(@PathVariable Long id) {
        return lineRepo.findByInvoice_Id(id).stream()
                .map(InvoiceLineDTO::fromEntity).collect(Collectors.toList());
    }

    @PostMapping("/{id}/lines")
    public ResponseEntity<InvoiceLineDTO> addLine(@PathVariable Long id,
                                                   @RequestBody InvoiceLine line) {
        return invoiceService.findById(id).map(inv -> {
            line.setInvoice(inv);
            InvoiceLine saved = lineRepo.save(line);
            inv.getInvoiceLines().add(saved);
            inv.recalculate();
            invoiceService.save(inv);
            return ResponseEntity.ok(InvoiceLineDTO.fromEntity(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/lines/{lineId}")
    public ResponseEntity<InvoiceLineDTO> updateLine(@PathVariable Long id,
                                                      @PathVariable Long lineId,
                                                      @RequestBody InvoiceLine line) {
        return lineRepo.findById(lineId).map(existing -> {
            existing.setDescription(line.getDescription());
            existing.setQuantity(line.getQuantity());
            existing.setUnitPrice(line.getUnitPrice());
            if (line.getType() != null) existing.setType(line.getType());
            return ResponseEntity.ok(InvoiceLineDTO.fromEntity(lineRepo.save(existing)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    public ResponseEntity<Void> deleteLine(@PathVariable Long id, @PathVariable Long lineId) {
        lineRepo.deleteById(lineId);
        return ResponseEntity.noContent().build();
    }

    // ── PDF export ─────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        return invoiceService.findById(id).map(invoice -> {
            byte[] pdf = pdfService.generateInvoicePDF(invoice);
            String filename = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "FA-" + id;
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".pdf\"")
                    .body(pdf);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Email ──────────────────────────────────────────────────────────────

    @PostMapping("/{id}/send-email")
    public ResponseEntity<Void> resendEmail(@PathVariable Long id) {
        return invoiceService.findById(id).map(invoice -> {
            emailService.sendInvoiceEmail(invoice);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Late fees ──────────────────────────────────────────────────────────

    @GetMapping("/{id}/late-fees")
    public List<LateFeeRecordDTO> getLateFees(@PathVariable Long id) {
        return lateFeeService.findByInvoiceId(id).stream()
                .map(LateFeeRecordDTO::fromEntity).collect(Collectors.toList());
    }

    @PostMapping("/{id}/late-fees/apply")
    public ResponseEntity<LateFeeRecordDTO> applyLateFee(@PathVariable Long id) {
        return invoiceService.findById(id).map(invoice -> {
            LateFeeRecord record = lateFeeService.applyLateFee(invoice);
            return ResponseEntity.ok(LateFeeRecordDTO.fromEntity(record));
        }).orElse(ResponseEntity.notFound().build());
    }
}
