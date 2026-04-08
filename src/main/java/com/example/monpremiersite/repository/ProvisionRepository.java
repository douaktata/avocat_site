package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProvisionRepository extends JpaRepository<Provision, Long> {
    List<Provision> findByCaseEntityIdc(Long caseId);
    List<Provision> findByCaseEntityIdcAndStatus(Long caseId, ProvisionStatus status);
    List<Provision> findByClientIdu(Long clientId);
    long countByProvisionNumberStartingWith(String prefix);
}
