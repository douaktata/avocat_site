package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.DeadlineStatus;
import com.example.monpremiersite.entities.LegalDeadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LegalDeadlineRepository extends JpaRepository<LegalDeadline, Long> {
    List<LegalDeadline> findByCaseEntityIdc(Long caseId);
    List<LegalDeadline> findByStatutIn(List<DeadlineStatus> statuts);
    List<LegalDeadline> findByDeadlineDateBetween(LocalDate start, LocalDate end);
    List<LegalDeadline> findByDeadlineDateBeforeAndStatutNot(LocalDate date, DeadlineStatus statut);
}
