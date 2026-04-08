package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByRecipientIduAndSentFalseOrderByReminderDateAsc(Long userId);
    List<Reminder> findByReminderDateBeforeAndSentFalse(LocalDateTime date);
    List<Reminder> findByEvenementId(Long eventId);
    List<Reminder> findByLegalDeadlineId(Long deadlineId);
}
