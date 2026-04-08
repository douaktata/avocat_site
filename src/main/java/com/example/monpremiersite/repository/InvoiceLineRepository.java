package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.InvoiceLine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceLineRepository extends JpaRepository<InvoiceLine, Long> {
    List<InvoiceLine> findByInvoice_Id(Long invoiceId);
}
