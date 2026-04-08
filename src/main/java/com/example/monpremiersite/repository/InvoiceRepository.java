package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Invoice;
import com.example.monpremiersite.entities.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByClient_Idu(Long clientId);
    List<Invoice> findByStatus(InvoiceStatus status);
    List<Invoice> findByCaseEntity_IdcOrderByCreatedAtDesc(Long caseId);
    List<Invoice> findByCaseEntity_Idc(Long caseId);
    List<Invoice> findByCaseEntity_IdcAndStatusIn(Long caseId, List<InvoiceStatus> statuses);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    long countByInvoiceNumberStartingWith(String prefix);

    @Query("SELECT i FROM Invoice i WHERE i.status IN ('ISSUED', 'PARTIAL') AND i.dueDate < :threshold")
    List<Invoice> findOverdueEligibleForLateFee(@Param("threshold") LocalDate threshold);

    @Query("SELECT i FROM Invoice i WHERE i.status IN ('ISSUED', 'PARTIAL') AND i.dueDate < :threshold")
    List<Invoice> findEligibleForReminderByThreshold(@Param("threshold") LocalDate threshold);

    default List<Invoice> findEligibleForReminder(LocalDate threshold, int stage, LocalDate minGap) {
        return findEligibleForReminderByThreshold(threshold);
    }
}
