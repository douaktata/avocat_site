package com.example.monpremiersite.controller;

import com.example.monpremiersite.dto.InvoiceDTO;
import com.example.monpremiersite.service.InvoicePDFService;
import com.example.monpremiersite.service.InvoiceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/client-portal")
public class ClientPortalController {

    private final InvoiceService invoiceService;
    private final InvoicePDFService pdfService;

    public ClientPortalController(InvoiceService invoiceService,
                                  InvoicePDFService pdfService) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;
    }

    /** List all invoices for a given client. */
    @GetMapping("/clients/{clientId}/invoices")
    public List<InvoiceDTO> getInvoices(@PathVariable Long clientId) {
        return invoiceService.findByClientId(clientId).stream()
                .map(InvoiceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /** Download invoice PDF. */
    @GetMapping("/clients/{clientId}/invoices/{invoiceId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long clientId,
                                                     @PathVariable Long invoiceId) {
        return invoiceService.findById(invoiceId)
                .filter(inv -> inv.getClient() != null && inv.getClient().getIdu().equals(clientId))
                .map(invoice -> {
                    byte[] pdf = pdfService.generateInvoicePDF(invoice);
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_PDF)
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "attachment; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                            .body(pdf);
                }).orElse(ResponseEntity.notFound().build());
    }
}
