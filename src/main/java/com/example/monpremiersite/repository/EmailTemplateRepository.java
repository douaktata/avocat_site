package com.example.monpremiersite.repository;

import com.example.monpremiersite.entities.EmailTemplate;
import com.example.monpremiersite.entities.ReminderTemplateType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    List<EmailTemplate> findByIsActiveTrue();
    Optional<EmailTemplate> findFirstByTypeAndIsActiveTrue(ReminderTemplateType type);
}
