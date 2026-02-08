package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.CaseNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaseNoteRepository extends JpaRepository<CaseNote, Long> {

}
