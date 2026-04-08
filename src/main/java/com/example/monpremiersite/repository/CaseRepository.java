package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.CaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

    List<CaseEntity> findByUser_Idu(Long userId);
}
