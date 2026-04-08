package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.BillingLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BillingLedgerRepository extends JpaRepository<BillingLedger, Long> {
    List<BillingLedger> findByLegalCase_IdcOrderByCreatedAtAsc(Long caseId);
    Optional<BillingLedger> findTopByLegalCase_IdcOrderByCreatedAtDesc(Long caseId);
}
