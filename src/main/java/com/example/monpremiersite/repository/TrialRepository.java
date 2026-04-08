package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Trial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrialRepository extends JpaRepository<Trial, Long> {

    java.util.List<Trial> findByCaseEntity_Idc(Long caseId);
}
