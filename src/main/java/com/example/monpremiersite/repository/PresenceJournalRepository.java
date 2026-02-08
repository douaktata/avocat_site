package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.PresenceJournal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PresenceJournalRepository extends JpaRepository<PresenceJournal, Long> {
    List<PresenceJournal> findByRecordedBy_Idu(Long recordedById);
    List<PresenceJournal> findByVisitorName(String visitorName);
}
