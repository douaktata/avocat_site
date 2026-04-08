package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.ReminderDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.ReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepo;

    public ReminderService(ReminderRepository reminderRepo) {
        this.reminderRepo = reminderRepo;
    }

    // ── Audience reminders: J-7, J-2, J-1, Jour J à 7h ─────────────────────

    @Transactional
    public void createAudienceReminders(Audience audience) {
        if (audience.getHearingDate() == null) return;
        LocalDateTime hearingDate = audience.getHearingDate();

        // Get the avocat from the case
        User avocat = null;
        if (audience.getCaseEntity() != null && audience.getCaseEntity().getUser() != null) {
            avocat = audience.getCaseEntity().getUser();
        }
        if (avocat == null) return;

        Evenement dummyEvent = new Evenement();
        dummyEvent.setId(audience.getId()); // will be overridden once event is saved

        int[] days = {7, 2, 1};
        String[] labels = {"J-7", "J-2", "J-1"};
        for (int i = 0; i < days.length; i++) {
            createReminder(null, null, avocat,
                    hearingDate.minusDays(days[i]).withHour(8).withMinute(0).withSecond(0),
                    "Rappel " + labels[i] + " : Audience prévue le " + hearingDate.toLocalDate());
        }
        // Jour J à 7h
        createReminder(null, null, avocat,
                hearingDate.withHour(7).withMinute(0).withSecond(0),
                "AUJOURD'HUI : Audience à " + hearingDate.toLocalTime());
    }

    // ── Deadline reminders: J-30, J-7, J-3, J-1, Jour J ────────────────────

    @Transactional
    public void createDeadlineReminders(LegalDeadline deadline) {
        if (deadline.getDeadlineDate() == null) return;
        LocalDateTime dl = deadline.getDeadlineDate().atTime(8, 0);

        // We'd need the avocat — try to get from case
        if (deadline.getCaseEntity() == null || deadline.getCaseEntity().getUser() == null) return;
        User avocat = deadline.getCaseEntity().getUser();

        int[] days = {30, 7, 3, 1};
        for (int d : days) {
            LocalDateTime reminderDate = dl.minusDays(d);
            if (reminderDate.isAfter(LocalDateTime.now())) {
                createReminder(null, deadline, avocat, reminderDate,
                        "Échéance J-" + d + " : " + deadline.getType() + " le " + deadline.getDeadlineDate());
            }
        }
        // Jour J
        createReminder(null, deadline, avocat, dl,
                "AUJOURD'HUI : Échéance " + deadline.getType());
    }

    // ── Appointment reminders: J-1 à 18h, Jour J à 8h ──────────────────────

    @Transactional
    public void createAppointmentReminders(Evenement rdvEvent) {
        if (rdvEvent.getDateDebut() == null) return;
        LocalDateTime rdvDate = rdvEvent.getDateDebut();
        User avocat = rdvEvent.getAvocat();
        if (avocat == null) return;

        createReminder(rdvEvent, null, avocat,
                rdvDate.minusDays(1).withHour(18).withMinute(0).withSecond(0),
                "Rappel J-1 : RDV demain à " + rdvDate.toLocalTime());

        createReminder(rdvEvent, null, avocat,
                rdvDate.withHour(8).withMinute(0).withSecond(0),
                "AUJOURD'HUI : RDV à " + rdvDate.toLocalTime());
    }

    // ── Delete reminders for a cancelled/postponed event ────────────────────

    @Transactional
    public void deleteRemindersForEvent(Long eventId) {
        List<Reminder> reminders = reminderRepo.findByEvenementId(eventId);
        reminderRepo.deleteAll(reminders);
    }

    // ── Get pending reminders for a user ────────────────────────────────────

    public List<ReminderDTO> getMyReminders(Long userId) {
        return reminderRepo.findByRecipientIduAndSentFalseOrderByReminderDateAsc(userId)
                .stream().map(ReminderDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Mark a reminder as read ──────────────────────────────────────────────

    @Transactional
    public ReminderDTO markAsRead(Long reminderId) {
        Reminder r = reminderRepo.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Rappel introuvable: " + reminderId));
        r.setSent(true);
        r.setSentAt(LocalDateTime.now());
        return ReminderDTO.fromEntity(reminderRepo.save(r));
    }

    // ── Scheduled: send due reminders every minute ───────────────────────────

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void sendDueReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Reminder> due = reminderRepo.findByReminderDateBeforeAndSentFalse(now);
        for (Reminder r : due) {
            r.setSent(true);
            r.setSentAt(now);
            reminderRepo.save(r);
            // In-app delivery is handled by polling /api/reminders.
            // EMAIL channel would invoke an email service here.
        }
    }

    // ── Private helper ───────────────────────────────────────────────────────

    private void createReminder(Evenement event, LegalDeadline deadline,
                                User recipient, LocalDateTime reminderDate, String message) {
        if (reminderDate.isBefore(LocalDateTime.now())) return; // skip past dates
        Reminder r = new Reminder();
        r.setEvenement(event);
        r.setLegalDeadline(deadline);
        r.setRecipient(recipient);
        r.setReminderDate(reminderDate);
        r.setChannel(ReminderChannel.IN_APP);
        r.setMessage(message);
        reminderRepo.save(r);
    }
}
