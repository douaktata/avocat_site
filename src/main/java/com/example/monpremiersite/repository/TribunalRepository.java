package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Tribunal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TribunalRepository extends JpaRepository<Tribunal, Long> {
    java.util.List<Tribunal> findByIsActiveTrue();
}
