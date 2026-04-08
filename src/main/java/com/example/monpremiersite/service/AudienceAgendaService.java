package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.*;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AudienceAgendaService {

    private final AudienceRepository audienceRepo;
    private final PostponeHistoryRepository historyRepo;
    private final EvenementRepository evenementRepo;
    private final EvenementService evenementService;
    private final ReminderService reminderService;
    private final LegalDeadlineRepository deadlineRepo;
    private final CaseRepository caseRepo;
    private final UserRepository userRepo;

    public AudienceAgendaService(AudienceRepository audienceRepo,
                                  PostponeHistoryRepository historyRepo,
                                  EvenementRepository evenementRepo,
                                  EvenementService evenementService,
                                  ReminderService reminderService,
                                  LegalDeadlineRepository deadlineRepo,
                                  CaseRepository caseRepo,
                                  UserRepository userRepo) {
        this.audienceRepo = audienceRepo;
        this.historyRepo = historyRepo;
        this.evenementRepo = evenementRepo;
        this.evenementService = evenementService;
        this.reminderService = reminderService;
        this.deadlineRepo = deadlineRepo;
        this.caseRepo = caseRepo;
        this.userRepo = userRepo;
    }

    // ── Report d'audience (workflow complet) ─────────────────────────────────

    @Transactional
    public PostponeResultDTO postponeAudience(Long audienceId, LocalDateTime newDateTime,
                                              String reason, Long performedByUserId) {
        // a) Récupérer l'audience
        Audience audience = audienceRepo.findById(audienceId)
                .orElseThrow(() -> new RuntimeException("Audience introuvable: " + audienceId));
        if (!"SCHEDULED".equals(audience.getStatus())) {
            throw new IllegalStateException("Seules les audiences SCHEDULED peuvent être reportées. Statut actuel: " + audience.getStatus());
        }

        LocalDateTime oldDate = audience.getHearingDate();

        // b) Sauvegarder PostponeHistory
        PostponeHistory history = new PostponeHistory();
        history.setAudience(audience);
        history.setDateBefore(oldDate);
        history.setDateAfter(newDateTime);
        history.setReason(reason);
        if (performedByUserId != null) {
            userRepo.findById(performedByUserId).ifPresent(history::setPerformedBy);
        }

        // c) Mettre à jour l'audience existante
        if (audience.getOriginalHearingDate() == null) {
            audience.setOriginalHearingDate(oldDate);
        }
        audience.setStatus("POSTPONED");
        audience.setPostponeReason(reason);
        audience.setPostponedDate(LocalDateTime.now());
        audience.setPostponeCount((audience.getPostponeCount() == null ? 0 : audience.getPostponeCount()) + 1);
        audienceRepo.save(audience);

        // e) Mettre à jour l'Evenement miroir de l'ancienne audience
        List<Evenement> oldEvents = evenementRepo.findByAudienceId(audienceId);
        for (Evenement ev : oldEvents) {
            ev.setStatut(StatutEvenement.REPORTE);
            evenementRepo.save(ev);
        }

        // g) Détecter conflits sur la nouvelle date (créneau de 2h)
        // First find the avocat
        Long avocatId = null;
        if (audience.getCaseEntity() != null && audience.getCaseEntity().getUser() != null) {
            avocatId = audience.getCaseEntity().getUser().getIdu();
        }

        List<ImpactedEventDTO> impactedEvents = new ArrayList<>();
        boolean alertDoubleAudience = false;

        if (avocatId != null) {
            LocalDateTime slotEnd = newDateTime.plusHours(2);
            List<Evenement> conflicts = evenementRepo.findConflicts(avocatId, newDateTime, slotEnd);
            for (Evenement conflict : conflicts) {
                if (conflict.getPriorite() == Priorite.P0) {
                    // Autre audience — alerte manuelle uniquement
                    alertDoubleAudience = true;
                } else {
                    // Priorité inférieure → A_REPLANIFIER
                    String oldStatus = conflict.getStatut().name();
                    conflict.setStatut(StatutEvenement.A_REPLANIFIER);
                    evenementRepo.save(conflict);
                    impactedEvents.add(new ImpactedEventDTO(
                            conflict.getId(), conflict.getTitre(), conflict.getType().name(),
                            oldStatus, StatutEvenement.A_REPLANIFIER.name(),
                            conflict.getClient() != null
                                    ? conflict.getClient().getNom() + " " + conflict.getClient().getPrenom()
                                    : null
                    ));
                }
            }
        }

        // Record impacted events in history
        if (!impactedEvents.isEmpty()) {
            history.setImpactedEvents(buildImpactedJson(impactedEvents));
        }
        historyRepo.save(history);

        // d) Créer une NOUVELLE audience
        Audience newAudience = new Audience();
        newAudience.setCaseEntity(audience.getCaseEntity());
        newAudience.setTribunal(audience.getTribunal());
        newAudience.setHearingType(audience.getHearingType());
        newAudience.setJudgeName(audience.getJudgeName());
        newAudience.setRoomNumber(audience.getRoomNumber());
        newAudience.setDescription(audience.getDescription());
        newAudience.setHearingDate(newDateTime);
        newAudience.setStatus("SCHEDULED");
        newAudience.setPreviousAudience(audience);
        newAudience.setOriginalHearingDate(
                audience.getOriginalHearingDate() != null
                        ? audience.getOriginalHearingDate() : oldDate);
        newAudience.setRequiredDocuments(audience.getRequiredDocuments());
        Audience saved = audienceRepo.save(newAudience);

        // f) Créer nouvel Evenement miroir pour la nouvelle audience
        evenementService.syncAudienceToEvenement(saved);

        // h) Créer rappels pour la nouvelle audience
        reminderService.createAudienceReminders(saved);

        // i) Supprimer anciens rappels de l'ancienne audience
        oldEvents.forEach(ev -> reminderService.deleteRemindersForEvent(ev.getId()));

        return new PostponeResultDTO(
                saved.getId(), newDateTime, impactedEvents, alertDoubleAudience,
                audience.getPostponeCount()
        );
    }

    // ── Terminer une audience ────────────────────────────────────────────────

    @Transactional
    public AudienceDTO completeAudience(Long audienceId, String result, String notes) {
        Audience audience = audienceRepo.findById(audienceId)
                .orElseThrow(() -> new RuntimeException("Audience introuvable: " + audienceId));

        audience.setStatus("COMPLETED");
        audience.setNotes(notes);
        audienceRepo.save(audience);

        // Mettre à jour l'Evenement miroir
        evenementRepo.findByAudienceId(audienceId).forEach(ev -> {
            ev.setStatut(StatutEvenement.TERMINE);
            evenementRepo.save(ev);
        });

        // Générer automatiquement une échéance de délai d'appel si applicable
        String hearingType = audience.getHearingType();
        if (hearingType != null &&
                (hearingType.contains("PREMIERE_INSTANCE") || hearingType.contains("APPEL")
                        || hearingType.contains("HEARING") || hearingType.contains("CONSULTATION"))) {
            LegalDeadline deadline = new LegalDeadline();
            deadline.setCaseEntity(audience.getCaseEntity());
            deadline.setType(DeadlineType.DELAI_APPEL);
            deadline.setDescription("Délai d'appel – audience du " +
                    (audience.getHearingDate() != null ? audience.getHearingDate().toLocalDate() : "?"));
            deadline.setDeadlineDate(
                    audience.getHearingDate() != null
                            ? audience.getHearingDate().toLocalDate().plusDays(30)
                            : java.time.LocalDate.now().plusDays(30));
            deadline.setAutoGenerated(true);
            deadline.setSourceEventId(audienceId);
            LegalDeadline saved = deadlineRepo.save(deadline);
            reminderService.createDeadlineReminders(saved);
        }

        return AudienceDTO.fromEntity(audience);
    }

    // ── Historique des reports ───────────────────────────────────────────────

    public List<PostponeHistoryDTO> getPostponeHistory(Long audienceId) {
        return historyRepo.findByAudienceIdOrderByCreatedAtDesc(audienceId)
                .stream().map(PostponeHistoryDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Prochaines audiences ─────────────────────────────────────────────────

    public List<AudienceDTO> getUpcomingAudiences() {
        return audienceRepo.findAll().stream()
                .filter(a -> "SCHEDULED".equals(a.getStatus())
                        && a.getHearingDate() != null
                        && a.getHearingDate().isAfter(LocalDateTime.now()))
                .sorted((a, b) -> a.getHearingDate().compareTo(b.getHearingDate()))
                .map(AudienceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String buildImpactedJson(List<ImpactedEventDTO> events) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < events.size(); i++) {
            ImpactedEventDTO e = events.get(i);
            sb.append(String.format(
                    "{\"eventId\":%d,\"titre\":\"%s\",\"type\":\"%s\",\"oldStatus\":\"%s\",\"newStatus\":\"%s\"}",
                    e.eventId, safe(e.titre), safe(e.type), safe(e.oldStatus), safe(e.newStatus)));
            if (i < events.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String safe(String s) {
        return s != null ? s.replace("\"", "'") : "";
    }
}
