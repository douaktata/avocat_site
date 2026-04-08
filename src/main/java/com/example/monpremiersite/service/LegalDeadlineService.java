package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.LegalDeadlineCreateDTO;
import com.example.monpremiersite.dto.LegalDeadlineDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.CaseRepository;
import com.example.monpremiersite.repository.LegalDeadlineRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LegalDeadlineService {

    private final LegalDeadlineRepository deadlineRepo;
    private final CaseRepository caseRepo;

    public LegalDeadlineService(LegalDeadlineRepository deadlineRepo, CaseRepository caseRepo) {
        this.deadlineRepo = deadlineRepo;
        this.caseRepo = caseRepo;
    }

    // ── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public LegalDeadlineDTO create(LegalDeadlineCreateDTO dto) {
        LegalDeadline d = new LegalDeadline();
        if (dto.caseId != null) {
            caseRepo.findById(dto.caseId).ifPresent(d::setCaseEntity);
        }
        if (dto.type != null) {
            try { d.setType(DeadlineType.valueOf(dto.type)); } catch (Exception ignored) {}
        }
        d.setDescription(dto.description);
        d.setDeadlineDate(dto.deadlineDate);
        return LegalDeadlineDTO.fromEntity(deadlineRepo.save(d));
    }

    @Transactional
    public LegalDeadlineDTO update(Long id, LegalDeadlineCreateDTO dto) {
        LegalDeadline d = findOrThrow(id);
        if (dto.type != null) {
            try { d.setType(DeadlineType.valueOf(dto.type)); } catch (Exception ignored) {}
        }
        if (dto.description != null) d.setDescription(dto.description);
        if (dto.deadlineDate != null) d.setDeadlineDate(dto.deadlineDate);
        return LegalDeadlineDTO.fromEntity(deadlineRepo.save(d));
    }

    public List<LegalDeadlineDTO> getAll(Long caseId, String statut) {
        List<LegalDeadline> list;
        if (caseId != null) {
            list = deadlineRepo.findByCaseEntityIdc(caseId);
        } else {
            list = deadlineRepo.findAll();
        }
        if (statut != null) {
            try {
                DeadlineStatus ds = DeadlineStatus.valueOf(statut);
                list = list.stream().filter(d -> d.getStatut() == ds).collect(Collectors.toList());
            } catch (Exception ignored) {}
        }
        return list.stream().map(LegalDeadlineDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public LegalDeadlineDTO markRespected(Long id) {
        LegalDeadline d = findOrThrow(id);
        d.setStatut(DeadlineStatus.RESPECTEE);
        return LegalDeadlineDTO.fromEntity(deadlineRepo.save(d));
    }

    public List<LegalDeadlineDTO> getUrgent() {
        LocalDate today = LocalDate.now();
        LocalDate in7 = today.plusDays(7);
        return deadlineRepo.findByDeadlineDateBetween(today, in7).stream()
                .filter(d -> d.getStatut() == DeadlineStatus.EN_COURS || d.getStatut() == DeadlineStatus.URGENT)
                .map(LegalDeadlineDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Scheduled jobs ───────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void checkOverdueDeadlines() {
        LocalDate today = LocalDate.now();
        List<LegalDeadline> overdue = deadlineRepo.findByDeadlineDateBeforeAndStatutNot(
                today, DeadlineStatus.RESPECTEE);
        for (LegalDeadline d : overdue) {
            if (d.getStatut() != DeadlineStatus.DEPASSEE) {
                d.setStatut(DeadlineStatus.DEPASSEE);
                deadlineRepo.save(d);
            }
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void updateUrgentStatus() {
        LocalDate today = LocalDate.now();
        LocalDate in7 = today.plusDays(7);
        List<LegalDeadline> soon = deadlineRepo.findByDeadlineDateBetween(today, in7);
        for (LegalDeadline d : soon) {
            if (d.getStatut() == DeadlineStatus.EN_COURS) {
                d.setStatut(DeadlineStatus.URGENT);
                deadlineRepo.save(d);
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private LegalDeadline findOrThrow(Long id) {
        return deadlineRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Échéance introuvable: " + id));
    }
}
