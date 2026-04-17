package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.ContractHistory;
import com.example.monpremiersite.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContractHistoryRepository extends JpaRepository<ContractHistory, Long> {
    List<ContractHistory> findByUserIduOrderByCreatedAtDesc(Long userId);
    List<ContractHistory> findByCaseEntityIdcOrderByCreatedAtDesc(Long caseId);
    List<ContractHistory> findByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
}
