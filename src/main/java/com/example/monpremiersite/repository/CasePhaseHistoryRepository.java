package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.CasePhaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CasePhaseHistoryRepository extends JpaRepository<CasePhaseHistory, Long> {
    List<CasePhaseHistory> findByCaseEntityIdcOrderByStartedDateDesc(Long caseId);
}
