package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.CaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

}
