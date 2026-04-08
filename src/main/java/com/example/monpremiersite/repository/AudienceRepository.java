package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Audience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudienceRepository extends JpaRepository<Audience, Long> {
    List<Audience> findByCaseEntity_IdcOrderByHearingDateAsc(Long caseId);
}
