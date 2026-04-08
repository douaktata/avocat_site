package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.*;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentAgendaService {

    private final AppointmentRepository appointmentRepo;
    private final AvailableSlotRepository slotRepo;
    private final EvenementRepository evenementRepo;
    private final EvenementService evenementService;
    private final ReminderService reminderService;
    private final UserRepository userRepo;
    private final CaseRepository caseRepo;

    public AppointmentAgendaService(AppointmentRepository appointmentRepo,
                                     AvailableSlotRepository slotRepo,
                                     EvenementRepository evenementRepo,
                                     EvenementService evenementService,
                                     ReminderService reminderService,
                                     UserRepository userRepo,
                                     CaseRepository caseRepo) {
        this.appointmentRepo = appointmentRepo;
        this.slotRepo = slotRepo;
        this.evenementRepo = evenementRepo;
        this.evenementService = evenementService;
        this.reminderService = reminderService;
        this.userRepo = userRepo;
        this.caseRepo = caseRepo;
    }

    // ── Soumettre une demande (CLIENT) ───────────────────────────────────────

    @Transactional
    public AppointmentRequestResponseDTO submitRequest(AppointmentRequestDTO dto, Long clientId) {
        Appointment apt = new Appointment();

        userRepo.findById(clientId).ifPresent(apt::setUser);
        if (dto.avocatId != null) userRepo.findById(dto.avocatId).ifPresent(apt::setAvocat);
        if (dto.caseId != null) caseRepo.findById(dto.caseId).ifPresent(apt::setCaseEntity);

        apt.setAppointment_date(dto.dateSouhaitee);
        apt.setReason(dto.reason);
        apt.setStatus("PENDING");
        apt.setRequestStatus(RequestStatus.EN_ATTENTE);
        apt.setCreated_at(LocalDateTime.now());
        if (dto.urgencyLevel != null) {
            try { apt.setUrgencyLevel(NiveauUrgence.valueOf(dto.urgencyLevel)); } catch (Exception ignored) {}
        }

        return AppointmentRequestResponseDTO.fromEntity(appointmentRepo.save(apt));
    }

    // ── Approuver une demande ─────────────────────────────────────────────────

    @Transactional
    public AppointmentRequestResponseDTO approveRequest(Long appointmentId, Long processedByUserId) {
        Appointment apt = findOrThrow(appointmentId);
        apt.setRequestStatus(RequestStatus.APPROUVEE);
        apt.setStatus("CONFIRMED");
        apt.setProcessedBy(processedByUserId);
        apt.setProcessedAt(LocalDateTime.now());
        Appointment saved = appointmentRepo.save(apt);

        // Create agenda event mirror
        Evenement ev = evenementService.syncAppointmentToEvenement(saved);
        reminderService.createAppointmentReminders(ev);

        return AppointmentRequestResponseDTO.fromEntity(saved);
    }

    // ── Refuser une demande ───────────────────────────────────────────────────

    @Transactional
    public AppointmentRequestResponseDTO rejectRequest(Long appointmentId, String reason,
                                                        Long processedByUserId) {
        Appointment apt = findOrThrow(appointmentId);
        apt.setRequestStatus(RequestStatus.REFUSEE);
        apt.setStatus("CANCELLED");
        apt.setRefusalReason(reason);
        apt.setProcessedBy(processedByUserId);
        apt.setProcessedAt(LocalDateTime.now());
        return AppointmentRequestResponseDTO.fromEntity(appointmentRepo.save(apt));
    }

    // ── Contre-proposer ───────────────────────────────────────────────────────

    @Transactional
    public AppointmentRequestResponseDTO counterPropose(Long appointmentId,
                                                         LocalDateTime proposedDate,
                                                         Long processedByUserId) {
        Appointment apt = findOrThrow(appointmentId);
        apt.setRequestStatus(RequestStatus.CONTRE_PROPOSITION);
        apt.setProposedDate(proposedDate);
        apt.setProcessedBy(processedByUserId);
        apt.setProcessedAt(LocalDateTime.now());
        return AppointmentRequestResponseDTO.fromEntity(appointmentRepo.save(apt));
    }

    // ── Liste des demandes ────────────────────────────────────────────────────

    public List<AppointmentRequestResponseDTO> getRequests(Long avocatId, String status) {
        return appointmentRepo.findAll().stream()
                .filter(a -> a.getRequestStatus() != null)
                .filter(a -> avocatId == null || (a.getAvocat() != null && avocatId.equals(a.getAvocat().getIdu())))
                .filter(a -> status == null || (a.getRequestStatus() != null && status.equals(a.getRequestStatus().name())))
                .map(AppointmentRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AppointmentRequestResponseDTO> getMyRequests(Long clientId) {
        return appointmentRepo.findAll().stream()
                .filter(a -> a.getRequestStatus() != null)
                .filter(a -> a.getUser() != null && clientId.equals(a.getUser().getIdu()))
                .map(AppointmentRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Créneaux disponibles ──────────────────────────────────────────────────

    public List<FreeSlotDTO> getAvailableSlots(Long avocatId, LocalDate date) {
        java.time.DayOfWeek dow = date.getDayOfWeek();
        List<AvailableSlot> slots = slotRepo.findByAvocatIduAndDayOfWeek(avocatId, dow);
        List<FreeSlotDTO> freeSlots = new ArrayList<>();

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);
        List<Evenement> existingEvents = evenementRepo.findByAvocatIduAndDateDebutBetween(avocatId, dayStart, dayEnd);

        for (AvailableSlot slot : slots) {
            if (!Boolean.TRUE.equals(slot.getActive())) continue;
            int duration = slot.getDefaultDuration() != null ? slot.getDefaultDuration() : 30;
            LocalTime current = slot.getStartTime();
            while (current != null && current.plusMinutes(duration).compareTo(slot.getEndTime()) <= 0) {
                LocalDateTime slotStart = date.atTime(current);
                LocalDateTime slotEnd = slotStart.plusMinutes(duration);
                // Check if any existing event overlaps this slot
                boolean occupied = existingEvents.stream().anyMatch(ev ->
                        ev.getDateDebut() != null && ev.getDateFin() != null
                                && ev.getDateDebut().isBefore(slotEnd)
                                && ev.getDateFin().isAfter(slotStart));
                if (!occupied) {
                    freeSlots.add(new FreeSlotDTO(date, current, current.plusMinutes(duration), avocatId));
                }
                current = current.plusMinutes(duration);
            }
        }
        return freeSlots;
    }

    // ── CRUD créneaux ─────────────────────────────────────────────────────────

    @Transactional
    public AvailableSlotDTO createSlot(AvailableSlotDTO dto) {
        AvailableSlot s = new AvailableSlot();
        mapDtoToSlot(dto, s);
        return AvailableSlotDTO.fromEntity(slotRepo.save(s));
    }

    @Transactional
    public AvailableSlotDTO updateSlot(Long id, AvailableSlotDTO dto) {
        AvailableSlot s = slotRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Créneau introuvable: " + id));
        mapDtoToSlot(dto, s);
        return AvailableSlotDTO.fromEntity(slotRepo.save(s));
    }

    @Transactional
    public void deleteSlot(Long id) {
        slotRepo.deleteById(id);
    }

    public List<AvailableSlotDTO> getMySlots(Long avocatId) {
        return slotRepo.findByAvocatIduAndActiveTrue(avocatId)
                .stream().map(AvailableSlotDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Appointment findOrThrow(Long id) {
        return appointmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment introuvable: " + id));
    }

    private void mapDtoToSlot(AvailableSlotDTO dto, AvailableSlot s) {
        if (dto.avocatId != null) userRepo.findById(dto.avocatId).ifPresent(s::setAvocat);
        if (dto.dayOfWeek != null && !dto.dayOfWeek.isBlank()) {
            try { s.setDayOfWeek(java.time.DayOfWeek.valueOf(dto.dayOfWeek)); } catch (Exception ignored) {}
        } else if (dto.validFrom != null) {
            // Derive day-of-week from the specific date so the slot is pinned to that day
            s.setDayOfWeek(dto.validFrom.getDayOfWeek());
        }
        s.setStartTime(dto.startTime);
        s.setEndTime(dto.endTime);
        if (dto.defaultDuration != null) s.setDefaultDuration(dto.defaultDuration);
        if (dto.active != null) s.setActive(dto.active);
        s.setValidFrom(dto.validFrom);
        s.setValidUntil(dto.validUntil);
    }
}
