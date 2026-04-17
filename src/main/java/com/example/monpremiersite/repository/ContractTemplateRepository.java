package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.ContractTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContractTemplateRepository extends JpaRepository<ContractTemplate, Long> {
    List<ContractTemplate> findByActiveTrue();
}
