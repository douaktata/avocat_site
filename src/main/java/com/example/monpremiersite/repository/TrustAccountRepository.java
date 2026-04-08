package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.TrustAccount;
import com.example.monpremiersite.entities.TrustStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrustAccountRepository extends JpaRepository<TrustAccount, Long> {
    List<TrustAccount> findByLegalCase_IdcOrderByCreatedAtDesc(Long caseId);
    Optional<TrustAccount> findFirstByLegalCase_IdcAndStatusInOrderByCreatedAtDesc(Long caseId, List<TrustStatus> statuses);
}
