package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.*;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.events.AppointmentCreatedEvent;
import com.example.monpremiersite.events.AudienceCreatedEvent;
import com.example.monpremiersite.events.TaskCreatedEvent;
import com.example.monpremiersite.repository.*;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EvenementService {

    private final EvenementRepository evenementRepo;
    private final UserRepository userRepo;
    private final CaseRepository caseRepo;
    private final LegalDeadlineRepository deadlineRepo;
    private final TaskRepository taskRepo;

    public EvenementService(EvenementRepository evenementRepo,
                            UserRepository userRepo,
                            CaseRepository caseRepo,
                            LegalDeadlineRepository deadlineRepo,
                            TaskRepository taskRepo) {
        this.evenementRepo = evenementRepo;
        this.userRepo = userRepo;
        this.caseRepo = caseRepo;
        this.deadlineRepo = deadlineRepo;
        this.taskRepo = taskRepo;
    }

    // ── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public EvenementDTO createEvenement(EvenementCreateDTO dto) {
        Evenement e = new Evenement();
        mapCreateDtoToEntity(dto, e);
        return EvenementDTO.fromEntity(evenementRepo.save(e));
    }

    @Transactional
    public EvenementDTO updateEvenement(Long id, EvenementUpdateDTO dto) {
        Evenement e = evenementRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement introuvable: " + id));
        if (dto.titre != null) e.setTitre(dto.titre);
        if (dto.description != null) e.setDescription(dto.description);
        if (dto.dateDebut != null) e.setDateDebut(dto.dateDebut);
        if (dto.dateFin != null) e.setDateFin(dto.dateFin);
        if (dto.allDay != null) e.setAllDay(dto.allDay);
        if (dto.location != null) e.setLocation(dto.location);
        if (dto.statut != null) e.setStatut(StatutEvenement.valueOf(dto.statut));
        return EvenementDTO.fromEntity(evenementRepo.save(e));
    }

    @Transactional
    public void deleteEvenement(Long id) {
        evenementRepo.deleteById(id);
    }

    public Optional<EvenementDTO> getById(Long id) {
        return evenementRepo.findById(id).map(EvenementDTO::fromEntity);
    }

    public List<EvenementDTO> getAll(Long avocatId, String type, LocalDateTime dateDebut,
                                     LocalDateTime dateFin, String statut) {
        List<Evenement> list;
        if (avocatId != null && dateDebut != null && dateFin != null) {
            list = evenementRepo.findByAvocatIduAndDateDebutBetween(avocatId, dateDebut, dateFin);
        } else if (avocatId != null) {
            list = evenementRepo.findByAvocatIduAndStatutNot(avocatId, StatutEvenement.ANNULE);
        } else {
            list = evenementRepo.findAll();
        }
        return list.stream().map(EvenementDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Calendar views ──────────────────────────────────────────────────────

    public List<EvenementDTO> getByDay(Long avocatId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return evenementRepo.findByAvocatIduAndDateDebutBetween(avocatId, start, end)
                .stream().map(EvenementDTO::fromEntity).collect(Collectors.toList());
    }

    public List<EvenementDTO> getByWeek(Long avocatId, LocalDate weekStart) {
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekStart.plusDays(7).atTime(LocalTime.MAX);
        return evenementRepo.findByAvocatIduAndDateDebutBetween(avocatId, start, end)
                .stream().map(EvenementDTO::fromEntity).collect(Collectors.toList());
    }

    public List<EvenementDTO> getByMonth(Long avocatId, int year, int month) {
        LocalDate first = LocalDate.of(year, month, 1);
        LocalDateTime start = first.atStartOfDay();
        LocalDateTime end = first.plusMonths(1).atStartOfDay();
        return evenementRepo.findByAvocatIduAndDateDebutBetween(avocatId, start, end)
                .stream().map(EvenementDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Conflict detection ──────────────────────────────────────────────────

    public List<ConflictDTO> detectConflicts(Long avocatId, LocalDateTime debut, LocalDateTime fin) {
        return evenementRepo.findConflicts(avocatId, debut, fin)
                .stream().map(ConflictDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Daily brief ─────────────────────────────────────────────────────────

    public DailyBriefDTO getDailyBrief(Long avocatId) {
        LocalDate today = LocalDate.now();
        DailyBriefDTO brief = new DailyBriefDTO();
        brief.date = today;

        List<EvenementDTO> todayEvents = getByDay(avocatId, today);
        brief.audiencesToday = todayEvents.stream()
                .filter(e -> "AUDIENCE".equals(e.type))
                .collect(Collectors.toList());
        brief.appointmentsToday = todayEvents.stream()
                .filter(e -> "RDV_CLIENT".equals(e.type))
                .collect(Collectors.toList());
        brief.totalEvents = todayEvents.size();

        // Upcoming deadlines (J-7)
        LocalDate deadline7 = today.plusDays(7);
        brief.upcomingDeadlines = deadlineRepo.findByDeadlineDateBetween(today, deadline7)
                .stream().map(LegalDeadlineDTO::fromEntity).collect(Collectors.toList());

        // Overdue tasks
        brief.overdueTasks = taskRepo.findAll().stream()
                .filter(t -> t.getDeadline() != null
                        && t.getDeadline().isBefore(LocalDateTime.now())
                        && t.getStatus() != TaskStatus.COMPLETED)
                .map(t -> {
                    var m = new java.util.HashMap<String, Object>();
                    m.put("id", t.getId());
                    m.put("title", t.getTitle());
                    m.put("deadline", t.getDeadline());
                    m.put("status", t.getStatus());
                    return (Object) m;
                })
                .collect(Collectors.toList());

        return brief;
    }

    // ── Sync from existing entities (EventListeners) ────────────────────────

    @EventListener
    @Transactional
    public void syncFromAudience(AudienceCreatedEvent event) {
        Audience audience = event.getAudience();
        syncAudienceToEvenement(audience);
    }

    @EventListener
    @Transactional
    public void syncFromAppointment(AppointmentCreatedEvent event) {
        Appointment apt = event.getAppointment();
        syncAppointmentToEvenement(apt);
    }

    @EventListener
    @Transactional
    public void syncFromTask(TaskCreatedEvent event) {
        Task task = event.getTask();
        if (task.getDeadline() == null) return;
        syncTaskToEvenement(task);
    }

    // ── Public sync methods (called by AudienceAgendaService etc.) ──────────

    @Transactional
    public Evenement syncAudienceToEvenement(Audience audience) {
        // Check if mirror already exists
        List<Evenement> existing = evenementRepo.findByAudienceId(audience.getId());
        Evenement e = existing.isEmpty() ? new Evenement() : existing.get(0);

        e.setTitre("Audience – " + (audience.getCaseEntity() != null
                ? audience.getCaseEntity().getCase_number() : "Dossier ?"));
        e.setDescription(audience.getDescription());
        e.setType(TypeEvenement.AUDIENCE);
        e.setPriorite(Priorite.P0);
        e.setCouleur("#DC2626");
        e.setDateDebut(audience.getHearingDate());
        e.setDateFin(audience.getHearingDate() != null
                ? audience.getHearingDate().plusHours(2) : null);
        e.setLocation(audience.getRoomNumber());
        e.setAudienceId(audience.getId());
        e.setStatut(mapAudienceStatut(audience.getStatus()));

        // Set avocat from case
        if (audience.getCaseEntity() != null && audience.getCaseEntity().getUser() != null) {
            // The case user is the client; we use a heuristic to get the lawyer
            e.setCaseEntity(audience.getCaseEntity());
            // Try to find lawyer from case
            User caseUser = audience.getCaseEntity().getUser();
            // Use the case's assigned avocat if set, otherwise the case user
            e.setAvocat(caseUser);
            e.setCreatedBy(caseUser.getIdu());
        }

        return evenementRepo.save(e);
    }

    @Transactional
    public Evenement syncAppointmentToEvenement(Appointment apt) {
        List<Evenement> existing = evenementRepo.findByAppointmentId(apt.getIda());
        Evenement e = existing.isEmpty() ? new Evenement() : existing.get(0);

        e.setTitre("RDV – " + (apt.getUser() != null
                ? apt.getUser().getPrenom() + " " + apt.getUser().getNom() : "Client ?"));
        e.setDescription(apt.getReason());
        e.setType(TypeEvenement.RDV_CLIENT);
        e.setPriorite(Priorite.P2);
        e.setCouleur("#2563EB");
        e.setDateDebut(apt.getAppointment_date());
        e.setDateFin(apt.getEndTime() != null ? apt.getEndTime()
                : (apt.getAppointment_date() != null ? apt.getAppointment_date().plusHours(1) : null));
        e.setAppointmentId(apt.getIda());
        e.setClient(apt.getUser());
        e.setStatut("CONFIRMED".equalsIgnoreCase(apt.getStatus())
                ? StatutEvenement.CONFIRME : StatutEvenement.PLANIFIE);

        if (apt.getAvocat() != null) {
            e.setAvocat(apt.getAvocat());
            e.setCreatedBy(apt.getAvocat().getIdu());
        } else if (apt.getUser() != null) {
            e.setAvocat(apt.getUser());
            e.setCreatedBy(apt.getUser().getIdu());
        }

        if (apt.getCaseEntity() != null) e.setCaseEntity(apt.getCaseEntity());

        return evenementRepo.save(e);
    }

    @Transactional
    public Evenement syncTaskToEvenement(Task task) {
        List<Evenement> existing = evenementRepo.findByTaskId(task.getId());
        Evenement e = existing.isEmpty() ? new Evenement() : existing.get(0);

        e.setTitre(task.getTitle());
        e.setDescription(task.getDescription());
        e.setType(TypeEvenement.TACHE_PERSONNELLE);
        e.setPriorite(Priorite.P4);
        e.setCouleur("#16A34A");
        e.setDateDebut(task.getDeadline());
        e.setDateFin(task.getDeadline() != null ? task.getDeadline().plusHours(1) : null);
        e.setTaskId(task.getId());
        e.setStatut(task.getStatus() == TaskStatus.COMPLETED
                ? StatutEvenement.TERMINE : StatutEvenement.PLANIFIE);

        if (task.getAssignedTo() != null) {
            e.setAvocat(task.getAssignedTo());
            e.setCreatedBy(task.getAssignedTo().getIdu());
        }

        return evenementRepo.save(e);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void mapCreateDtoToEntity(EvenementCreateDTO dto, Evenement e) {
        e.setTitre(dto.titre);
        e.setDescription(dto.description);
        if (dto.type != null) e.setType(TypeEvenement.valueOf(dto.type));
        e.setDateDebut(dto.dateDebut);
        e.setDateFin(dto.dateFin);
        e.setAllDay(dto.allDay != null ? dto.allDay : false);
        e.setLocation(dto.location);
        if (dto.recurrence != null) e.setRecurrence(Recurrence.valueOf(dto.recurrence));
        e.setRecurrenceEndDate(dto.recurrenceEndDate);

        if (dto.avocatId != null) {
            userRepo.findById(dto.avocatId).ifPresent(u -> {
                e.setAvocat(u);
                e.setCreatedBy(u.getIdu());
            });
        }
        if (dto.clientId != null) userRepo.findById(dto.clientId).ifPresent(e::setClient);
        if (dto.caseId != null) caseRepo.findById(dto.caseId).ifPresent(e::setCaseEntity);

        // Set priority & color from type
        if (dto.type != null) {
            TypeEvenement type = TypeEvenement.valueOf(dto.type);
            e.setPriorite(switch (type) {
                case AUDIENCE -> Priorite.P0;
                case ECHEANCE_LEGALE -> Priorite.P1;
                case RDV_CLIENT -> Priorite.P2;
                case REUNION_INTERNE -> Priorite.P3;
                case TACHE_PERSONNELLE -> Priorite.P4;
            });
        }
    }

    private StatutEvenement mapAudienceStatut(String status) {
        if (status == null) return StatutEvenement.PLANIFIE;
        return switch (status.toUpperCase()) {
            case "SCHEDULED" -> StatutEvenement.PLANIFIE;
            case "COMPLETED" -> StatutEvenement.TERMINE;
            case "POSTPONED" -> StatutEvenement.REPORTE;
            case "CANCELLED" -> StatutEvenement.ANNULE;
            default -> StatutEvenement.PLANIFIE;
        };
    }
}
