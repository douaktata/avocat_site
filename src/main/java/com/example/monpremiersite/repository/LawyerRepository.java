package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Lawyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LawyerRepository extends JpaRepository<Lawyer, Long> {
    Optional<Lawyer> findByUser_Idu(Long userId);
}
