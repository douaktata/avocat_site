package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.EvenementDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SharedAgendaService {

    private final EvenementRepository evenementRepo;
    private final AppointmentRepository appointmentRepo;
    private final UserRepository userRepo;

    public SharedAgendaService(EvenementRepository evenementRepo,
                                AppointmentRepository appointmentRepo,
                                UserRepository userRepo) {
        this.evenementRepo = evenementRepo;
        this.appointmentRepo = appointmentRepo;
        this.userRepo = userRepo;
    }

    // ── Vue agenda de tous les avocats pour un jour donné ────────────────────

    public Map<Long, List<EvenementDTO>> getAllLawyersAgenda(LocalDate date) {
        var start = date.atStartOfDay();
        var end = date.atTime(LocalTime.MAX);

        Map<Long, List<EvenementDTO>> result = new HashMap<>();

        List<Evenement> events = evenementRepo.findAll().stream()
                .filter(e -> e.getDateDebut() != null
                        && !e.getDateDebut().isBefore(start)
                        && !e.getDateDebut().isAfter(end))
                .collect(Collectors.toList());

        for (Evenement e : events) {
            if (e.getAvocat() == null) continue;
            Long avocatId = e.getAvocat().getIdu();
            result.computeIfAbsent(avocatId, k -> new java.util.ArrayList<>())
                    .add(EvenementDTO.fromEntity(e));
        }
        return result;
    }

    // ── Réassigner un événement à un autre avocat ────────────────────────────

    @Transactional
    public EvenementDTO reassignEvent(Long eventId, Long newAvocatId) {
        Evenement ev = evenementRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable: " + eventId));

        // Les audiences ne peuvent pas être réassignées
        if (ev.getType() == TypeEvenement.AUDIENCE) {
            throw new IllegalStateException("Les audiences ne peuvent pas être réassignées.");
        }

        User newAvocat = userRepo.findById(newAvocatId)
                .orElseThrow(() -> new RuntimeException("Avocat introuvable: " + newAvocatId));

        ev.setAvocat(newAvocat);
        Evenement saved = evenementRepo.save(ev);

        // If it's linked to an appointment, update the appointment's avocat too
        if (ev.getAppointmentId() != null) {
            appointmentRepo.findById(ev.getAppointmentId()).ifPresent(apt -> {
                apt.setAvocat(newAvocat);
                appointmentRepo.save(apt);
            });
        }

        return EvenementDTO.fromEntity(saved);
    }
}
